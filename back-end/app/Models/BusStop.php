<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BusStop extends Model
{
    // Disable automatic timestamps since your table doesn't have updated_at
    public $timestamps = false;

    protected $fillable = ['route_id', 'name', 'latitude', 'longitude', 'order', 'created_at'];

    protected $casts = [
        'latitude'  => 'decimal:8',
        'longitude' => 'decimal:8',
        'order'     => 'integer',
    ];

    public function route() 
    { 
        return $this->belongsTo(BusRoute::class, 'route_id'); 
    }
}
