<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Bus extends Model
{
    protected $fillable = [
        'plate_number', 
        'capacity', 
        'model', 
        'class_id',      // ✅ Ajoutez cette ligne
        'is_active'
    ];

    protected $casts = [
        'capacity'  => 'integer',
        'is_active' => 'boolean',
    ];

    // Relation avec la classe
    public function class()
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function routes()
    {
        return $this->hasMany(BusRoute::class);
    }

    public function currentDriver()
    {
        return $this->hasOneThrough(
            User::class, 
            BusDriver::class, 
            'bus_id',
            'id',
            'id',
            'driver_id'
        )->where('bus_drivers.is_current', true);
    }

    public function drivers()
    {
        return $this->belongsToMany(User::class, 'bus_drivers', 'bus_id', 'driver_id')
                    ->withPivot('assigned_at', 'is_current');
    }
}