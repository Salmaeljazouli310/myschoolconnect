<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('student_bus_assignments', function (Blueprint $table) {
            // Make stop_id nullable
            $table->foreignId('stop_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('student_bus_assignments', function (Blueprint $table) {
            $table->foreignId('stop_id')->nullable(false)->change();
        });
    }
};