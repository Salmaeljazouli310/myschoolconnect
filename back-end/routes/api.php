<?php

use App\Http\Controllers\Api\TokenVerificationController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\ClassController;
use App\Http\Controllers\Api\V1\MediaController;
use App\Http\Controllers\Api\V1\MessagingController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\PostController;
use App\Http\Controllers\Api\V1\StudentController;
use App\Http\Controllers\Api\V1\StudentPointController;
use App\Http\Controllers\Api\V1\StudentImportController;
use App\Http\Controllers\Api\V1\TaskPointController;
use App\Http\Controllers\Api\V1\TransportController;
use App\Http\Controllers\Api\V1\UserController;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

// =============================================================
// SOCKET.IO AUTHENTICATION ROUTE (outside v1 prefix)
// =============================================================
Route::post('/verify-token', [TokenVerificationController::class, 'verifyToken']);

// =============================================================
// TEST BROADCAST ROUTE (for debugging)
// =============================================================
Route::post('/test-broadcast', function(Request $request) {
    $internalKey = env('INTERNAL_KEY', 'myschool-super-secret-key-change-in-production');
    $socketUrl = rtrim(env('SOCKET_SERVER_URL', 'http://localhost:3002'), '/');
    
    Log::info('Test broadcast called', [
        'socket_url' => $socketUrl,
        'internal_key_exists' => !empty($internalKey),
        'request_data' => $request->all()
    ]);
    
    try {
        $response = Http::withHeaders([
            'X-Internal-Key' => $internalKey,
            'Content-Type' => 'application/json'
        ])->timeout(5)->post($socketUrl . '/broadcast-message', $request->all());
        
        return response()->json([
            'success' => true,
            'sent' => true,
            'socket_response' => $response->json(),
            'socket_status' => $response->status()
        ]);
    } catch (\Exception $e) {
        Log::error('Test broadcast error: ' . $e->getMessage());
        return response()->json([
            'success' => false,
            'error' => $e->getMessage()
        ], 500);
    }
});

