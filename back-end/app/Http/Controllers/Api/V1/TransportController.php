<?php

namespace App\Http\Controllers\Api\V1;

use App\Events\TripStatusUpdated;
use App\Http\Controllers\Controller;
use App\Models\Bus;
use App\Models\BusDriver;
use App\Models\BusRoute;
use App\Models\PushNotification;
use App\Models\Student;
use App\Models\StudentBusAssignment;
use App\Models\Trip;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TransportController extends Controller
{
    use ApiResponse;

    // ════════════════════════════════════════
    // BUSES
    // ════════════════════════════════════════

    public function buses(Request $request)
    {
        try {
            $buses = Bus::with('class')
                ->when($request->boolean('active'), fn ($q) => $q->where('is_active', true))
                ->paginate(20);
            
            return $this->success($buses, 'Buses retrieved successfully.');
        } catch (\Exception $e) {
            Log::error('Buses API Error: ' . $e->getMessage());
            return $this->error('Error fetching buses: ' . $e->getMessage(), 500);
        }
    }

    public function storeBus(Request $request)
    {
        try {
            $validated = $request->validate([
                'plate_number' => ['required', 'string', 'max:20', 'unique:buses,plate_number'],
                'capacity'     => ['required', 'integer', 'min:1', 'max:200'],
                'model'        => ['nullable', 'string', 'max:80'],
                'name'         => ['nullable', 'string', 'max:80'],
                'class_id'     => ['nullable', 'exists:classes,id'],
                'driver_id'    => ['nullable', 'exists:users,id'],
            ]);

            return DB::transaction(function () use ($validated) {
                $bus = Bus::create([
                    'name'         => $validated['name'] ?? null,
                    'plate_number' => $validated['plate_number'],
                    'capacity'     => $validated['capacity'],
                    'model'        => $validated['model'] ?? null,
                    'class_id'     => $validated['class_id'] ?? null,
                    'is_active'    => true,
                ]);

                if (!empty($validated['driver_id'])) {
                    BusDriver::create([
                        'bus_id'      => $bus->id,
                        'driver_id'   => $validated['driver_id'],
                        'assigned_at' => now(),
                        'is_current'  => true,
                    ]);
                }

                return $this->success($bus, 'Bus created successfully.', 201);
            });
        } catch (\Exception $e) {
            Log::error('Store Bus Error: ' . $e->getMessage());
            return $this->error('Error creating bus: ' . $e->getMessage(), 500);
        }
    }

    public function showBus($id)
    {
        try {
            $bus = Bus::with('class')->findOrFail($id);
            return $this->success($bus, 'Bus retrieved successfully.');
        } catch (\Exception $e) {
            Log::error('Show Bus Error: ' . $e->getMessage());
            return $this->error('Error fetching bus: ' . $e->getMessage(), 500);
        }
    }

    public function updateBus(Request $request, $id)
    {
        try {
            $bus = Bus::findOrFail($id);
            
            $validated = $request->validate([
                'plate_number' => ['sometimes', 'string', 'max:20', 'unique:buses,plate_number,' . $id],
                'capacity'     => ['sometimes', 'integer', 'min:1', 'max:200'],
                'model'        => ['nullable', 'string', 'max:80'],
                'name'         => ['nullable', 'string', 'max:80'],
                'class_id'     => ['nullable', 'exists:classes,id'],
                'is_active'    => ['sometimes', 'boolean'],
            ]);
            
            $bus->update($validated);
            
            return $this->success($bus, 'Bus updated successfully.');
        } catch (\Exception $e) {
            Log::error('Update Bus Error: ' . $e->getMessage());
            return $this->error('Error updating bus: ' . $e->getMessage(), 500);
        }
    }

    public function deleteBus($id)
    {
        try {
            $bus = Bus::findOrFail($id);
            
            $hasTrips = Trip::where('bus_id', $id)->exists();
            
            if ($hasTrips) {
                $bus->update(['is_active' => false]);
                return $this->success(null, 'Bus has active trips. Bus deactivated instead.');
            }
            
            BusDriver::where('bus_id', $id)->delete();
            $bus->delete();
            
            return $this->success(null, 'Bus deleted successfully.');
        } catch (\Exception $e) {
            Log::error('Delete Bus Error: ' . $e->getMessage());
            return $this->error('Error deleting bus: ' . $e->getMessage(), 500);
        }
    }

    // ════════════════════════════════════════
    // ROUTES
    // ════════════════════════════════════════

    public function getBusesWithRoutes(Request $request)
    {
        try {
            $buses = Bus::with(['routes' => function($q) {
                $q->where('is_active', true);
            }])->get();
            
            return $this->success($buses, 'Buses with routes retrieved successfully.');
        } catch (\Exception $e) {
            Log::error('Buses with routes Error: ' . $e->getMessage());
            return $this->error('Error fetching buses with routes: ' . $e->getMessage(), 500);
        }
    }

    public function getRoutesWithBuses(Request $request)
    {
        try {
            $routes = BusRoute::with(['bus', 'stops'])->where('is_active', true)->get();
            
            return $this->success($routes, 'Routes retrieved successfully.');
        } catch (\Exception $e) {
            Log::error('Routes with buses Error: ' . $e->getMessage());
            return $this->error('Error fetching routes: ' . $e->getMessage(), 500);
        }
    }

    public function routes(Request $request)
    {
        try {
            $routes = BusRoute::with(['bus', 'stops'])
                ->when($request->boolean('active'), fn ($q) => $q->where('is_active', true))
                ->paginate(20);

            return $this->success($routes, 'Routes retrieved successfully.');
        } catch (\Exception $e) {
            Log::error('Routes Error: ' . $e->getMessage());
            return $this->error('Error fetching routes: ' . $e->getMessage(), 500);
        }
    }

    public function storeRoute(Request $request)
    {
        try {
            $validated = $request->validate([
                'name'               => ['required', 'string', 'max:100'],
                'description'        => ['nullable', 'string'],
                'bus_id'             => ['nullable', 'exists:buses,id'],
                'stops'              => ['required', 'array', 'min:1'],
                'stops.*.name'       => ['required', 'string', 'max:100'],
                'stops.*.latitude'   => ['nullable', 'numeric', 'between:-90,90'],
                'stops.*.longitude'  => ['nullable', 'numeric', 'between:-180,180'],
            ]);

            return DB::transaction(function () use ($validated) {
                $route = BusRoute::create([
                    'name'        => $validated['name'],
                    'description' => $validated['description'] ?? null,
                    'bus_id'      => $validated['bus_id'] ?? null,
                    'is_active'   => true,
                ]);

                foreach ($validated['stops'] as $idx => $stopData) {
                    $route->stops()->create([
                        'name'      => $stopData['name'],
                        'latitude'  => $stopData['latitude']  ?? null,
                        'longitude' => $stopData['longitude'] ?? null,
                        'order'     => $idx + 1,
                    ]);
                }

                return $this->success($route->load('stops'), 'Route created successfully.', 201);
            });
        } catch (\Exception $e) {
            Log::error('Store Route Error: ' . $e->getMessage());
            return $this->error('Error creating route: ' . $e->getMessage(), 500);
        }
    }

    public function showRoute($id)
    {
        try {
            $route = BusRoute::with('stops')->findOrFail($id);
            return $this->success($route, 'Route retrieved successfully.');
        } catch (\Exception $e) {
            Log::error('Show Route Error: ' . $e->getMessage());
            return $this->error('Error fetching route: ' . $e->getMessage(), 500);
        }
    }

    public function updateRoute(Request $request, $id)
    {
        try {
            $route = BusRoute::findOrFail($id);
            
            $validated = $request->validate([
                'name'        => ['sometimes', 'string', 'max:100'],
                'description' => ['nullable', 'string'],
                'bus_id'      => ['nullable', 'exists:buses,id'],
                'is_active'   => ['sometimes', 'boolean'],
            ]);
            
            $route->update($validated);
            
            return $this->success($route, 'Route updated successfully.');
        } catch (\Exception $e) {
            Log::error('Update Route Error: ' . $e->getMessage());
            return $this->error('Error updating route: ' . $e->getMessage(), 500);
        }
    }

    public function deleteRoute($id)
    {
        try {
            $route = BusRoute::findOrFail($id);
            
            $hasTrips = Trip::where('route_id', $id)->exists();
            
            if ($hasTrips) {
                return $this->error('Cannot delete route with associated trips.', 400);
            }
            
            $route->stops()->delete();
            $route->delete();
            
            return $this->success(null, 'Route deleted successfully.');
        } catch (\Exception $e) {
            Log::error('Delete Route Error: ' . $e->getMessage());
            return $this->error('Error deleting route: ' . $e->getMessage(), 500);
        }
    }

    // ════════════════════════════════════════
    // TRIPS
    // ════════════════════════════════════════

    public function trips(Request $request)
    {
        try {
            $user = $request->user();
            
            $query = Trip::with(['driver:id,name,avatar', 'bus']);
            
            if ($user->isDriver()) {
                $query->where('driver_id', $user->id);
            }
            
            if ($request->status) {
                $query->where('status', $request->status);
            }
            
            if ($request->boolean('today')) {
                $query->whereDate('date', today());
            }
            
            if ($request->date) {
                $query->whereDate('date', $request->date);
            }
            
            $trips = $query->orderBy('date', 'desc')->paginate(15);
            
            return response()->json([
                'success' => true,
                'data' => $trips
            ]);
            
        } catch (\Exception $e) {
            Log::error('Trips Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching trips: ' . $e->getMessage()
            ], 500);
        }
    }

    public function storeTrip(Request $request)
    {
        try {
            $validated = $request->validate([
                'driver_id' => ['required', 'exists:users,id'],
                'bus_id'    => ['required', 'exists:buses,id'],
                'type'      => ['required', 'in:morning,afternoon'],
                'date'      => ['required', 'date'],
            ]);

            $driver = User::find($validated['driver_id']);
            if (!$driver->isDriver()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Selected user is not a driver'
                ], 422);
            }

            $trip = Trip::create([
                'driver_id' => $validated['driver_id'],
                'bus_id'    => $validated['bus_id'],
                'type'      => $validated['type'],
                'date'      => $validated['date'],
                'status'    => 'scheduled'
            ]);

            return response()->json([
                'success' => true,
                'data' => $trip->load(['driver', 'bus']),
                'message' => 'Trip scheduled successfully.'
            ], 201);
            
        } catch (\Exception $e) {
            Log::error('Store Trip Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error scheduling trip: ' . $e->getMessage()
            ], 500);
        }
    }

    public function showTrip($id)
    {
        try {
            $trip = Trip::with(['route.stops', 'driver', 'bus'])->findOrFail($id);
            return $this->success($trip, 'Trip retrieved successfully.');
        } catch (\Exception $e) {
            Log::error('Show Trip Error: ' . $e->getMessage());
            return $this->error('Error fetching trip: ' . $e->getMessage(), 500);
        }
    }

    public function updateTrip(Request $request, $id)
    {
        try {
            $trip = Trip::findOrFail($id);
            
            $validated = $request->validate([
                'status' => ['sometimes', 'in:scheduled,in_progress,completed,cancelled'],
                'type'   => ['sometimes', 'in:morning,afternoon'],
            ]);
            
            $trip->update($validated);
            
            return $this->success($trip, 'Trip updated successfully.');
        } catch (\Exception $e) {
            Log::error('Update Trip Error: ' . $e->getMessage());
            return $this->error('Error updating trip: ' . $e->getMessage(), 500);
        }
    }

    public function deleteTrip($id)
    {
        try {
            $trip = Trip::findOrFail($id);
            
            if ($trip->status === 'in_progress') {
                return $this->error('Cannot delete a trip in progress.', 400);
            }
            
            $trip->delete();
            
            return $this->success(null, 'Trip deleted successfully.');
        } catch (\Exception $e) {
            Log::error('Delete Trip Error: ' . $e->getMessage());
            return $this->error('Error deleting trip: ' . $e->getMessage(), 500);
        }
    }

    // ════════════════════════════════════════
    // DRIVER ROUTES
    // ════════════════════════════════════════

    public function getAssignedStudentsByClass(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user->isDriver()) {
                return $this->error('Only drivers can access this endpoint.', 403);
            }
            
            if (!$user->assigned_class_id) {
                return $this->success([], 'No class assigned to this driver.');
            }
            
            $students = Student::where('class_id', $user->assigned_class_id)
                ->with(['class', 'parents:id,name,email,avatar,phone'])
                ->get();
            
            $students->each(function($student) {
                $student->today_trip_status = $this->getStudentTripStatus($student->id);
                $student->trip_started_at = $this->getStudentTripStartTime($student->id);
            });
            
            return $this->success($students, 'Assigned students retrieved successfully.');
            
        } catch (\Exception $e) {
            Log::error('Get Assigned Students Error: ' . $e->getMessage());
            return $this->error('Error fetching assigned students: ' . $e->getMessage(), 500);
        }
    }

    public function getAssignedStudents(Request $request)
    {
        return $this->getAssignedStudentsByClass($request);
    }

    public function startStudentTrip(Request $request, $studentId)
    {
        try {
            $user = $request->user();
            
            if (!$user->isDriver()) {
                return $this->error('Only drivers can access this endpoint.', 403);
            }
            
            $validated = $request->validate([
                'date' => ['nullable', 'date'],
                'type' => ['nullable', 'in:morning,afternoon'],
            ]);
            
            $tripDate = $validated['date'] ?? today()->toDateString();
            $tripType = $validated['type'] ?? 'morning';
            
            $student = Student::with('parents')->findOrFail($studentId);
            
            if ($user->assigned_class_id && $student->class_id != $user->assigned_class_id) {
                return $this->error('This student does not belong to your assigned class.', 403);
            }
            
            $route = BusRoute::firstOrCreate(
                ['name' => 'Route par défaut'],
                ['description' => 'Route automatique pour les trajets', 'is_active' => true]
            );
            
            $busAssignment = BusDriver::where('driver_id', $user->id)->where('is_current', true)->first();
            
            if (!$busAssignment) {
                $defaultBus = Bus::firstOrCreate(
                    ['plate_number' => 'DEFAULT-001'],
                    ['capacity' => 40, 'model' => 'Default Bus', 'is_active' => true]
                );
                $busAssignment = BusDriver::create([
                    'driver_id' => $user->id,
                    'bus_id' => $defaultBus->id,
                    'assigned_at' => now(),
                    'is_current' => true,
                ]);
            }
            
            $trip = Trip::updateOrCreate(
                [
                    'student_id' => $studentId,
                    'driver_id' => $user->id,
                    'date' => $tripDate,
                ],
                [
                    'route_id' => $route->id,
                    'bus_id' => $busAssignment->bus_id,
                    'status' => 'in_progress',
                    'started_at' => now(),
                    'type' => $tripType,
                ]
            );
            
            return $this->success(['trip' => $trip], 'Trip started successfully.');
        } catch (\Exception $e) {
            Log::error('Start Student Trip Error: ' . $e->getMessage());
            return $this->error('Error starting trip: ' . $e->getMessage(), 500);
        }
    }

    public function endStudentTrip(Request $request, $studentId)
    {
        try {
            $user = $request->user();
            
            if (!$user->isDriver()) {
                return $this->error('Only drivers can access this endpoint.', 403);
            }
            
            $student = Student::with('parents')->findOrFail($studentId);
            
            if ($user->assigned_class_id && $student->class_id != $user->assigned_class_id) {
                return $this->error('This student does not belong to your assigned class.', 403);
            }
            
            $trip = Trip::where('student_id', $studentId)
                ->where('driver_id', $user->id)
                ->whereDate('date', today())
                ->first();
            
            if (!$trip) {
                return $this->error('No active trip found for this student.', 404);
            }
            
            $trip->update([
                'status' => 'completed',
                'completed_at' => now(),
            ]);
            
            return $this->success(['trip' => $trip], 'Trip completed successfully.');
        } catch (\Exception $e) {
            Log::error('End Student Trip Error: ' . $e->getMessage());
            return $this->error('Error ending trip: ' . $e->getMessage(), 500);
        }
    }

    public function startClassTrip(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user->isDriver()) {
                return $this->error('Only drivers can access this endpoint.', 403);
            }
            
            if (!$user->assigned_class_id) {
                return $this->error('No class assigned to this driver.', 400);
            }
            
            $students = Student::where('class_id', $user->assigned_class_id)->get();
            
            foreach ($students as $student) {
                Trip::updateOrCreate(
                    [
                        'student_id' => $student->id,
                        'driver_id' => $user->id,
                        'date' => today()->toDateString(),
                    ],
                    [
                        'status' => 'in_progress',
                        'started_at' => now(),
                        'type' => 'morning',
                    ]
                );
            }
            
            return $this->success([
                'students_count' => $students->count()
            ], 'Class trip started successfully.');
        } catch (\Exception $e) {
            Log::error('Start Class Trip Error: ' . $e->getMessage());
            return $this->error('Error starting class trip: ' . $e->getMessage(), 500);
        }
    }

    public function myBus(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user->isDriver()) {
                return $this->error('Only drivers can access this endpoint.', 403);
            }
            
            $bus = Bus::whereHas('drivers', function($q) use ($user) {
                $q->where('driver_id', $user->id)->where('is_current', true);
            })->first();
            
            return $this->success($bus, 'Bus retrieved successfully.');
        } catch (\Exception $e) {
            Log::error('My Bus Error: ' . $e->getMessage());
            return $this->error('Error fetching bus: ' . $e->getMessage(), 500);
        }
    }

    /**
     * ✅ Récupérer l'itinéraire du bus assigné au driver (corrigé)
     */
    public function myRoute(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user->isDriver()) {
                return $this->error('Only drivers can access this endpoint.', 403);
            }
            
            // Récupérer le bus du driver
            $busDriver = BusDriver::where('driver_id', $user->id)->where('is_current', true)->first();
            
            if (!$busDriver) {
                return $this->success(null, 'No bus assigned to driver.');
            }
            
            // Récupérer la route du bus
            $route = BusRoute::where('bus_id', $busDriver->bus_id)->where('is_active', true)->first();
            
            if (!$route) {
                return $this->success(null, 'No route assigned to this bus.');
            }
            
            // Charger les arrêts dans l'ordre
            $route->load(['stops' => function($q) {
                $q->orderBy('order', 'asc');
            }]);
            
            return $this->success($route, 'Route retrieved successfully.');
            
        } catch (\Exception $e) {
            Log::error('My Route Error: ' . $e->getMessage());
            return $this->error('Error fetching route: ' . $e->getMessage(), 500);
        }
    }

    public function myCurrentTrip(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user->isDriver()) {
                return $this->error('Only drivers can access this endpoint.', 403);
            }
            
            $trip = Trip::where('driver_id', $user->id)
                ->whereIn('status', ['scheduled', 'in_progress'])
                ->whereDate('date', today())
                ->with(['bus'])
                ->first();
            
            return $this->success($trip, 'Current trip retrieved successfully.');
        } catch (\Exception $e) {
            Log::error('My Current Trip Error: ' . $e->getMessage());
            return $this->error('Error fetching current trip: ' . $e->getMessage(), 500);
        }
    }

    public function getDriverTrips(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user->isDriver()) {
                return $this->error('Only drivers can access this endpoint.', 403);
            }
            
            $query = Trip::where('driver_id', $user->id);
            
            if ($request->status) {
                $query->where('status', $request->status);
            }
            
            if ($request->date) {
                $query->whereDate('date', $request->date);
            }
            
            $trips = $query->orderBy('date', 'desc')->paginate(15);
            
            return $this->success($trips, 'Trips retrieved successfully.');
        } catch (\Exception $e) {
            Log::error('Get Driver Trips Error: ' . $e->getMessage());
            return $this->error('Error fetching trips: ' . $e->getMessage(), 500);
        }
    }

    public function updateTripStatus(Request $request, $tripId)
    {
        try {
            $trip = Trip::findOrFail($tripId);
            $user = $request->user();
            
            if (!$user->isDriver() || $trip->driver_id !== $user->id) {
                return $this->error('Unauthorized', 403);
            }
            
            $validated = $request->validate([
                'status' => ['required', 'in:scheduled,in_progress,completed,cancelled'],
            ]);
            
            $trip->update(['status' => $validated['status']]);
            
            return $this->success($trip, 'Trip status updated successfully.');
        } catch (\Exception $e) {
            Log::error('Update Trip Status Error: ' . $e->getMessage());
            return $this->error('Error updating trip status: ' . $e->getMessage(), 500);
        }
    }

    public function updateLocation(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user->isDriver()) {
                return $this->error('Only drivers can access this endpoint.', 403);
            }
            
            $validated = $request->validate([
                'latitude' => ['required', 'numeric', 'between:-90,90'],
                'longitude' => ['required', 'numeric', 'between:-180,180'],
            ]);
            
            $user->update([
                'last_latitude' => $validated['latitude'],
                'last_longitude' => $validated['longitude'],
                'last_location_update' => now(),
            ]);
            
            return $this->success(null, 'Location updated successfully.');
        } catch (\Exception $e) {
            Log::error('Update Location Error: ' . $e->getMessage());
            return $this->error('Error updating location: ' . $e->getMessage(), 500);
        }
    }

    public function driverDashboard(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user->isDriver()) {
                return $this->error('Only drivers can access this endpoint.', 403);
            }
            
            $stats = [
                'total_trips' => Trip::where('driver_id', $user->id)->count(),
                'completed_trips' => Trip::where('driver_id', $user->id)->where('status', 'completed')->count(),
                'in_progress_trips' => Trip::where('driver_id', $user->id)->where('status', 'in_progress')->count(),
                'today_trips' => Trip::where('driver_id', $user->id)->whereDate('date', today())->count(),
            ];
            
            return $this->success($stats, 'Dashboard stats retrieved successfully.');
        } catch (\Exception $e) {
            Log::error('Driver Dashboard Error: ' . $e->getMessage());
            return $this->error('Error fetching dashboard data: ' . $e->getMessage(), 500);
        }
    }

    // ════════════════════════════════════════
    // ADMIN/TEACHER ROUTES
    // ════════════════════════════════════════

    public function assignStudentsBulk(Request $request)
    {
        try {
            $validated = $request->validate([
                'bus_id' => 'required|exists:buses,id',
                'student_ids' => 'required|array',
                'student_ids.*' => 'exists:students,id',
            ]);

            $assigned = 0;
            foreach ($validated['student_ids'] as $studentId) {
                StudentBusAssignment::updateOrCreate(
                    ['student_id' => $studentId],
                    [
                        'bus_id' => $validated['bus_id'],
                        'is_active' => true,
                    ]
                );
                $assigned++;
            }

            return $this->success([
                'assigned' => $assigned,
                'bus_id' => $validated['bus_id']
            ], "$assigned étudiant(s) assigné(s) au bus.");
        } catch (\Exception $e) {
            Log::error('Assign Students Bulk Error: ' . $e->getMessage());
            return $this->error('Error assigning students: ' . $e->getMessage(), 500);
        }
    }

    // ════════════════════════════════════════
    // DRIVER ASSIGNMENTS (ADMIN)
    // ════════════════════════════════════════

    public function getDriverAssignments(Request $request)
    {
        try {
            $assignments = DB::table('bus_drivers as bd')
                ->leftJoin('buses as b', 'bd.bus_id', '=', 'b.id')
                ->leftJoin('users as u', 'bd.driver_id', '=', 'u.id')
                ->select(
                    'bd.id',
                    'bd.driver_id',
                    'u.name as driver_name',
                    'bd.bus_id',
                    'b.plate_number as bus_plate',
                    'bd.assigned_at',
                    'bd.is_current'
                )
                ->get();
            
            $drivers = User::where('role_id', 4)->get(['id', 'name', 'assigned_class_id']);
            foreach ($assignments as $assignment) {
                $driver = $drivers->firstWhere('id', $assignment->driver_id);
                $assignment->class_name = $driver ? optional(\App\Models\SchoolClass::find($driver->assigned_class_id))->name : null;
            }
            
            return $this->success($assignments, 'Assignments retrieved successfully.');
        } catch (\Exception $e) {
            Log::error('Get Driver Assignments Error: ' . $e->getMessage());
            return $this->error('Error fetching assignments: ' . $e->getMessage(), 500);
        }
    }

    public function assignBusToDriver(Request $request)
    {
        try {
            $validated = $request->validate([
                'driver_id' => 'required|exists:users,id',
                'bus_id' => 'required|exists:buses,id',
            ]);
            
            $driver = User::find($validated['driver_id']);
            if (!$driver->isDriver()) {
                return $this->error('Selected user is not a driver.', 422);
            }
            
            BusDriver::where('driver_id', $validated['driver_id'])->update(['is_current' => false]);
            
            $assignment = BusDriver::create([
                'driver_id' => $validated['driver_id'],
                'bus_id' => $validated['bus_id'],
                'assigned_at' => now(),
                'is_current' => true,
            ]);
            
            return $this->success($assignment, 'Bus assigned to driver successfully.');
        } catch (\Exception $e) {
            Log::error('Assign Bus To Driver Error: ' . $e->getMessage());
            return $this->error('Error assigning bus: ' . $e->getMessage(), 500);
        }
    }

    public function assignClassToDriver(Request $request)
    {
        try {
            $validated = $request->validate([
                'driver_id' => 'required|exists:users,id',
                'class_id' => 'required|exists:classes,id',
            ]);
            
            $driver = User::find($validated['driver_id']);
            if (!$driver->isDriver()) {
                return $this->error('Selected user is not a driver.', 422);
            }
            
            $driver->assigned_class_id = $validated['class_id'];
            $driver->save();
            
            return $this->success($driver, 'Class assigned to driver successfully.');
        } catch (\Exception $e) {
            Log::error('Assign Class To Driver Error: ' . $e->getMessage());
            return $this->error('Error assigning class: ' . $e->getMessage(), 500);
        }
    }

    public function deleteDriverAssignment(Request $request, $id)
    {
        try {
            $assignment = BusDriver::findOrFail($id);
            $assignment->delete();
            
            return $this->success(null, 'Assignment deleted successfully.');
        } catch (\Exception $e) {
            Log::error('Delete Driver Assignment Error: ' . $e->getMessage());
            return $this->error('Error deleting assignment: ' . $e->getMessage(), 500);
        }
    }

    public function assignStudentToBus(Request $request)
    {
        try {
            $validated = $request->validate([
                'student_id' => ['required', 'exists:students,id'],
                'bus_id'     => ['required', 'exists:buses,id'],
            ]);

            StudentBusAssignment::updateOrCreate(
                ['student_id' => $validated['student_id']],
                [
                    'bus_id' => $validated['bus_id'],
                    'is_active' => true,
                ]
            );

            return $this->success(null, 'Student assigned to bus successfully.');
        } catch (\Exception $e) {
            Log::error('Assign Student Error: ' . $e->getMessage());
            return $this->error('Error assigning student: ' . $e->getMessage(), 500);
        }
    }

    public function getAllStudentsWithStatus(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user->isAdmin() && !$user->isTeacher()) {
                return $this->error('Only admin and teachers can access this endpoint.', 403);
            }
            
            $query = Student::with(['class', 'parents', 'busAssignment.bus']);
            
            if ($user->isTeacher()) {
                $query->whereHas('class', function($q) use ($user) {
                    $q->where('teacher_id', $user->id);
                });
            }
            
            $students = $query->get();
            
            $students->each(function($student) {
                $student->today_trip = Trip::where('student_id', $student->id)
                    ->whereDate('date', today())
                    ->first();
                $student->trip_status = $student->today_trip?->status ?? 'not_started';
                $student->driver_name = $student->busAssignment?->bus?->currentDriver?->name ?? 'Not assigned';
            });
            
            return $this->success($students, 'All students retrieved successfully.');
        } catch (\Exception $e) {
            Log::error('Get All Students Error: ' . $e->getMessage());
            return $this->error('Error fetching students: ' . $e->getMessage(), 500);
        }
    }

    public function testBusesSimple()
    {
        try {
            $buses = Bus::all();
            return response()->json([
                'success' => true,
                'data' => $buses
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ════════════════════════════════════════
    // NOTIFICATIONS
    // ════════════════════════════════════════

    public function myNotifications(Request $request)
    {
        try {
            $notifications = PushNotification::where('user_id', $request->user()->id)
                ->latest()
                ->paginate(20);

            $unread = PushNotification::where('user_id', $request->user()->id)
                ->where('is_read', false)
                ->count();

            return $this->success([
                'notifications' => $notifications,
                'unread_count'  => $unread,
            ], 'Notifications retrieved.');
        } catch (\Exception $e) {
            Log::error('Notifications Error: ' . $e->getMessage());
            return $this->error('Error fetching notifications: ' . $e->getMessage(), 500);
        }
    }

    public function markNotificationRead(Request $request, PushNotification $notification)
    {
        try {
            if ($notification->user_id !== $request->user()->id) {
                return $this->error('Unauthorized.', 403);
            }

            $notification->update(['is_read' => true, 'read_at' => now()]);

            return $this->success(null, 'Notification marked as read.');
        } catch (\Exception $e) {
            Log::error('Mark Notification Read Error: ' . $e->getMessage());
            return $this->error('Error marking notification as read: ' . $e->getMessage(), 500);
        }
    }

    public function markAllNotificationsRead(Request $request)
    {
        try {
            PushNotification::where('user_id', $request->user()->id)
                ->where('is_read', false)
                ->update(['is_read' => true, 'read_at' => now()]);

            return $this->success(null, 'All notifications marked as read.');
        } catch (\Exception $e) {
            Log::error('Mark All Notifications Read Error: ' . $e->getMessage());
            return $this->error('Error marking notifications as read: ' . $e->getMessage(), 500);
        }
    }

    // ════════════════════════════════════════
    // PRIVATE HELPERS
    // ════════════════════════════════════════

    private function getStudentTripStatus($studentId)
    {
        $trip = Trip::where('student_id', $studentId)
            ->whereDate('date', today())
            ->first();
        
        return $trip?->status ?? 'not_started';
    }

    private function getStudentTripStartTime($studentId)
    {
        $trip = Trip::where('student_id', $studentId)
            ->whereDate('date', today())
            ->first();
        
        return $trip?->started_at;
    }

    private function broadcastToSocket(string $path, array $data): void
    {
        try {
            $internalKey = env('INTERNAL_KEY', 'change-me-in-production');
            $socketUrl = rtrim(env('SOCKET_SERVER_URL', 'http://localhost:3002'), '/');
            
            Http::timeout(2)->post($socketUrl . $path, $data, [
                'headers' => [
                    'X-Internal-Key' => $internalKey,
                    'Content-Type' => 'application/json',
                ]
            ]);
        } catch (\Exception $e) {
            Log::warning('Socket broadcast skipped: ' . $e->getMessage());
        }
    }

    public function getStudentTrip($id)
    {
        try {
            $student = Student::with('parents')->findOrFail($id);
            
            $user = request()->user();
            if ($user->isParent()) {
                $hasAccess = $student->parents()->where('parent_id', $user->id)->exists();
                if (!$hasAccess) {
                    return $this->error('Unauthorized', 403);
                }
            }
            
            $trip = Trip::where('student_id', $id)
                ->whereDate('date', today())
                ->first();
            
            return $this->success($trip, 'Trip retrieved successfully.');
        } catch (\Exception $e) {
            Log::error('Get Student Trip Error: ' . $e->getMessage());
            return $this->error('Error fetching trip: ' . $e->getMessage(), 500);
        }
    }
}