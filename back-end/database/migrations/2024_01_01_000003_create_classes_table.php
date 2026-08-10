<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void
    {
        Schema::create('classes', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('grade', 20);
            $table->string('section', 10)->nullable();
            $table->foreignId('teacher_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('academic_year', 10);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('teacher_id');
            $table->index(['academic_year', 'is_active']);
        });
    }

    public function down(): void { Schema::dropIfExists('classes'); }
};

