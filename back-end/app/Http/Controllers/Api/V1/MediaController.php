<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Media;
use App\Services\MediaService;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class MediaController extends Controller
{
    use ApiResponse;

    public function __construct(private readonly MediaService $mediaService) {}

    /**
     * Upload a file and optionally attach it to a model.
     * 
     * Body params:
     *   file          – The uploaded file (required)
     *   collection    – avatar | attachment | document (default: attachment)
     *   mediable_type – Model class: App\\Models\\Post | App\\Models\\Message (optional)
     *   mediable_id   – Model ID (required if mediable_type given)
     */
    public function upload(Request $request)
    {
        $request->validate([
            'file' => [
                'required',
                'file',
                'max:10240', // 10 MB max
                'mimes:jpg,jpeg,png,gif,webp,pdf,doc,docx,xls,xlsx,txt',
            ],
            'collection' => ['nullable', 'in:avatar,attachment,document,default'],
            'mediable_type' => ['nullable', 'string', 'in:App\\Models\\Post,App\\Models\\Message,App\\Models\\Student,App\\Models\\User'],
            'mediable_id' => ['required_with:mediable_type', 'integer'],
        ]);

        $media = $this->mediaService->store(
            file: $request->file('file'),
            collection: $request->input('collection', 'attachment'),
            mediableType: $request->input('mediable_type'),
            mediableId: $request->input('mediable_id'),
        );

        return $this->success([
            'id' => $media->id,
            'filename' => $media->filename,
            'mime_type' => $media->mime_type,
            'size' => $media->size,
            'collection' => $media->collection,
            'url' => $media->url,
        ], 'File uploaded successfully.', 201);
    }

    /**
     * Delete a media file.
     */
    public function destroy(Media $media)
    {
        $this->mediaService->delete($media);

        return $this->success(null, 'Media deleted successfully.');
    }
}