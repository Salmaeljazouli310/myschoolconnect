<?php

namespace App\Policies;

use App\Models\Trip;
use App\Models\User;

class TripPolicy
{
    /**
     * Determine if the user can update the trip status.
     */
    public function updateStatus(User $user, Trip $trip): bool
    {
        // Admin can update any trip status
        if ($user->isAdmin()) {
            return true;
        }

        // Driver can only update their own assigned trips
        return $user->isDriver() && $user->id === $trip->driver_id;
    }

    /**
     * Determine if the user can view trips.
     */
    public function view(User $user, Trip $trip): bool
    {
        // Admin can view all trips
        if ($user->isAdmin()) {
            return true;
        }

        // Driver can view their own trips
        if ($user->isDriver()) {
            return $user->id === $trip->driver_id;
        }

        // Parents can view trips related to their children's bus
        if ($user->isParent()) {
            // Check if parent has a child assigned to this trip's route
            return $user->students()
                ->whereHas('busAssignment', function ($query) use ($trip) {
                    $query->where('route_id', $trip->route_id);
                })
                ->exists();
        }

        return false;
    }
}