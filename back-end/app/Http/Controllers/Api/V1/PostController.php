<?php

namespace App\Http\Controllers\Api\V1;

use App\Events\PostPublished;
use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\Media;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class PostController extends Controller
{
    use ApiResponse;

    /**
     * Display a listing of posts.
     */
    public function index(Request $request)
    {
        $query = Post::with(['author', 'class', 'media'])
            ->when($request->class_id, fn($q, $c) => $q->where('class_id', $c))
            ->when($request->status, fn($q, $s) => $q->where('status', $s))
            ->when($request->search, fn($q, $s) => 
                $q->where('title', 'like', "%{$s}%")
                  ->orWhere('body', 'like', "%{$s}%")
            );

        $user = $request->user();
        
        if (!$user || (!$user->isAdmin() && !$user->isTeacher())) {
            $query->where('status', 'approved');
        }

        $posts = $query->latest()->paginate($request->per_page ?? 15);

        return $this->success($posts, 'Posts retrieved successfully.');
    }

    /**
     * Get pending posts for admin moderation.
     */
    public function pending(Request $request)
    {
        $posts = Post::with(['author', 'class', 'media'])
            ->where('status', 'pending')
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return $this->success($posts, 'Posts en attente récupérés avec succès.');
    }

    /**
     * Store a newly created post.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'title' => ['required', 'string', 'max:200'],
                'body' => ['required', 'string'],
                'class_id' => ['nullable', 'exists:classes,id'],
                'media' => ['nullable', 'array'],
                'media.*' => ['file', 'image', 'max:5120'],
            ]);

            $post = Post::create([
                'title' => $validated['title'],
                'body' => $validated['body'],
                'class_id' => $validated['class_id'] ?? null,
                'status' => 'pending',
                'author_id' => $request->user()->id,
            ]);

            if ($request->hasFile('media')) {
                foreach ($request->file('media') as $file) {
                    $path = $file->store('posts/' . $post->id, 'public');
                    
                    Media::create([
                        'mediable_id' => $post->id,
                        'mediable_type' => Post::class,
                        'disk' => 'public',
                        'path' => $path,
                        'filename' => $file->getClientOriginalName(),
                        'mime_type' => $file->getMimeType(),
                        'size' => $file->getSize(),
                        'collection' => 'default',
                    ]);
                }
            }

            return $this->success(
                $post->load(['author', 'class', 'media']), 
                'Post created successfully, pending approval.', 
                201
            );
            
        } catch (\Exception $e) {
            Log::error('Post store error: ' . $e->getMessage());
            return $this->error('Error creating post: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Display the specified post.
     */
    public function show(Post $post)
    {
        return $this->success(
            $post->load(['author', 'class', 'media', 'approvedBy']), 
            'Post retrieved successfully.'
        );
    }

    /**
     * Update the specified post.
     */
    public function update(Request $request, Post $post)
    {
        try {
            $user = $request->user();
            
            if ($post->author_id !== $user->id && !$user->isAdmin()) {
                return $this->error('Unauthorized to update this post.', 403);
            }

            $validated = $request->validate([
                'title' => ['sometimes', 'string', 'max:200'],
                'body' => ['sometimes', 'string'],
                'class_id' => ['nullable', 'exists:classes,id'],
            ]);

            $post->update($validated);

            return $this->success(
                $post->fresh(['author', 'class', 'media']), 
                'Post updated successfully.'
            );
            
        } catch (\Exception $e) {
            return $this->error('Error updating post: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Submit post for approval.
     */
    public function submit(Request $request, Post $post)
    {
        try {
            $user = $request->user();
            
            if ($post->author_id !== $user->id) {
                return $this->error('Unauthorized to submit this post.', 403);
            }

            if ($post->status !== 'draft' && $post->status !== 'rejected') {
                return $this->error('Post cannot be submitted in its current state.', 422);
            }

            $post->update([
                'status' => 'pending',
                'submitted_at' => now(),
            ]);

            return $this->success($post, 'Post submitted for approval.');
            
        } catch (\Exception $e) {
            return $this->error('Error submitting post: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Approve a post (Admin only).
     */
    public function approve(Request $request, Post $post)
    {
        try {
            $user = $request->user();
            
            if (!$user->isAdmin()) {
                return $this->error('Only admin can approve posts.', 403);
            }

            if ($post->status !== 'pending') {
                return $this->error('Only pending posts can be approved.', 422);
            }

            $post->update([
                'status' => 'approved',
                'approved_by' => $user->id,
                'approved_at' => now(),
                'published_at' => now(),
            ]);

            return $this->success($post->load(['author', 'class', 'media']), 'Post approved successfully.');
            
        } catch (\Exception $e) {
            return $this->error('Error approving post: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Reject a post (Admin only).
     */
    public function reject(Request $request, Post $post)
    {
        try {
            $user = $request->user();
            
            if (!$user->isAdmin()) {
                return $this->error('Only admin can reject posts.', 403);
            }

            if ($post->status !== 'pending') {
                return $this->error('Only pending posts can be rejected.', 422);
            }

            $request->validate([
                'rejection_reason' => ['nullable', 'string', 'max:500']
            ]);

            $post->update([
                'status' => 'rejected',
                'rejection_reason' => $request->rejection_reason,
                'rejected_at' => now(),
            ]);

            return $this->success($post, 'Post rejected successfully.');
            
        } catch (\Exception $e) {
            return $this->error('Error rejecting post: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Delete a post.
     */
    public function destroy(Request $request, Post $post)
    {
        try {
            $user = $request->user();
            
            if ($post->author_id !== $user->id && !$user->isAdmin()) {
                return $this->error('Unauthorized to delete this post.', 403);
            }
            
            foreach ($post->media as $media) {
                Storage::disk($media->disk)->delete($media->path);
                $media->delete();
            }
            
            $post->delete();
            
            return $this->success(null, 'Post deleted successfully.');
            
        } catch (\Exception $e) {
            return $this->error('Error deleting post: ' . $e->getMessage(), 500);
        }
    }
}