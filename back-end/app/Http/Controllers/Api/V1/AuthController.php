<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\InvitationCode;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;

class AuthController extends Controller
{
    use ApiResponse;

    /**
     * Register a new user using an invitation code.
     */
    public function register(RegisterRequest $request)
    {
        try {
            return DB::transaction(function () use ($request) {
                // Find the invitation code
                $code = InvitationCode::where('code', $request->invitation_code)
                    ->lockForUpdate()
                    ->firstOrFail();

                // Check if code is still available
                if (!$code->isAvailable()) {
                    return $this->error('This invitation code is expired or already used.', 422);
                }

                // Create the user
                $user = User::create([
                    'name' => $request->name,
                    'email' => $request->email,
                    'phone' => $request->phone,
                    'password' => Hash::make($request->password),
                    'role_id' => $code->role_id,
                    'is_active' => true,
                ]);

                // Mark code as used
                $code->update([
                    'is_used' => true,
                    'used_by' => $user->id,
                    'used_at' => now(),
                ]);

                // Load the role relationship
                $user->load('role');

                // Create API token
                $token = $user->createToken('api-token')->plainTextToken;

                // Format user data for frontend
                $userData = [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'role' => $user->role?->name ?? 'user',
                    'role_id' => $user->role_id,
                    'avatar' => $user->avatar,
                    'is_active' => $user->is_active,
                    'created_at' => $user->created_at,
                ];

                return $this->success([
                    'user' => $userData,
                    'token' => $token,
                ], 'Registration successful.', 201);
            });
        } catch (\Exception $e) {
            Log::error('Register error: ' . $e->getMessage());
            return $this->error('Registration failed: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Login user and create token.
     */
    public function login(LoginRequest $request)
    {
        try {
            // Find user by email with role
            $user = User::with('role')->where('email', $request->email)->first();

            // Check credentials
            if (!$user || !Hash::check($request->password, $user->password)) {
                return $this->error('Invalid credentials.', 401);
            }

            // Check if account is active
            if (!$user->is_active) {
                return $this->error('Your account has been deactivated.', 403);
            }

            // Revoke all previous tokens (optional)
            $user->tokens()->delete();

            // Create new token
            $token = $user->createToken('api-token')->plainTextToken;

            // Format user data for frontend
            $userData = [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role?->name ?? 'user',
                'role_id' => $user->role_id,
                'avatar' => $user->avatar,
                'is_active' => $user->is_active,
                'created_at' => $user->created_at,
            ];

            return $this->success([
                'user' => $userData,
                'token' => $token,
            ], 'Login successful.');
        } catch (\Exception $e) {
            Log::error('Login error: ' . $e->getMessage());
            return $this->error('Login failed: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Logout user (revoke current token).
     */
    public function logout(Request $request)
    {
        try {
            $user = $request->user();
            if ($user && $user->currentAccessToken()) {
                $user->currentAccessToken()->delete();
            }
            return $this->success(null, 'Logged out successfully.');
        } catch (\Exception $e) {
            Log::error('Logout error: ' . $e->getMessage());
            return $this->error('Logout failed: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get authenticated user profile.
     */
    public function me(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return $this->error('User not authenticated', 401);
            }
            
            $user->load('role');

            // Format user data for frontend
            $userData = [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role?->name ?? 'user',
                'role_id' => $user->role_id,
                'avatar' => $user->avatar,
                'is_active' => $user->is_active,
                'created_at' => $user->created_at,
            ];

            return $this->success($userData, 'User profile retrieved.');
        } catch (\Exception $e) {
            Log::error('Me method error: ' . $e->getMessage());
            return $this->error('Error fetching user profile: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Validate an invitation code
     * GET /api/v1/auth/invitation-codes/validate/{code}
     */
    public function validateInvitationCode($code)
    {
        try {
            $invitationCode = InvitationCode::where('code', $code)
                ->where('expires_at', '>', now())
                ->where('is_used', false)
                ->first();

            if (!$invitationCode) {
                return response()->json([
                    'valid' => false,
                    'message' => 'Code d\'invitation invalide ou expiré'
                ]);
            }

            return response()->json([
                'valid' => true,
                'role' => $invitationCode->role?->name ?? 'user',
                'role_id' => $invitationCode->role_id
            ]);
        } catch (\Exception $e) {
            Log::error('Validate code error: ' . $e->getMessage());
            return response()->json([
                'valid' => false,
                'message' => 'Error validating code'
            ], 500);
        }
    }

    /**
     * Verify token for Socket.io server
     * POST /api/verify-token
     */
    public function verifyToken(Request $request)
    {
        try {
            $request->validate([
                'token' => 'required|string',
            ]);

            $token = $request->token;
            
            // Find token in database
            $accessToken = PersonalAccessToken::findToken($token);
            
            if (!$accessToken) {
                return response()->json([
                    'error' => 'Invalid token'
                ], 401);
            }
            
            $user = $accessToken->tokenable;
            
            if (!$user) {
                return response()->json([
                    'error' => 'User not found'
                ], 401);
            }
            
            return response()->json([
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar' => $user->avatar,
                    'role' => $user->role?->name ?? 'user',
                    'is_active' => $user->is_active,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Verify token error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Token verification failed'
            ], 500);
        }
    }
}
