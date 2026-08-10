<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_bus_assignments', function (Blueprint $table) {
            $table->id();
            
            // Étudiant assigné
            $table->foreignId('student_id')
                  ->constrained('students')
                  ->onDelete('cascade');
            
            // Bus assigné
            $table->foreignId('bus_id')
                  ->nullable()
                  ->constrained('buses')
                  ->onDelete('cascade');
            
            // Route assignée
            $table->foreignId('route_id')
                  ->nullable()
                  ->constrained('bus_routes')
                  ->onDelete('cascade');
            
            // Arrêt assigné
            $table->foreignId('stop_id')
                  ->nullable()
                  ->constrained('bus_stops')
                  ->onDelete('cascade');
            
            // Statut
            $table->boolean('is_active')->default(true);
            
            $table->timestamps();

            // Index
            $table->index('student_id');
            $table->index('bus_id');
            $table->index('route_id');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_bus_assignments');
    }
};