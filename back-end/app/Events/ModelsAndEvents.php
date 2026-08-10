<?php
/**
 * ══════════════════════════════════════════════════════
 *  MySchool Connect — New Models & Updated Models
 * ══════════════════════════════════════════════════════
 */

// ──────────────────────────────────────────────────────
// FILE: app/Models/PushNotification.php
// ──────────────────────────────────────────────────────
/*
<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PushNotification extends Model
{
    protected $fillable = [
        'user_id', 'type', 'title', 'body', 'data', 'is_read', 'read_at',
    ];

    protected $casts = [
        'data'    => 'array',
        'is_read' => 'boolean',
        'read_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
*/


// ──────────────────────────────────────────────────────
// FILE: app/Models/Message.php  (UPDATED — adds attachment columns)
// Preserves your existing fillable + SoftDeletes.
// Add the 3 attachment fields to fillable and the accessor.
// ──────────────────────────────────────────────────────
/*
<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Message extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'conversation_id',
        'sender_id',
        'receiver_id',
        'body',
        'is_read',
        'read_at',
        // Attachment support (added by migration 13)
        'attachment_path',
        'attachment_type',
        'attachment_name',
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'read_at' => 'datetime',
    ];

    // ── Relationships ──────────────────────────────────
    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }

    // ── Accessor: full public URL for attached file ────
    public function getAttachmentUrlAttribute(): ?string
    {
        return $this->attachment_path
            ? asset('storage/' . $this->attachment_path)
            : null;
    }
}
*/


// ──────────────────────────────────────────────────────
// FILE: app/Models/User.php  (add isDriver() — already exists in your file)
// Your User.php already has isDriver(). No change needed.
// Just verify this method is present:
//
//   public function isDriver(): bool
//   {
//       return $this->hasRole('driver');
//   }
//
// And add the pushNotifications relationship:
// ──────────────────────────────────────────────────────
/*
    // Add to your existing User.php:

    public function pushNotifications()
    {
        return $this->hasMany(PushNotification::class);
    }
*/


// ──────────────────────────────────────────────────────
// FILE: app/Events/TripStatusUpdated.php
// ──────────────────────────────────────────────────────
/*
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
*/


// ──────────────────────────────────────────────────────
// FILE: database/seeders/RolesAndDriverSeeder.php
// ──────────────────────────────────────────────────────
/*
<?php
namespace Database\Seeders;

use App\Models\Bus;
use App\Models\BusDriver;
use App\Models\BusRoute;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class RolesAndDriverSeeder extends Seeder
{
    public function run(): void
    {
        // ── Ensure all 4 roles exist ──────────────────────────────
        $roles = ['admin', 'teacher', 'parent', 'driver'];
        foreach ($roles as $roleName) {
            Role::firstOrCreate(['name' => $roleName], ['guard_name' => 'web']);
        }

        $driverRole = Role::where('name', 'driver')->first();

        // ── Create a demo driver user ─────────────────────────────
        $driver = User::firstOrCreate(
            ['email' => 'driver@school.ma'],
            [
                'name'      => 'Mohammed Alaoui',
                'phone'     => '0661234567',
                'password'  => Hash::make('password'),
                'role_id'   => $driverRole->id,
                'is_active' => true,
            ]
        );

        // ── Create a demo bus ─────────────────────────────────────
        $bus = Bus::firstOrCreate(
            ['plate_number' => 'MA-1234-A'],
            [
                'name'      => 'Bus A',
                'capacity'  => 40,
                'model'     => 'Mercedes Sprinter',
                'is_active' => true,
            ]
        );

        // ── Assign driver to bus via bus_drivers table ────────────
        BusDriver::firstOrCreate(
            ['bus_id' => $bus->id, 'driver_id' => $driver->id],
            ['assigned_at' => now(), 'is_current' => true]
        );

        // ── Create a demo route with stops ────────────────────────
        $route = BusRoute::firstOrCreate(
            ['name' => 'Route Nord'],
            ['bus_id' => $bus->id, 'is_active' => true]
        );

        if ($route->stops()->count() === 0) {
            $stops = [
                ['name' => 'Hay Riad',              'order' => 1],
                ['name' => 'Avenue Hassan II',       'order' => 2],
                ['name' => 'Place du 16 Novembre',   'order' => 3],
                ['name' => 'École Primaire Central', 'order' => 4],
            ];
            foreach ($stops as $stop) {
                $route->stops()->create($stop);
            }
        }

        // ── Create a scheduled trip for today ─────────────────────
        \App\Models\Trip::firstOrCreate(
            [
                'route_id'  => $route->id,
                'driver_id' => $driver->id,
                'bus_id'    => $bus->id,
                'type'      => 'morning',
            ],
            ['status' => 'scheduled']
        );

        $this->command->info('✅ Roles, driver, bus, and route seeded.');
    }
}
*/

echo "Copy each block above into its respective file.\n";