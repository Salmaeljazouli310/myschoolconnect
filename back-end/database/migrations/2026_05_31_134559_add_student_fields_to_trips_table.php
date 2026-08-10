<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('trips', function (Blueprint $table) {
            // Check if columns don't exist before adding
            if (!Schema::hasColumn('trips', 'student_id')) {
                $table->foreignId('student_id')
                    ->nullable()
                    ->after('id')
                    ->constrained('students')
                    ->onDelete('cascade');
            }
            
            if (!Schema::hasColumn('trips', 'date')) {
                $table->date('date')
                    ->nullable()
                    ->after('status');
            }
            
            // Add indexes for better query performance
            $table->index(['student_id', 'date'], 'trips_student_date_idx');
            $table->index('date', 'trips_date_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('trips', function (Blueprint $table) {
            // Drop indexes first
            $table->dropIndex('trips_student_date_idx');
            $table->dropIndex('trips_date_idx');
            
            // Drop foreign key constraint
            if (Schema::hasColumn('trips', 'student_id')) {
                $table->dropForeign(['student_id']);
                $table->dropColumn('student_id');
            }
            
            // Drop date column
            if (Schema::hasColumn('trips', 'date')) {
                $table->dropColumn('date');
            }
        });
    }
};
