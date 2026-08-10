<?php
namespace App\Events;

use App\Models\Trip;
use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TripStatusUpdated implements ShouldBroadcast
{
    use Dispatchable, SerializesModels;

    public function __construct(public readonly Trip $trip) {}

    // Public channel — parents join 'trips.{route_id}' from the frontend
    public function broadcastOn(): array
    {
        return [new Channel('trips.' . $this->trip->route_id)];
    }

    public function broadcastWith(): array
    {
        return [
            'trip_id'      => $this->trip->id,
            'status'       => $this->trip->status,
            'type'         => $this->trip->type,
            'route_id'     => $this->trip->route_id,
            'started_at'   => $this->trip->started_at?->toISOString(),
            'completed_at' => $this->trip->completed_at?->toISOString(),
            'driver_name'  => $this->trip->driver?->name,
        ];
    }

    public function broadcastAs(): string
    {
        return 'trip.status.updated';
    }
}