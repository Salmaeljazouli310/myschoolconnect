<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\PushNotification;
use App\Models\SchoolClass;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MessagingController extends Controller
{
    use ApiResponse;

    // ═══════════════════════════════════════════════════════════════
    // GET /api/v1/messaging/conversations
    // Returns all conversations for the authenticated user
    // ═══════════════════════════════════════════════════════════════
    public function conversations(Request $request)
    {
        try {
            $user = $request->user();

            $query = Conversation::with([
                'latestMessage.sender:id,name,avatar',
                'class:id,name,grade',
                'parent:id,name,avatar',
                'teacher:id,name,avatar',
            ]);

            // Filter to only this user's conversations
            if ($user->isParent()) {
                $query->where('parent_id', $user->id);
            } elseif ($user->isTeacher()) {
                $query->where('teacher_id', $user->id);
            }

            $conversations = $query
                ->orderByDesc('updated_at')
                ->paginate($request->per_page ?? 20);

            // Attach unread count per conversation for this user
            $conversations->getCollection()->transform(function (Conversation $conv) use ($user) {
                $conv->unread_count = $conv->messages()
                    ->where('receiver_id', $user->id)
                    ->where('is_read', false)
                    ->count();

                // Surface the "other" participant for easy frontend rendering
                $conv->participant = $user->isParent()
                    ? $conv->teacher
                    : $conv->parent;

                return $conv;
            });

            return $this->success($conversations, 'Conversations retrieved successfully.');
        } catch (\Exception $e) {
            Log::error('Get Conversations Error: ' . $e->getMessage());
            return $this->error('Error fetching conversations: ' . $e->getMessage(), 500);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // POST /api/v1/messaging/conversations
    // Create or resume a conversation
    // ═══════════════════════════════════════════════════════════════
    public function startConversation(Request $request)
    {
        try {
            $user = $request->user();

            $validated = $request->validate([
                'teacher_id'     => ['nullable', 'exists:users,id'],
                'parent_id'      => ['nullable', 'exists:users,id'],
                'participant_id' => ['nullable', 'exists:users,id'],
                'class_id'       => ['nullable', 'exists:classes,id'],
            ]);

            // Handle participant_id if provided
            if (!empty($validated['participant_id']) && empty($validated['teacher_id']) && empty($validated['parent_id'])) {
                $participant = User::find($validated['participant_id']);
                if ($participant) {
                    if ($participant->isTeacher()) {
                        $validated['teacher_id'] = $validated['participant_id'];
                    } elseif ($participant->isParent()) {
                        $validated['parent_id'] = $validated['participant_id'];
                    }
                }
            }

            if ($user->isParent()) {
                if (empty($validated['teacher_id'])) {
                    return $this->error('teacher_id or participant_id is required.', 422);
                }
                $parentId  = $user->id;
                $teacherId = $validated['teacher_id'];

            } elseif ($user->isTeacher()) {
                if (empty($validated['parent_id'])) {
                    return $this->error('parent_id or participant_id is required.', 422);
                }
                $teacherId = $user->id;
                $parentId  = $validated['parent_id'];

            } else {
                return $this->error('Only parents and teachers can start conversations.', 403);
            }

            // Get class_id: use provided value, or get first class the teacher teaches, or default to 1
            $classId = $validated['class_id'] ?? null;
            if (!$classId && $user->isTeacher()) {
                $classId = SchoolClass::where('teacher_id', $teacherId)->value('id');
            }
            if (!$classId) {
                $classId = 1;
            }

            // Create or get conversation (unique by parent_id + teacher_id)
            $conversation = Conversation::firstOrCreate(
                [
                    'parent_id'  => (int) $parentId,
                    'teacher_id' => (int) $teacherId,
                ],
                [
                    'class_id' => (int) $classId,
                ]
            );

            $conversation->load([
                'class:id,name,grade',
                'parent:id,name,avatar',
                'teacher:id,name,avatar',
                'latestMessage',
            ]);

            $conversation->participant = $user->isParent()
                ? $conversation->teacher
                : $conversation->parent;

            return $this->success($conversation, 'Conversation ready.', 201);
        } catch (\Exception $e) {
            Log::error('Start Conversation Error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return $this->error('Error starting conversation: ' . $e->getMessage(), 500);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // GET /api/v1/messaging/conversations/{conversationId}/messages
    // Paginated message history for a conversation
    // ═══════════════════════════════════════════════════════════════
    public function messages(Request $request, $conversationId)
    {
        try {
            $user = $request->user();
            $conversation = Conversation::findOrFail($conversationId);

            if (!$this->canAccessConversation($user, $conversation)) {
                return $this->error('Unauthorized access to this conversation.', 403);
            }

            // Load messages newest-first (frontend reverses for display)
            $messages = $conversation->messages()
                ->with('sender:id,name,avatar')
                ->orderBy('created_at', 'desc')
                ->paginate($request->per_page ?? 30);

            // Add attachment URL accessor
            $messages->getCollection()->transform(fn ($m) => $this->formatMessage($m));

            // Mark all incoming messages as read
            $conversation->messages()
                ->where('receiver_id', $user->id)
                ->where('is_read', false)
                ->update(['is_read' => true, 'read_at' => now()]);

            return $this->success($messages, 'Messages retrieved successfully.');
        } catch (\Exception $e) {
            Log::error('Get Messages Error: ' . $e->getMessage());
            return $this->error('Error fetching messages: ' . $e->getMessage(), 500);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // POST /api/v1/messaging/conversations/{conversationId}/messages
    // Send a message
    // ═══════════════════════════════════════════════════════════════
    public function sendMessage(Request $request, $conversationId)
    {
        try {
            $user = $request->user();
            $conversation = Conversation::findOrFail($conversationId);

            if (!$this->canAccessConversation($user, $conversation)) {
                return $this->error('Unauthorized access to this conversation.', 403);
            }

            $request->validate([
                'content' => ['required', 'string', 'max:5000'],
            ]);

            // Determine receiver
            $receiverId = ($conversation->parent_id === $user->id)
                ? $conversation->teacher_id
                : $conversation->parent_id;

            // Persist message
            $message = $conversation->messages()->create([
                'sender_id' => $user->id,
                'receiver_id' => $receiverId,
                'body' => $request->content,
                'is_read' => false,
            ]);

            // Bump conversation updated_at
            $conversation->touch();

            $message->load('sender:id,name,avatar');
            $formatted = $this->formatMessage($message);

            // Broadcast to Socket.io
            $this->broadcastToSocket('/broadcast-message', [
                'receiver_id' => $receiverId,
                'message' => $formatted,
                'conversation_id' => $conversation->id,
            ]);

            // Create push notification
            PushNotification::create([
                'user_id' => $receiverId,
                'type' => 'new_message',
                'title' => '💬 Nouveau message',
                'body' => $user->name . ': ' . Str::limit($request->content, 80),
                'data' => json_encode([
                    'conversation_id' => $conversation->id,
                    'sender_id' => $user->id,
                    'sender_name' => $user->name,
                ]),
            ]);

            return $this->success($formatted, 'Message sent successfully.', 201);
            
        } catch (\Exception $e) {
            Log::error('Send Message Error: ' . $e->getMessage());
            return $this->error('Error sending message: ' . $e->getMessage(), 500);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // POST /api/v1/messaging/conversations/{conversationId}/read
    // Mark all messages in a conversation as read for current user
    // ═══════════════════════════════════════════════════════════════
    public function markAsRead(Request $request, $conversationId)
    {
        try {
            $user = $request->user();
            $conversation = Conversation::findOrFail($conversationId);

            if (!$this->canAccessConversation($user, $conversation)) {
                return $this->error('Unauthorized.', 403);
            }

            $updated = $conversation->messages()
                ->where('receiver_id', $user->id)
                ->where('is_read', false)
                ->update(['is_read' => true, 'read_at' => now()]);

            return $this->success(['marked_read' => $updated], 'Messages marked as read.');
        } catch (\Exception $e) {
            Log::error('Mark As Read Error: ' . $e->getMessage());
            return $this->error('Error marking messages as read: ' . $e->getMessage(), 500);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // DELETE /api/v1/messaging/conversations/{conversationId}
    // Soft-delete all messages + hide conversation for current user
    // ═══════════════════════════════════════════════════════════════
    public function deleteConversation(Request $request, $conversationId)
    {
        try {
            $user = $request->user();
            $conversation = Conversation::findOrFail($conversationId);

            if (!$this->canAccessConversation($user, $conversation)) {
                return $this->error('Unauthorized.', 403);
            }

            // Soft-delete messages visible to this user
            $conversation->messages()
                ->where(fn ($q) => $q->where('sender_id', $user->id)
                                      ->orWhere('receiver_id', $user->id))
                ->delete();

            return $this->success(null, 'Conversation deleted.');
        } catch (\Exception $e) {
            Log::error('Delete Conversation Error: ' . $e->getMessage());
            return $this->error('Error deleting conversation: ' . $e->getMessage(), 500);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // GET /api/v1/messaging/contacts
    // Returns list of people this user can message
    // ═══════════════════════════════════════════════════════════════
    public function getContacts(Request $request)
    {
        try {
            $user = $request->user();

            if ($user->isParent()) {
                // For parent: Get teachers from their children's classes
                $studentIds = $user->students()->pluck('students.id');
                
                $teacherIds = SchoolClass::whereHas('students', function ($q) use ($studentIds) {
                    $q->whereIn('students.id', $studentIds);
                })->pluck('teacher_id')->filter()->unique();
                
                $contacts = User::whereIn('id', $teacherIds)
                    ->with('role:id,name')
                    ->select('id', 'name', 'email', 'avatar', 'role_id')
                    ->get()
                    ->map(fn ($u) => array_merge($u->toArray(), [
                        'role_name' => 'teacher',
                        'class_name' => SchoolClass::where('teacher_id', $u->id)
                            ->whereHas('students', fn ($q) => $q->whereIn('id', $studentIds))
                            ->value('name'),
                    ]));
                    
            } elseif ($user->isTeacher()) {
                // Teacher sees ALL parents in the system
                $parents = User::where('role_id', 3)
                    ->orWhereHas('role', fn ($q) => $q->where('name', 'parent'))
                    ->select('id', 'name', 'email', 'avatar', 'role_id')
                    ->get();
                
                $classIds = SchoolClass::where('teacher_id', $user->id)->pluck('id');
                
                $contacts = $parents->map(function ($parent) use ($classIds, $user) {
                    $childrenInMyClasses = collect();
                    
                    if ($classIds->isNotEmpty()) {
                        $childrenInMyClasses = DB::table('student_parents')
                            ->join('students', 'students.id', '=', 'student_parents.student_id')
                            ->where('student_parents.parent_id', $parent->id)
                            ->whereIn('students.class_id', $classIds)
                            ->select('students.first_name', 'students.last_name', 'students.id as student_id')
                            ->get()
                            ->map(fn ($c) => trim($c->first_name . ' ' . $c->last_name));
                    }
                    
                    $allChildrenNames = DB::table('student_parents')
                        ->join('students', 'students.id', '=', 'student_parents.student_id')
                        ->where('student_parents.parent_id', $parent->id)
                        ->select('students.first_name', 'students.last_name')
                        ->get()
                        ->map(fn ($c) => trim($c->first_name . ' ' . $c->last_name))
                        ->toArray();
                    
                    return array_merge($parent->toArray(), [
                        'role_name' => 'parent',
                        'role' => 'parent',
                        'children_names' => $allChildrenNames,
                        'children_in_my_classes' => $childrenInMyClasses->toArray(),
                        'has_children_in_my_class' => $childrenInMyClasses->isNotEmpty(),
                        'can_message' => true,
                    ]);
                });
                
                $contacts = $contacts->sortBy('name')->values();
                
            } else {
                $contacts = collect();
            }

            return $this->success($contacts, 'Contacts retrieved successfully.');
        } catch (\Exception $e) {
            Log::error('Get Contacts Error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return $this->error('Error fetching contacts: ' . $e->getMessage(), 500);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // GET /api/v1/messaging/unread-count
    // Total unread messages for the authenticated user
    // ═══════════════════════════════════════════════════════════════
    public function unreadCount(Request $request)
    {
        try {
            $count = Message::where('receiver_id', $request->user()->id)
                ->where('is_read', false)
                ->whereNull('deleted_at')
                ->count();

            return $this->success(['unread_count' => $count], 'Unread count retrieved.');
        } catch (\Exception $e) {
            Log::error('Unread Count Error: ' . $e->getMessage());
            return $this->error('Error fetching unread count: ' . $e->getMessage(), 500);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // PRIVATE HELPERS
    // ═══════════════════════════════════════════════════════════════

    private function canAccessConversation(User $user, Conversation $conversation): bool
    {
        return $user->isAdmin()
            || $conversation->parent_id  === $user->id
            || $conversation->teacher_id === $user->id;
    }

    private function formatMessage(Message $message): array
    {
        return [
            'id'              => $message->id,
            'content'         => $message->body,
            'body'            => $message->body,
            'sender_id'       => $message->sender_id,
            'receiver_id'     => $message->receiver_id,
            'conversation_id' => $message->conversation_id,
            'is_read'         => $message->is_read,
            'read_at'         => $message->read_at?->toISOString(),
            'created_at'      => $message->created_at->toISOString(),
            'attachment_url'  => null,
            'attachment_type' => null,
            'attachment_name' => null,
            'sender' => $message->sender ? [
                'id'     => $message->sender->id,
                'name'   => $message->sender->name,
                'avatar' => $message->sender->avatar,
            ] : null,
        ];
    }

    /**
     * Broadcast to Socket.io server with internal key authentication
     */
    private function broadcastToSocket(string $path, array $data): void
    {
        try {
            $internalKey = env('INTERNAL_KEY', 'change-me-in-production');
            $socketUrl = rtrim(env('SOCKET_SERVER_URL', 'http://localhost:3002'), '/');
            
            Log::info('Broadcasting to socket', [
                'url' => $socketUrl . $path,
                'data' => $data,
                'internal_key_exists' => !empty($internalKey)
            ]);
            
            $response = Http::timeout(2)
                ->withHeaders([
                    'X-Internal-Key' => $internalKey,
                    'Content-Type'   => 'application/json',
                ])
                ->post($socketUrl . $path, $data);
            
            Log::info('Socket broadcast response', [
                'status' => $response->status(), 
                'body' => $response->body()
            ]);
        } catch (\Exception $e) {
            Log::warning('Socket broadcast skipped: ' . $e->getMessage());
        }
    }
}