<?php

namespace App\Policies;

use App\Models\Conversation;
use App\Models\User;

class ConversationPolicy
{
    /**
     * Determine if the user can view the conversation.
     */
    public function view(User $user, Conversation $conversation): bool
    {
        // User can view if they are the parent, the teacher, or an admin
        return $user->id === $conversation->parent_id
            || $user->id === $conversation->teacher_id
            || $user->isAdmin();
    }

    /**
     * Determine if the user can send a message in the conversation.
     */
    public function sendMessage(User $user, Conversation $conversation): bool
    {
        // Only participants can send messages
        return $user->id === $conversation->parent_id 
            || $user->id === $conversation->teacher_id;
    }

    /**
     * Determine if the user can start a conversation.
     */
    public function create(User $user): bool
    {
        // Parents, teachers, and admins can start conversations
        return $user->isParent() || $user->isTeacher() || $user->isAdmin();
    }
}