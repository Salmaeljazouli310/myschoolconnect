<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsActive
{
    /**
     * Handle an incoming request.
     * 
     * Ensures that the authenticated user has an active account.
     * This middleware should be used after auth:sanctum.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Get authenticated user
        $user = $request->user();

        // Check if user exists and is active
        if ($user && !$user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Your account has been deactivated. Please contact the administrator.'
            ], 403);
        }

        return $next($request);
    }
}