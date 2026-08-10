<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\Task;
use App\Models\StudentTaskPoint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TaskPointController extends Controller
{
    // ✅ Obtenir toutes les tâches
    public function getTasks()
    {
        $tasks = Task::all();
        return response()->json($tasks);
    }
    
    // ✅ Attribuer des points à un étudiant (écrasement)
    public function assignPoints(Request $request, $studentId)
    {
        try {
            $request->validate([
                'task_id' => 'required|exists:tasks,id',
                'points' => 'required|integer|min:0|max:10',
                'comment' => 'nullable|string|max:255'
            ]);
            
            $student = Student::findOrFail($studentId);
            $teacher = $request->user();
            
            DB::beginTransaction();
            
            // Écraser la note existante ou en créer une nouvelle
            $point = StudentTaskPoint::updateOrCreate(
                [
                    'student_id' => $studentId,
                    'task_id' => $request->task_id,
                ],
                [
                    'teacher_id' => $teacher->id,
                    'points' => $request->points,
                    'comment' => $request->comment,
                    'date' => now()
                ]
            );
            
            // Calculer le total (sur 40)
            $totalPoints = StudentTaskPoint::where('student_id', $studentId)->sum('points');
            $totalPoints = min($totalPoints, 40);
            
            $student->total_points = $totalPoints;
            $student->save();
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'grand_total' => $totalPoints,
                'max_total' => 40,
                'point' => $point,
                'message' => 'Points attribués avec succès'
            ], 201);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    // ✅ Obtenir les points d'un étudiant
    public function getStudentPoints($studentId)
    {
        try {
            $student = Student::findOrFail($studentId);
            $tasks = Task::all();
            
            $tasksWithPoints = [];
            $grandTotal = 0;
            
            foreach ($tasks as $task) {
                $taskPoint = StudentTaskPoint::where('student_id', $studentId)
                    ->where('task_id', $task->id)
                    ->first();
                
                $pointsObtained = $taskPoint ? $taskPoint->points : 0;
                $grandTotal += $pointsObtained;
                
                $tasksWithPoints[] = [
                    'id' => $taskPoint ? $taskPoint->id : null,
                    'task_id' => $task->id,
                    'task_name' => $task->name,
                    'task_icon' => $task->icon,
                    'task_color' => $task->color,
                    'default_points' => $task->default_points,
                    'max_points' => $task->max_points,
                    'points_obtained' => $pointsObtained,
                    'comment' => $taskPoint ? $taskPoint->comment : null,
                    'date' => $taskPoint ? $taskPoint->date : null,
                ];
            }
            
            $grandTotal = min($grandTotal, 40);
            
            return response()->json([
                'success' => true,
                'student' => $student,
                'grand_total' => $grandTotal,
                'max_total' => 40,
                'tasks' => $tasksWithPoints
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
}