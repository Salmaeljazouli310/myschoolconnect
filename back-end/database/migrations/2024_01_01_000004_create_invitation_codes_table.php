<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('invitation_codes', function (Blueprint $table) {
            $table->id();
            $table->string('code', 32)->unique();
            $table->foreignId('role_id')->constrained('roles')->restrictOnDelete();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('used_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('class_id')->nullable()->constrained('classes')->nullOnDelete();
            $table->timestamp('used_at')->nullable();
            $table->dateTime('expires_at');  // ← CHANGÉ ICI
            $table->boolean('is_used')->default(false);
            $table->timestamps();

            $table->index('role_id');
            $table->index('is_used');
            $table->index('expires_at');
        });
    }

    public function down(): void 
    { 
        Schema::dropIfExists('invitation_codes'); 
    }
};