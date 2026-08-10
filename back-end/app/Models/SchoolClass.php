<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class SchoolClass extends Model
{
    use SoftDeletes;

    protected $table = 'classes';

    protected $fillable = [
        'name', 'grade', 'section', 'teacher_id', 'academic_year', 'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function students()
    {
        return $this->hasMany(Student::class, 'class_id');
    }

    public function conversations()
    {
        return $this->hasMany(Conversation::class, 'class_id');
    }

    public function posts()
    {
        return $this->hasMany(Post::class, 'class_id');
    }

    /**
     * Get the driver assigned to this class
     */
    public function assignedDriver()
    {
        return $this->hasOne(User::class, 'assigned_class_id')->where('role_id', 4);
    }

    /**
     * Get all drivers assigned to this class
     */
    public function assignedDrivers()
    {
        return $this->hasMany(User::class, 'assigned_class_id')->where('role_id', 4);
    }

    /**
     * Check if class has an assigned driver
     */
    public function hasAssignedDriver(): bool
    {
        return $this->assignedDriver()->exists();
    }

    /**
     * Get class name with grade and section
     */
    public function getFullNameAttribute(): string
    {
        $name = $this->name;
        if ($this->grade) {
            $name = $this->grade . ' - ' . $name;
        }
        if ($this->section) {
            $name .= ' (' . $this->section . ')';
        }
        return $name;
    }
}