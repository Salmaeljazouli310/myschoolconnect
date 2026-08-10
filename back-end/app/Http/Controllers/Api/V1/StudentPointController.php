<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\StudentPoint;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class StudentPointController extends Controller
{
    use ApiResponse;

    public function store(Request $request, Student $student)
    {
        $request->validate([
            'points' => 'required|integer|min:-10|max:10',
            'reason' => 'required|string|max:255',
            'category' => 'nullable|string|max:50',
        ]);

        $point = $student->points()->create([
            'points' => $request->points,
            'reason' => $request->reason,
            'category' => $request->category ?? 'general',
            'awarded_by' => $request->user()->id,
        ]);

        return $this->success($point->load('awardedBy'), 'Points attribués avec succès.', 201);
    }

    public function update(Request $request, StudentPoint $point)
    {
        $request->validate([
            'points' => 'required|integer|min:-10|max:10',
            'reason' => 'required|string|max:255',
            'category' => 'nullable|string|max:50',
        ]);

        $point->update($request->only('points', 'reason', 'category'));

        return $this->success($point->load('awardedBy'), 'Points mis à jour avec succès.');
    }

    public function destroy(StudentPoint $point)
    {
        $point->delete();
        return $this->success(null, 'Point supprimé avec succès.');
    }

    public function leaderboard(Request $request)
    {
        $students = Student::with('class')
            ->withSum('points', 'points')
            ->orderBy('points_sum_points', 'desc')
            ->limit(10)
            ->get();

        return $this->success($students, 'Classement récupéré avec succès.');
    }
}