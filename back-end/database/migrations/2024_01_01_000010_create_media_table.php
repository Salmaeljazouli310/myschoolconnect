<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('media', function (Blueprint $table) {
            $table->id();
            $table->morphs('mediable'); // mediable_id + mediable_type + index
            $table->string('disk', 30)->default('local');
            $table->string('path', 500);
            $table->string('filename', 255);
            $table->string('mime_type', 100);
            $table->unsignedBigInteger('size')->default(0);
            $table->string('collection', 50)->default('default');
            $table->timestamps();

            $table->index('collection');
        });
    }

    public function down(): void { Schema::dropIfExists('media'); }
};