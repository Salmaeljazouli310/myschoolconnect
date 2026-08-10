<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->string('first_name', 80);
            $table->string('last_name', 80);
            $table->date('date_of_birth')->nullable();
            $table->enum('gender', ['male', 'female', 'other'])->nullable();
            $table->string('student_code', 30)->unique();
            $table->foreignId('class_id')->constrained('classes')->restrictOnDelete();
            $table->string('avatar', 255)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('class_id');
            $table->index('is_active');
        });
    }

    public function down(): void 
    { 
        Schema::dropIfExists('students'); 
    }
};