<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BusRoute extends Model
{
    protected $fillable = ['name', 'description', 'bus_id', 'is_active'];

    protected $casts = ['is_active' => 'boolean'];

    public function bus()     { return $this->belongsTo(Bus::class); }
    public function stops()   { return $this->hasMany(BusStop::class, 'route_id')->orderBy('order'); }
    public function trips()   { return $this->hasMany(Trip::class, 'route_id'); }
    public function students(){ return $this->hasMany(StudentBusAssignment::class, 'route_id'); }
}
