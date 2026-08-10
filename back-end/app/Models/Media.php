<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Media extends Model
{
    protected $fillable = [
        'mediable_id', 'mediable_type', 'disk', 'path',
        'filename', 'mime_type', 'size', 'collection'
    ];

    protected $casts = [
        'size' => 'integer'
    ];

    public function mediable()
    {
        return $this->morphTo();
    }

    public function getUrlAttribute()
    {
        return asset('storage/' . $this->path);
    }
}