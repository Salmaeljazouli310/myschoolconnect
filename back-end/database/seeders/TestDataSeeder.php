<?php

namespace Database\Seeders;

use App\Models\Bus;
use App\Models\BusDriver;
use App\Models\BusRoute;
use App\Models\BusStop;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class TestDataSeeder extends Seeder
{
    public function run()
    {
        // Create a test driver if not exists
        $driver = User::firstOrCreate(
            ['email' => 'driver@school.ma'],
            [
                'name' => 'Mohammed Driver',
                'phone' => '0612345678',
                'password' => Hash::make('password'),
                'role_id' => 4, // driver role
                'is_active' => true,
            ]
        );

        $this->command->info('✅ Driver created: driver@school.ma / password');

        // Create a test bus (without 'name' column - matches your migration)
        $bus = Bus::firstOrCreate(
            ['plate_number' => 'TEST-001'],
            [
                'capacity' => 40,
                'model' => 'Mercedes Sprinter',
                'is_active' => true,
            ]
        );

        $this->command->info('✅ Bus created: ' . $bus->plate_number);

        // Assign driver to bus
        BusDriver::updateOrCreate(
            ['bus_id' => $bus->id, 'driver_id' => $driver->id],
            ['assigned_at' => now(), 'is_current' => true]
        );

        $this->command->info('✅ Driver assigned to bus');

        // Create a test route
        $route = BusRoute::firstOrCreate(
            ['name' => 'Route Test'],
            [
                'bus_id' => $bus->id,
                'is_active' => true,
            ]
        );

        $this->command->info('✅ Route created: ' . $route->name);

        // Create stops for the route - using only columns that exist in your migration
        // Your migration has: route_id, name, latitude, longitude, order, created_at
        // It does NOT have updated_at
        $stops = [
            ['name' => 'Arrêt 1 - Centre Ville', 'order' => 1],
            ['name' => 'Arrêt 2 - Quartier Nord', 'order' => 2],
            ['name' => 'Arrêt 3 - École', 'order' => 3],
        ];

        foreach ($stops as $stop) {
            // Check if stop already exists
            $existingStop = BusStop::where('route_id', $route->id)
                ->where('name', $stop['name'])
                ->first();

            if (!$existingStop) {
                BusStop::create([
                    'route_id' => $route->id,
                    'name' => $stop['name'],
                    'order' => $stop['order'],
                    'created_at' => now(),
                    // No updated_at - matches your migration
                ]);
            }
        }

        $this->command->info('✅ Stops created: ' . count($stops) . ' stops');

        // Optional: Create a test trip for today
        $tripExists = DB::table('trips')
            ->where('route_id', $route->id)
            ->where('driver_id', $driver->id)
            ->where('bus_id', $bus->id)
            ->whereDate('created_at', today())
            ->exists();

        if (!$tripExists) {
            DB::table('trips')->insert([
                'route_id' => $route->id,
                'driver_id' => $driver->id,
                'bus_id' => $bus->id,
                'type' => 'morning',
                'status' => 'scheduled',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $this->command->info('✅ Trip created for today');
        }

        $this->command->info('');
        $this->command->info('═══════════════════════════════════════════════════════════');
        $this->command->info('🎉 TEST DATA CREATED SUCCESSFULLY!');
        $this->command->info('═══════════════════════════════════════════════════════════');
        $this->command->info('   Driver email: driver@school.ma');
        $this->command->info('   Password: password');
        $this->command->info('   Bus plate: TEST-001');
        $this->command->info('   Route: Route Test');
        $this->command->info('');
        $this->command->info('   Next steps:');
        $this->command->info('   1. Login as admin');
        $this->command->info('   2. Go to Transport → Assigner Étudiants');
        $this->command->info('   3. Select the route and assign students');
        $this->command->info('   4. Login as driver to see assigned students');
        $this->command->info('═══════════════════════════════════════════════════════════');
    }
}