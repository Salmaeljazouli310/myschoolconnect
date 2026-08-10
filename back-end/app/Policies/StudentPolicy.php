<?php

namespace App\Policies;

use App\Models\Student;
use App\Models\User;

class StudentPolicy
{
    /**
     * Determine if the user can view any students.
     */
    public function viewAny(User $user): bool
    {
        // Admins, teachers, and parents can view students
        return in_array($user->role->name, ['admin', 'teacher', 'parent']);
    }

    /**
     * Determine if the user can view a specific student.
     */
    public function view(User $user, Student $student): bool
    {
        // Admin can view all students
        if ($user->isAdmin()) {
            return true;
        }

        // Teacher can view students in their class
        if ($user->isTeacher()) {
            return $student->class->teacher_id === $user->id;
        }

        // Parent can only view their own children
        if ($user->isParent()) {
            return $user->students()->where('students.id', $student->id)->exists();
        }

        return false;
    }

    /**
     * Determine if the user can create a student.
     */
    public function create(User $user): bool
    {
        // Only admin can create students
        return $user->isAdmin();
    }

    /**
     * Determine if the user can update a student.
     */
    public function update(User $user): bool
    {
        // Only admin can update students
        return $user->isAdmin();
    }

    /**
     * Determine if the user can delete a student.
     */
    public function delete(User $user): bool
    {
        // Only admin can delete students
        return $user->isAdmin();
    }
}