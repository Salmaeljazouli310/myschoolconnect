<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\SoftDeletes;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'name', 'email', 'phone', 'password', 'role_id', 'assigned_class_id', 'avatar', 'is_active'
    ];

    protected $hidden = [
        'password', 'remember_token'
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'is_active' => 'boolean',
        'password' => 'hashed',
    ];

    // ============ RELATIONSHIPS ============
    
    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    public function students()
    {
        return $this->belongsToMany(Student::class, 'student_parents', 'parent_id', 'student_id')
                    ->withPivot('relation', 'is_primary')
                    ->withTimestamps();
    }

    /**
     * Get the class assigned to this driver
     */
    public function assignedClass()
    {
        return $this->belongsTo(SchoolClass::class, 'assigned_class_id');
    }

    /**
     * Get students from assigned class (for drivers)
     */
    public function getAssignedStudents()
    {
        if ($this->isDriver() && $this->assigned_class_id) {
            return Student::where('class_id', $this->assigned_class_id)
                ->with(['class', 'parents'])
                ->get();
        }
        return collect();
    }

    /**
     * Get all students that this driver can manage (from assigned class)
     */
    public function getManageableStudents()
    {
        if ($this->isDriver() && $this->assigned_class_id) {
            return $this->assignedClass->students()
                ->with(['parents'])
                ->get();
        }
        return collect();
    }

    // ============ HELPER METHODS ============
    
    public function hasRole(string $role): bool
    {
        return $this->role?->name === $role;
    }

    public function isAdmin(): bool
    {
        return $this->hasRole('admin');
    }

    public function isTeacher(): bool
    {
        return $this->hasRole('teacher');
    }

    public function isParent(): bool
    {
        return $this->hasRole('parent');
    }

    public function isDriver(): bool
    {
        return $this->hasRole('driver');
    }

    /**
     * Check if driver has an assigned class
     */
    public function hasAssignedClass(): bool
    {
        return $this->isDriver() && !is_null($this->assigned_class_id);
    }

    /**
     * Get driver's assigned class name
     */
    public function getAssignedClassNameAttribute(): ?string
    {
        if ($this->assignedClass) {
            return $this->assignedClass->name;
        }
        return null;
    }

    /**
     * Get number of students in driver's assigned class
     */
    public function getAssignedStudentsCountAttribute(): int
    {
        if ($this->isDriver() && $this->assigned_class_id) {
            return Student::where('class_id', $this->assigned_class_id)->count();
        }
        return 0;
    }

    public function pushNotifications()
    {
        return $this->hasMany(PushNotification::class);
    }
}