<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'assigned_class_id')) {
                $table->foreignId('assigned_class_id')->nullable()->after('role_id')->constrained('classes')->onDelete('set null');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['assigned_class_id']);
            $table->dropColumn('assigned_class_id');
        });
    }
};
