<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Post;

class PostPolicy
{
    public function view(User $user, Post $post): bool
    {
        return $user->isAdmin() || 
               $user->isTeacher() || 
               $post->status === 'approved';
    }

    public function create(User $user): bool
    {
        return $user->isTeacher() || $user->isAdmin();
    }

    public function update(User $user, Post $post): bool
    {
        return $user->isAdmin() || $user->id === $post->author_id;
    }

    public function delete(User $user, Post $post): bool
    {
        return $user->isAdmin() || $user->id === $post->author_id;
    }

    public function approve(User $user): bool
    {
        return $user->isAdmin();
    }
}