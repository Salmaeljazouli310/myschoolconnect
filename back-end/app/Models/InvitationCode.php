<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InvitationCode extends Model
{
    use HasFactory;

    protected $fillable = [
        'code', 'role_id', 'created_by', 'used_by',
        'class_id', 'used_at', 'expires_at', 'is_used',
    ];

    protected $casts = [
        'is_used' => 'boolean',
        'used_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    // ============ RELATIONSHIPS ============

    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function usedBy()
    {
        return $this->belongsTo(User::class, 'used_by');
    }

    public function class()
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    // ============ HELPER METHODS ============

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public function isAvailable(): bool
    {
        return !$this->is_used && !$this->isExpired();
    }
}