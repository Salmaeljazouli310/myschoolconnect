<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;

class TokenVerificationController extends Controller
{
    /**
     * Verify token for Socket.io server
     */
    public function verifyToken(Request $request)
    {
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
    }
}
