<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentPoint extends Model
{
    protected $fillable = ['student_id', 'awarded_by', 'points', 'reason', 'category'];
    
    protected $casts = [
        'points' => 'integer',
    ];
    
    public function student()
    {
        return $this->belongsTo(Student::class);
    }
    
    public function awardedBy()
    {
        return $this->belongsTo(User::class, 'awarded_by');
    }
}