<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\SchoolClass;
use App\Services\InvitationCodeService;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class UserController extends Controller
{
    use ApiResponse;

    /**
     * Display a listing of users.
     */
    public function index(Request $request)
    {
        try {
            $users = User::with('role')
                ->when($request->role, fn($q, $r) => $q->whereHas('role', fn($q) => $q->where('name', $r)))
                ->when($request->search, fn($q, $s) => 
                    $q->where('name', 'like', "%{$s}%")
                      ->orWhere('email', 'like', "%{$s}%")
                )
                ->paginate(20);

            return $this->success($users, 'Users retrieved successfully.');
        } catch (\Exception $e) {
            Log::error('Users index error: ' . $e->getMessage());
            return $this->error('Error fetching users: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Store a newly created user.
     * Automatically assigns a class to drivers.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:100',
                'email' => 'required|email|unique:users,email',
                'phone' => 'nullable|string|max:20',
                'password' => 'required|string|min:8',
                'role_id' => 'required|exists:roles,id',
                'is_active' => 'boolean',
                'assigned_class_id' => 'nullable|exists:classes,id',
            ]);

            $userData = [
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
                'password' => Hash::make($validated['password']),
                'role_id' => $validated['role_id'],
                'is_active' => $validated['is_active'] ?? true,
            ];

            // Auto-assign class for drivers
            if ($validated['role_id'] == 4) {
                if (isset($validated['assigned_class_id']) && $validated['assigned_class_id']) {
                    $userData['assigned_class_id'] = $validated['assigned_class_id'];
                } else {
                    $autoAssignedClass = $this->getAutoAssignClass();
                    if ($autoAssignedClass) {
                        $userData['assigned_class_id'] = $autoAssignedClass->id;
                    }
                }
            }

            $user = User::create($userData);

            return $this->success($user->load('role'), 'User created successfully.', 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->error('Validation error: ' . json_encode($e->errors()), 422);
        } catch (\Exception $e) {
            Log::error('Store user error: ' . $e->getMessage());
            return $this->error('Error creating user: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get a class to auto-assign to a driver
     * Priority: Class with most students -> any active class -> create new class
     */
    private function getAutoAssignClass()
    {
        try {
            // Try to get class with most students first
            $class = SchoolClass::withCount('students')
                ->where('is_active', true)
                ->orderBy('students_count', 'desc')
                ->first();
            
            if ($class) {
                return $class;
            }
            
            // If no class exists, create a default one
            $defaultClass = SchoolClass::create([
                'name' => 'Default Class',
                'grade' => 'General',
                'academic_year' => date('Y') . '-' . (date('Y') + 1),
                'is_active' => true,
            ]);
            
            return $defaultClass;
        } catch (\Exception $e) {
            Log::error('Auto assign class error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Display the specified user.
     */
    public function show(User $user)
    {
        try {
            return $this->success($user->load('role'), 'User retrieved successfully.');
        } catch (\Exception $e) {
            Log::error('Show user error: ' . $e->getMessage());
            return $this->error('Error fetching user: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Update the specified user.
     */
    public function update(Request $request, User $user)
    {
        try {
            $data = $request->validate([
                'name' => ['sometimes', 'string', 'max:100'],
                'phone' => ['sometimes', 'nullable', 'string', 'max:20'],
                'email' => ['sometimes', 'email', Rule::unique('users')->ignore($user->id)],
                'role_id' => ['sometimes', 'exists:roles,id'],
                'assigned_class_id' => ['nullable', 'exists:classes,id'],
                'is_active' => ['sometimes', 'boolean'],
            ]);

            if ($request->has('password')) {
                $data['password'] = Hash::make($request->password);
            }

            // Auto-assign class for drivers if not provided
            if (isset($data['role_id']) && $data['role_id'] == 4 && empty($data['assigned_class_id'])) {
                $autoClass = $this->getAutoAssignClass();
                if ($autoClass) {
                    $data['assigned_class_id'] = $autoClass->id;
                }
            }

            $user->update($data);

            return $this->success($user->fresh('role'), 'User updated successfully.');

        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->error('Validation error: ' . json_encode($e->errors()), 422);
        } catch (\Exception $e) {
            Log::error('Update user error: ' . $e->getMessage());
            return $this->error('Error updating user: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Toggle user active status.
     */
    public function toggleActive(User $user)
    {
        try {
            $user->update(['is_active' => !$user->is_active]);
            return $this->success([
                'is_active' => $user->is_active
            ], 'User status updated successfully.');
        } catch (\Exception $e) {
            Log::error('Toggle user error: ' . $e->getMessage());
            return $this->error('Error toggling user status: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Remove the specified user.
     */
    public function destroy(User $user)
    {
        try {
            if (optional(auth('sanctum')->user())->id === $user->id) {
                return $this->error('You cannot delete your own account.', 403);
            }
            
            $user->delete();
            return $this->success(null, 'User deleted successfully.');
        } catch (\Exception $e) {
            Log::error('Delete user error: ' . $e->getMessage());
            return $this->error('Error deleting user: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Generate invitation code(s).
     */
    public function generateInvitationCode(Request $request)
    {
        try {
            $validated = $request->validate([
                'role_id' => ['required', 'exists:roles,id'],
                'class_id' => ['nullable', 'exists:classes,id'],
                'expires_in_hours' => ['nullable', 'integer', 'min:1', 'max:720'],
                'count' => ['nullable', 'integer', 'min:1', 'max:50'],
            ]);

            $service = app(InvitationCodeService::class);
            $count = $validated['count'] ?? 1;

            if ($count === 1) {
                $code = $service->generate(
                    $validated['role_id'],
                    $request->user()->id,
                    $validated['class_id'] ?? null,
                    $validated['expires_in_hours'] ?? 72
                );
                return $this->success($code, 'Invitation code generated successfully.', 201);
            }

            $codes = $service->generateBulk(
                $count,
                $validated['role_id'],
                $request->user()->id,
                $validated['class_id'] ?? null
            );
            
            return $this->success($codes, 'Invitation codes generated successfully.', 201);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->error('Validation error: ' . json_encode($e->errors()), 422);
        } catch (\Exception $e) {
            Log::error('Generate invitation code error: ' . $e->getMessage());
            Log::error('Generate invitation code trace: ' . $e->getTraceAsString());
            return $this->error('Error generating invitation code: ' . $e->getMessage(), 500);
        }
    }
}