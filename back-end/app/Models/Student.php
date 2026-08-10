<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Student extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'first_name', 'last_name', 'date_of_birth', 'gender',
        'student_code', 'class_id', 'avatar', 'is_active',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'is_active' => 'boolean',
    ];

    public function class()
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

   public function parents()
{
    return $this->belongsToMany(User::class, 'student_parents', 'student_id', 'parent_id')
                ->withPivot('relation', 'is_primary', 'created_at')
                ->withTimestamps(); // ← Supprimez cette ligne ou commentez-la
}

    public function points()
    {
        return $this->hasMany(StudentPoint::class);
    }

    public function totalPoints(): int
    {
        return $this->points()->sum('points');
    }

    public function busAssignment()
    {
        return $this->hasOne(StudentBusAssignment::class)->where('is_active', true);
    }

    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }
}