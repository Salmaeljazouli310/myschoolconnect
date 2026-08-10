<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentParent extends Model
{
    protected $table = 'student_parents';
    
    protected $fillable = [
        'student_id',
        'parent_id',
        'relation',
        'is_primary',
        'created_at',
        'updated_at'
    ];
    
    public $timestamps = false; // Si tu gères manuellement created_at/updated_at
    
    public function student()
    {
        return $this->belongsTo(Student::class);
    }
    
    public function parent()
    {
        return $this->belongsTo(User::class, 'parent_id');
    }
}