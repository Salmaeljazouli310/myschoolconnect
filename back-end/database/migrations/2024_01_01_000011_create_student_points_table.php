<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('student_points', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('awarded_by')->constrained('users')->restrictOnDelete();
            $table->smallInteger('points');
            $table->string('reason', 255);
            $table->string('category', 50)->default('general');
            $table->timestamps();

            $table->index('student_id');
            $table->index('awarded_by');
            $table->index('category');
        });
    }

    public function down(): void { Schema::dropIfExists('student_points'); }
};
