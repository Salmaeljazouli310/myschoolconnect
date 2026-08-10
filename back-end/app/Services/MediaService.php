<?php

namespace App\Services;

use App\Models\Media;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MediaService
{
    public function store(UploadedFile $file, string $collection = 'attachment', ?string $mediableType = null, ?int $mediableId = null): Media
    {
        $path = $file->store('uploads/' . $collection, 'public');
        
        $media = Media::create([
            'mediable_id' => $mediableId,
            'mediable_type' => $mediableType,
            'disk' => 'public',
            'path' => $path,
            'filename' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
            'collection' => $collection,
        ]);
        
        return $media;
    }
    
    public function delete(Media $media): bool
    {
        Storage::disk($media->disk)->delete($media->path);
        return $media->delete();
    }
}