<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    use ApiResponse;

    /**
     * Display a listing of notifications for the authenticated user.
     */
    public function index(Request $request)
    {
        $notifications = $request->user()
            ->notifications()
            ->when($request->boolean('unread'), fn($q) => $q->whereNull('read_at'))
            ->paginate(20);

        return $this->success([
            'notifications' => $notifications,
            'unread_count' => $request->user()->unreadNotifications()->count(),
        ], 'Notifications retrieved successfully.');
    }

    /**
     * Mark a specific notification as read.
     */
    public function markRead(Request $request, string $id)
    {
        $notification = $request->user()->notifications()->findOrFail($id);
        $notification->markAsRead();

        return $this->success(null, 'Notification marked as read.');
    }

    /**
     * Mark all notifications as read for the authenticated user.
     */
    public function markAllRead(Request $request)
    {
        $request->user()->unreadNotifications->markAsRead();

        return $this->success(null, 'All notifications marked as read.');
    }
}