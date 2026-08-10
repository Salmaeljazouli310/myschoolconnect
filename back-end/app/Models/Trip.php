<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Trip extends Model
{
    protected $fillable = [
        'route_id',
        'driver_id',
        'bus_id',
        'student_id',  // Make sure this is included
        'type',
        'status',
        'date',
        'started_at',
        'completed_at',
        'notes',
    ];

    protected $casts = [
        'started_at'   => 'datetime',
        'completed_at' => 'datetime',
        'date'         => 'date',
    ];

    public function route(): BelongsTo
    {
        return $this->belongsTo(BusRoute::class, 'route_id');
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'driver_id');
    }

    public function bus(): BelongsTo
    {
        return $this->belongsTo(Bus::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'in_progress');
    }

    public function scopeToday($query)
    {
        return $query->whereDate('date', today());
    }

    public function scopeForStudent($query, $studentId)
    {
        return $query->where('student_id', $studentId);
    }

    public function scopeForDriver($query, $driverId)
    {
        return $query->where('driver_id', $driverId);
    }
}