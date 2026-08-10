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