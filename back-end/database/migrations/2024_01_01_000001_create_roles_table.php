<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name', 50);
            $table->string('guard_name', 50)->default('api');
            $table->timestamps();
            $table->unique(['name', 'guard_name']);
        });

        // Seed default roles immediately
        DB::table('roles')->insert([
            ['name' => 'admin',   'guard_name' => 'api', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'teacher', 'guard_name' => 'api', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'parent',  'guard_name' => 'api', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'driver',  'guard_name' => 'api', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void { Schema::dropIfExists('roles'); }
};
