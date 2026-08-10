<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void
    {
        Schema::create('bus_drivers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bus_id')->constrained('buses')->cascadeOnDelete();
            $table->foreignId('driver_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('assigned_at')->useCurrent();
            $table->boolean('is_current')->default(true);
            $table->timestamp('created_at')->useCurrent();

            $table->index('bus_id');
            $table->index('driver_id');
            $table->index('is_current');
        });
    }

    public function down(): void { Schema::dropIfExists('bus_drivers'); }
};
