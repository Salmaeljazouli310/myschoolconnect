<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            // Add receiver_id if it doesn't exist
            if (!Schema::hasColumn('messages', 'receiver_id')) {
                $table->foreignId('receiver_id')->nullable()->after('sender_id')->constrained('users')->onDelete('cascade');
            }
            
            // Add read_at if it doesn't exist
            if (!Schema::hasColumn('messages', 'read_at')) {
                $table->timestamp('read_at')->nullable()->after('is_read');
            }
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropColumn(['receiver_id', 'read_at']);
        });
    }
};