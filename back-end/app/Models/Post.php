<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Post extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'title', 'body', 'author_id', 'class_id',
        'status', 'approved_by', 'approved_at', 'published_at',
    ];

    protected $casts = [
        'approved_at' => 'datetime',
        'published_at' => 'datetime',
    ];

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function class()
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function media()
    {
        return $this->morphMany(Media::class, 'mediable');
    }

    public function scopePublished($query)
    {
        return $query->where('status', 'approved')
                     ->whereNotNull('published_at')
                     ->where('published_at', '<=', now());
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }
}