// =============================================================
// API V1 ROUTES
// =============================================================
Route::prefix('v1')->name('api.v1.')->group(function () {

    // =============================================================
    // PUBLIC ROUTES (No authentication required)
    // =============================================================
    Route::prefix('auth')->name('auth.')->group(function () {
        Route::post('/register', [AuthController::class, 'register'])->name('register');
        Route::post('/login', [AuthController::class, 'login'])->name('login');
        Route::get('/invitation-codes/validate/{code}', [AuthController::class, 'validateInvitationCode']);
    });

    // =============================================================
    // PROTECTED ROUTES (Authentication required)
    // =============================================================
    Route::middleware(['auth:sanctum', 'active'])->group(function () {

        // Authentication (self)
        Route::prefix('auth')->name('auth.')->group(function () {
            Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
            Route::get('/me', [AuthController::class, 'me'])->name('me');
        });

        // =============================================================
        // NOTIFICATIONS (Laravel built-in)
        // =============================================================
        Route::prefix('notifications')->name('notifications.')->group(function () {
            Route::get('/', [NotificationController::class, 'index'])->name('index');
            Route::post('/read-all', [NotificationController::class, 'markAllRead'])->name('read-all');
            Route::patch('/{id}/read', [NotificationController::class, 'markRead'])->name('read');
        });

        // =============================================================
        // MESSAGING
        // =============================================================
        Route::prefix('messaging')->name('messaging.')->group(function () {
            Route::get('/conversations', [MessagingController::class, 'conversations'])->name('conversations');
            Route::post('/conversations', [MessagingController::class, 'startConversation'])->name('start');
            Route::get('/conversations/{conversationId}/messages', [MessagingController::class, 'messages'])->name('messages');
            Route::post('/conversations/{conversationId}/messages', [MessagingController::class, 'sendMessage'])->name('send');
            Route::post('/conversations/{conversationId}/read', [MessagingController::class, 'markAsRead'])->name('read');
            Route::delete('/conversations/{conversationId}', [MessagingController::class, 'deleteConversation'])->name('delete');
            Route::get('/contacts', [MessagingController::class, 'getContacts'])->name('contacts');
            Route::get('/unread-count', [MessagingController::class, 'unreadCount'])->name('unread-count');
        });

        // =============================================================
        // POSTS
        // =============================================================
        Route::prefix('posts')->name('posts.')->group(function () {
            Route::get('/', [PostController::class, 'index'])->name('index');
            Route::get('/{post}', [PostController::class, 'show'])->name('show');

            Route::middleware('role:admin,teacher')->group(function () {
                Route::post('/', [PostController::class, 'store'])->name('store');
                Route::put('/{post}', [PostController::class, 'update'])->name('update');
                Route::patch('/{post}/submit', [PostController::class, 'submit'])->name('submit');
                Route::delete('/{post}', [PostController::class, 'destroy'])->name('destroy');
            });

            Route::middleware('role:admin')->group(function () {
                Route::get('/pending', [PostController::class, 'pending'])->name('pending');
                Route::patch('/{post}/approve', [PostController::class, 'approve'])->name('approve');
                Route::patch('/{post}/reject', [PostController::class, 'reject'])->name('reject');
            });
        });

        // =============================================================
        // MEDIA
        // =============================================================
        Route::prefix('media')->name('media.')->group(function () {
            Route::post('/upload', [MediaController::class, 'upload'])->name('upload');
            Route::delete('/{media}', [MediaController::class, 'destroy'])->name('destroy');
        });

        // =============================================================
        // LEADERBOARD & PUBLIC TRANSPORT
        // =============================================================
        Route::get('/points/leaderboard', [StudentPointController::class, 'leaderboard'])->name('leaderboard');
        Route::get('/transport/routes', [TransportController::class, 'routes'])->name('transport.routes.public');

        // =============================================================
        // ADMIN ONLY ROUTES
        // =============================================================
        Route::middleware('role:admin')->prefix('admin')->name('admin.')->group(function () {
            
            // Users management
            Route::prefix('users')->name('users.')->group(function () {
                Route::get('/', [UserController::class, 'index'])->name('index');
                Route::post('/', [UserController::class, 'store'])->name('store');
                Route::get('/{user}', [UserController::class, 'show'])->name('show');
                Route::put('/{user}', [UserController::class, 'update'])->name('update');
                Route::patch('/{user}/toggle', [UserController::class, 'toggleActive'])->name('toggle');
                Route::delete('/{user}', [UserController::class, 'destroy'])->name('destroy');
                Route::post('/invitation-codes', [UserController::class, 'generateInvitationCode'])->name('invite');
            });

            // Classes management
            Route::apiResource('classes', ClassController::class);
            Route::get('/classes/{class}/students', [ClassController::class, 'students'])->name('classes.students');

            // Students management
            Route::apiResource('students', StudentController::class);
            
            // IMPORT/EXPORT ÉTUDIANTS
            Route::prefix('students')->name('students.')->group(function () {
                Route::post('/import', [StudentImportController::class, 'import'])->name('import');
                Route::get('/template', [StudentImportController::class, 'downloadTemplate'])->name('template');
                Route::post('/{student}/assign-parent', [StudentController::class, 'assignParent'])->name('assign-parent');
            });

            // =============================================================
            // TRANSPORT MANAGEMENT (ADMIN)
            // =============================================================
            Route::prefix('transport')->name('transport.')->group(function () {
                // Test endpoint
                Route::get('/test-buses-simple', [TransportController::class, 'testBusesSimple']);
                
                // Bus Management
                Route::get('/buses', [TransportController::class, 'buses'])->name('buses');
                Route::post('/buses', [TransportController::class, 'storeBus'])->name('buses.store');
                Route::get('/buses/{id}', [TransportController::class, 'showBus'])->name('buses.show');
                Route::put('/buses/{id}', [TransportController::class, 'updateBus'])->name('buses.update');
                Route::delete('/buses/{id}', [TransportController::class, 'deleteBus'])->name('buses.destroy');
                Route::get('/buses-with-routes', [TransportController::class, 'getBusesWithRoutes'])->name('buses-with-routes');
                
                // Route Management
                Route::get('/routes', [TransportController::class, 'routes'])->name('routes');
                Route::post('/routes', [TransportController::class, 'storeRoute'])->name('routes.store');
                Route::get('/routes/{id}', [TransportController::class, 'showRoute'])->name('routes.show');
                Route::put('/routes/{id}', [TransportController::class, 'updateRoute'])->name('routes.update');
                Route::delete('/routes/{id}', [TransportController::class, 'deleteRoute'])->name('routes.destroy');
                Route::get('/routes-with-buses', [TransportController::class, 'getRoutesWithBuses'])->name('routes-with-buses');
                
                // Trip Management
                Route::get('/trips', [TransportController::class, 'trips'])->name('trips');
                Route::post('/trips', [TransportController::class, 'storeTrip'])->name('trips.store');
                Route::get('/trips/{id}', [TransportController::class, 'showTrip'])->name('trips.show');
                Route::put('/trips/{id}', [TransportController::class, 'updateTrip'])->name('trips.update');
                Route::delete('/trips/{id}', [TransportController::class, 'deleteTrip'])->name('trips.destroy');
                
                // Student Assignment
                Route::post('/assign-student', [TransportController::class, 'assignStudentToBus'])->name('assign');
                Route::post('/assign-students-bulk', [TransportController::class, 'assignStudentsBulk'])->name('assign-students-bulk');
                Route::get('/assigned-students', [TransportController::class, 'getAssignedStudents'])->name('assigned-students');
                
                // ✅ NOUVELLES ROUTES POUR ASSIGNATIONS CHAUFFEUR
                Route::get('/driver-assignments', [TransportController::class, 'getDriverAssignments'])->name('driver-assignments');
                Route::post('/assign-bus-to-driver', [TransportController::class, 'assignBusToDriver'])->name('assign-bus-to-driver');
                Route::post('/assign-class-to-driver', [TransportController::class, 'assignClassToDriver'])->name('assign-class-to-driver');
                Route::delete('/driver-assignments/{id}', [TransportController::class, 'deleteDriverAssignment'])->name('delete-driver-assignment');
            });
            
            // =============================================================
            // ADMIN/TEACHER STUDENT TRACKING
            // =============================================================
            Route::get('/all-students-tracking', [TransportController::class, 'getAllStudentsWithStatus'])->name('all-students-tracking');
        });

        // =============================================================
        // TEACHER ROUTES
        // =============================================================
        Route::middleware('role:teacher,admin')->prefix('teacher')->name('teacher.')->group(function () {
            Route::get('/classes', [ClassController::class, 'index'])->name('classes');
            Route::get('/my-classes', [ClassController::class, 'myClasses'])->name('my-classes');
            Route::get('/classes/{class}/students', [ClassController::class, 'students'])->name('class.students');
            
            Route::post('/students/{student}/points', [StudentPointController::class, 'store'])->name('points.store');
            Route::put('/points/{point}', [StudentPointController::class, 'update'])->name('points.update');
            Route::delete('/points/{point}', [StudentPointController::class, 'destroy'])->name('points.destroy');
            
            Route::get('/tasks', [TaskPointController::class, 'getTasks'])->name('tasks');
            Route::post('/students/{student}/task-points', [TaskPointController::class, 'assignPoints'])->name('task-points.assign');
            Route::get('/students/{student}/task-points', [TaskPointController::class, 'getStudentPoints'])->name('task-points.show');
        });

        // =============================================================
        // PARENT ROUTES
        // =============================================================
        Route::middleware('role:parent,admin')->prefix('parent')->name('parent.')->group(function () {
            Route::get('/students', [StudentController::class, 'index'])->name('students');
            Route::get('/students/{student}', [StudentController::class, 'show'])->name('students.show');
            Route::get('/students/{student}/points', [StudentController::class, 'points'])->name('students.points');
            Route::get('/students/{student}/task-points', [TaskPointController::class, 'getStudentPoints'])->name('students.task-points');
            Route::get('/students/{student}/trip', [StudentController::class, 'getStudentTrip'])->name('students.trip');
        });

        // =============================================================
        // DRIVER ROUTES
        // =============================================================
        Route::middleware('role:driver,admin')->prefix('driver')->name('driver.')->group(function () {
            // Dashboard & Overview
            Route::get('/dashboard', [TransportController::class, 'driverDashboard'])->name('dashboard');
            
            // Class-based Student Management
            Route::get('/assigned-students-by-class', [TransportController::class, 'getAssignedStudentsByClass'])->name('assigned-students-by-class');
            Route::post('/start-class-trip', [TransportController::class, 'startClassTrip'])->name('start-class-trip');
            
            // Individual Student Trip Management
            Route::get('/assigned-students', [TransportController::class, 'getAssignedStudents'])->name('assigned-students');
            Route::post('/start-trip/{studentId}', [TransportController::class, 'startStudentTrip'])->name('start-trip');
            Route::post('/end-trip/{studentId}', [TransportController::class, 'endStudentTrip'])->name('end-trip');
            
            // Vehicle & Route Info
            Route::get('/bus', [TransportController::class, 'myBus'])->name('bus');
            Route::get('/route', [TransportController::class, 'myRoute'])->name('route');
            Route::get('/my-trip', [TransportController::class, 'myCurrentTrip'])->name('my-trip');
            
            // Trip Management
            Route::get('/trips', [TransportController::class, 'trips'])->name('trips');
            Route::patch('/trips/{trip}/status', [TransportController::class, 'updateTripStatus'])->name('trips.status');
            
            // Location Tracking
            Route::post('/location', [TransportController::class, 'updateLocation'])->name('location');
        });

        // =============================================================
        // TRANSPORT NOTIFICATIONS
        // =============================================================
        Route::prefix('transport')->name('transport.')->group(function () {
            Route::get('/notifications', [TransportController::class, 'myNotifications'])->name('notifications');
            Route::post('/notifications/read-all', [TransportController::class, 'markAllNotificationsRead'])->name('notifications.read-all');
            Route::post('/notifications/{notification}/read', [TransportController::class, 'markNotificationRead'])->name('notifications.read');
        });
    });
});