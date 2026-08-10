<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->string('title', 200);
            $table->longText('body');
            $table->foreignId('author_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('class_id')->nullable()->constrained('classes')->nullOnDelete();
            $table->enum('status', ['draft', 'pending', 'approved', 'rejected'])->default('draft');
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('author_id');
            $table->index('class_id');
            $table->index('status');
            $table->index('published_at');
        });
    }

    public function down(): void { Schema::dropIfExists('posts'); }
};

