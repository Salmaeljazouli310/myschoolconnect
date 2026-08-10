<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_task_points', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->foreignId('task_id')->constrained('tasks')->onDelete('cascade');
            $table->foreignId('teacher_id')->constrained('users')->onDelete('cascade');
            $table->integer('points')->default(0);
            $table->text('comment')->nullable();
            $table->date('date');
            $table->timestamps();
            
            $table->unique(['student_id', 'task_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_task_points');
    }
};