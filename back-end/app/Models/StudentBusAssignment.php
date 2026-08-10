<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentBusAssignment extends Model
{
    protected $fillable = ['student_id', 'route_id', 'stop_id', 'is_active'];

    protected $casts = ['is_active' => 'boolean'];

    public function student() { return $this->belongsTo(Student::class); }
    public function route()   { return $this->belongsTo(BusRoute::class, 'route_id'); }
    public function stop()    { return $this->belongsTo(BusStop::class, 'stop_id'); }
}
