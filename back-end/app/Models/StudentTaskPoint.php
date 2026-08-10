<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentTaskPoint extends Model
{
    protected $table = 'student_task_points';
    
    protected $fillable = ['student_id', 'task_id', 'teacher_id', 'points', 'comment', 'date'];
    
    protected $casts = [
        'date' => 'date',
    ];
    
    public function student()
    {
        return $this->belongsTo(Student::class);
    }
    
    public function task()
    {
        return $this->belongsTo(Task::class);
    }
    
    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }
}