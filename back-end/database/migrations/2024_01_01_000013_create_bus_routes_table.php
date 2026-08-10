<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('bus_routes', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->text('description')->nullable();
            $table->foreignId('bus_id')->nullable()->constrained('buses')->nullOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('bus_id');
        });
    }

    public function down(): void { Schema::dropIfExists('bus_routes'); }
};
