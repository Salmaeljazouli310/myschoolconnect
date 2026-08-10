<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('bus_stops', function (Blueprint $table) {
            $table->id();
            $table->foreignId('route_id')->constrained('bus_routes')->cascadeOnDelete();
            $table->string('name', 100);
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->unsignedTinyInteger('order')->default(0);
            $table->timestamp('created_at')->useCurrent();

            $table->index('route_id');
        });
    }

    public function down(): void { Schema::dropIfExists('bus_stops'); }
};
