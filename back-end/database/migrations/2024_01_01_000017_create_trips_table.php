<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('trips', function (Blueprint $table) {
            $table->id();
            $table->foreignId('route_id')->constrained('bus_routes')->restrictOnDelete();
            $table->foreignId('driver_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('bus_id')->constrained('buses')->restrictOnDelete();
            $table->enum('type', ['morning', 'afternoon']);
            $table->enum('status', ['scheduled', 'in_progress', 'completed', 'cancelled'])
                  ->default('scheduled');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('route_id');
            $table->index('driver_id');
            $table->index('status');
            $table->index('created_at');
        });
    }

    public function down(): void { Schema::dropIfExists('trips'); }
};

// -----------------------------------------------------------
// 2024_01_01_000018_create_notifications_table.php
// -----------------------------------------------------------
