<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\User;
use App\Models\StudentParent;
use App\Models\Trip;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class StudentController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        try {
            $user = $request->user();
            $query = Student::with(['class']);
            
            if ($user && $user->isParent()) {
                $query->whereHas('parents', function($q) use ($user) {
                    $q->where('parent_id', $user->id);
                });
            }
            
            if ($user && $user->isAdmin() && $request->has('class_id')) {
                $query->where('class_id', $request->class_id);
            }
            
            $students = $query->paginate(30);
            
            // ✅ Add total_points safely with error handling
            $students->getCollection()->transform(function($student) {
                try {
                    $student->total_points = $student->points()->sum('points') ?? 0;
                } catch (\Exception $e) {
                    $student->total_points = 0;
                }
                return $student;
            });
            
            return response()->json([
                'success' => true,
                'data' => $students
            ]);
            
        } catch (\Exception $e) {
            Log::error('Student index error: ' . $e->getMessage());
            Log::error('Student index trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Error fetching students: ' . $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user || !$user->isAdmin()) {
                return $this->error('Unauthorized: Only admin can create students.', 403);
            }

            $validated = $request->validate([
                'first_name' => 'required|string|max:80',
                'last_name' => 'required|string|max:80',
                'date_of_birth' => 'nullable|date',
                'gender' => 'nullable|in:male,female,other',
                'class_id' => 'required|exists:classes,id',
                'parent_ids' => 'nullable|array',
                'parent_ids.*' => 'exists:users,id',
            ]);

            $student = Student::create([
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'date_of_birth' => $validated['date_of_birth'] ?? null,
                'gender' => $validated['gender'] ?? null,
                'class_id' => $validated['class_id'],
                'student_code' => 'STU_' . strtoupper(Str::random(8)) . '_' . time(),
            ]);

            if (!empty($validated['parent_ids'])) {
                $pivotData = [];
                foreach ($validated['parent_ids'] as $index => $parentId) {
                    $pivotData[$parentId] = [
                        'relation' => 'parent',
                        'is_primary' => $index === 0,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
                $student->parents()->sync($pivotData);
            }

            $student->total_points = 0;

            return $this->success(
                $student->load(['class', 'parents']), 
                'Student created successfully.', 
                201
            );
            
        } catch (\Exception $e) {
            Log::error('Store student error: ' . $e->getMessage());
            return $this->error('Error creating student: ' . $e->getMessage(), 500);
        }
    }

    public function show(Request $request, Student $student)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return $this->error('Unauthenticated', 401);
            }
            
            if (!$user->isAdmin() && 
                !($user->isTeacher() && $student->class && $student->class->teacher_id === $user->id) &&
                !($user->isParent() && $student->parents->contains($user->id))) {
                return $this->error('Unauthorized to view this student.', 403);
            }

            try {
                $student->total_points = $student->points()->sum('points') ?? 0;
            } catch (\Exception $e) {
                $student->total_points = 0;
            }

            return $this->success(
                $student->load(['class', 'parents', 'points']),
                'Student retrieved successfully.'
            );
            
        } catch (\Exception $e) {
            Log::error('Show student error: ' . $e->getMessage());
            return $this->error('Error fetching student: ' . $e->getMessage(), 500);
        }
    }

    public function update(Request $request, Student $student)
    {
        try {
            $user = $request->user();
            
            if (!$user || !$user->isAdmin()) {
                return $this->error('Unauthorized: Only admin can update students.', 403);
            }

            $validated = $request->validate([
                'first_name' => 'sometimes|string|max:80',
                'last_name' => 'sometimes|string|max:80',
                'date_of_birth' => 'nullable|date',
                'gender' => 'nullable|in:male,female,other',
                'class_id' => 'sometimes|exists:classes,id',
                'is_active' => 'sometimes|boolean',
            ]);

            $student->update($validated);
            
            try {
                $student->total_points = $student->points()->sum('points') ?? 0;
            } catch (\Exception $e) {
                $student->total_points = 0;
            }

            return $this->success(
                $student->fresh(['class', 'parents']), 
                'Student updated successfully.'
            );
            
        } catch (\Exception $e) {
            Log::error('Update student error: ' . $e->getMessage());
            return $this->error('Error updating student: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Assign a parent to a student (Admin only)
     * POST /api/v1/admin/students/{student}/assign-parent
     */
    public function assignParent(Request $request, Student $student)
    {
        try {
            $user = $request->user();
            
            if (!$user || !$user->isAdmin()) {
                return $this->error('Unauthorized: Only admin can assign parents.', 403);
            }

            $validated = $request->validate([
                'parent_id' => 'required|exists:users,id',
                'relation' => 'nullable|string|max:30|default:parent',
                'is_primary' => 'nullable|boolean|default:true'
            ]);

            $parent = User::find($validated['parent_id']);
            
            if (!$parent || !$parent->isParent()) {
                return $this->error('This user is not a parent.', 422);
            }

            $existingRelation = StudentParent::where('student_id', $student->id)
                ->where('parent_id', $validated['parent_id'])
                ->first();

            if ($existingRelation) {
                return $this->error('This parent is already linked to this student.', 422);
            }

            StudentParent::create([
                'student_id' => $student->id,
                'parent_id' => $validated['parent_id'],
                'relation' => $validated['relation'] ?? 'parent',
                'is_primary' => $validated['is_primary'] ?? true,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            if ($validated['is_primary'] ?? true) {
                StudentParent::where('student_id', $student->id)
                    ->where('parent_id', '!=', $validated['parent_id'])
                    ->update(['is_primary' => false]);
            }

            return $this->success(
                $student->load(['class', 'parents']),
                'Parent assigned successfully.'
            );

        } catch (\Exception $e) {
            Log::error('Assign parent error: ' . $e->getMessage());
            return $this->error('Error assigning parent: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Remove parent from student (Admin only)
     * DELETE /api/v1/admin/students/{student}/remove-parent/{parentId}
     */
    public function removeParent(Student $student, $parentId)
    {
        try {
            $user = request()->user();
            
            if (!$user || !$user->isAdmin()) {
                return $this->error('Unauthorized: Only admin can remove parents.', 403);
            }

            $deleted = StudentParent::where('student_id', $student->id)
                ->where('parent_id', $parentId)
                ->delete();

            if (!$deleted) {
                return $this->error('Relationship not found.', 404);
            }

            return $this->success(null, 'Parent removed successfully.');

        } catch (\Exception $e) {
            Log::error('Remove parent error: ' . $e->getMessage());
            return $this->error('Error removing parent: ' . $e->getMessage(), 500);
        }
    }

    public function destroy(Student $student)
    {
        try {
            $user = request()->user();
            
            if (!$user || !$user->isAdmin()) {
                return $this->error('Unauthorized: Only admin can delete students.', 403);
            }
            
            DB::beginTransaction();
            
            try {
                $student->points()->delete();
            } catch (\Exception $e) {
                // Points table might not exist
            }
            
            try {
                \App\Models\StudentTaskPoint::where('student_id', $student->id)->delete();
            } catch (\Exception $e) {
                // Task points table might not exist
            }
            
            $student->parents()->detach();
            $student->delete();
            
            DB::commit();
            
            return $this->success(null, 'Student deleted successfully.');
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Delete student error: ' . $e->getMessage());
            return $this->error('Error deleting student: ' . $e->getMessage(), 500);
        }
    }

    public function points(Student $student)
    {
        try {
            $classicPoints = $student->points()->with('awardedBy')->latest()->paginate(20);
            
            $taskPoints = \App\Models\StudentTaskPoint::where('student_id', $student->id)
                ->with('task')
                ->get();
            
            $totalTaskPoints = $taskPoints->sum('points');
            $tasks = \App\Models\Task::all();
            $taskPointsArray = [];
            
            foreach ($tasks as $task) {
                $pointsObtained = $taskPoints->where('task_id', $task->id)->sum('points');
                $taskPointsArray[] = [
                    'task_id' => $task->id,
                    'task_name' => $task->name,
                    'points_obtained' => min($pointsObtained, $task->max_points ?? 10),
                    'max_points' => $task->max_points ?? 10,
                    'icon' => $task->icon,
                    'color' => $task->color,
                ];
            }
            
            return response()->json([
                'success' => true,
                'data' => [
                    'student' => $student,
                    'classic_points' => $classicPoints,
                    'task_points' => $taskPointsArray,
                    'total_points' => min($totalTaskPoints, 50)
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error('Points error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching points: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getStudentTaskPoints($studentId)
    {
        try {
            $student = Student::findOrFail($studentId);
            
            $user = request()->user();
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthenticated'
                ], 401);
            }
            
            if (!$user->isAdmin() && 
                !($user->isTeacher() && $student->class && $student->class->teacher_id === $user->id) &&
                !($user->isParent() && $student->parents->contains($user->id))) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }
            
            $taskPoints = \App\Models\StudentTaskPoint::where('student_id', $studentId)
                ->with(['task', 'teacher'])
                ->get();
            
            $total = $taskPoints->sum('points');
            $total = min($total, 50);
            
            $tasks = \App\Models\Task::all();
            $tasksWithPoints = [];
            
            foreach ($tasks as $task) {
                $taskPoint = $taskPoints->where('task_id', $task->id)->first();
                $points = $taskPoint ? $taskPoint->points : 0;
                
                $tasksWithPoints[] = [
                    'id' => $taskPoint ? $taskPoint->id : null,
                    'task_id' => $task->id,
                    'task_name' => $task->name,
                    'task_icon' => $task->icon,
                    'task_color' => $task->color,
                    'default_points' => $task->default_points ?? 0,
                    'max_points' => $task->max_points ?? 10,
                    'points_obtained' => min($points, $task->max_points ?? 10),
                    'comment' => $taskPoint ? $taskPoint->comment : null,
                    'date' => $taskPoint ? $taskPoint->date : null,
                    'teacher' => $taskPoint && $taskPoint->teacher ? [
                        'id' => $taskPoint->teacher->id,
                        'name' => $taskPoint->teacher->name,
                    ] : null,
                    'history' => $taskPoints->where('task_id', $task->id)->values()->map(function($p) {
                        return [
                            'id' => $p->id,
                            'points' => $p->points,
                            'comment' => $p->comment,
                            'date' => $p->date,
                            'teacher_name' => $p->teacher ? $p->teacher->name : null,
                        ];
                    })
                ];
            }
            
            return response()->json([
                'success' => true,
                'data' => [
                    'student' => $student,
                    'grand_total' => $total,
                    'max_total' => 50,
                    'tasks' => $tasksWithPoints
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error('Get student task points error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching points: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get the current trip for a student (for parents)
     * GET /api/v1/parent/students/{student}/trip
     */
    public function getStudentTrip($id)
    {
        try {
            $student = Student::find($id);
            
            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student not found'
                ], 404);
            }
            
            $user = request()->user();
            if ($user && $user->isParent()) {
                $hasAccess = DB::table('student_parents')
                    ->where('student_id', $id)
                    ->where('parent_id', $user->id)
                    ->exists();
                
                if (!$hasAccess) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Unauthorized'
                    ], 403);
                }
            }
            
            $trip = Trip::where('student_id', $id)
                ->whereDate('date', today())
                ->first();
            
            return response()->json([
                'success' => true,
                'data' => $trip
            ]);
            
        } catch (\Exception $e) {
            Log::error('Get Student Trip Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching trip: ' . $e->getMessage()
            ], 500);
        }
    }
}