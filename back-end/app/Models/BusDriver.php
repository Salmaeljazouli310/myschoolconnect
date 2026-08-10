<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BusDriver extends Model
{
    public $timestamps = false;

    protected $fillable = ['bus_id', 'driver_id', 'assigned_at', 'is_current'];

    protected $casts = [
        'is_current'  => 'boolean',
        'assigned_at' => 'datetime',
    ];

    public function bus() 
    { 
        return $this->belongsTo(Bus::class); 
    }
    
    public function driver() 
    { 
        return $this->belongsTo(User::class, 'driver_id'); 
    }
}