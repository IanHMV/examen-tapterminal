<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
use MongoDB\Laravel\Schema\Blueprint;

/**
 * Colección "products". La migración solo crea la colección y sus índices.
 */
return new class () extends Migration {
    public function up(): void
    {
        Schema::create('products', function (Blueprint $collection) {
            // El código es la clave de negocio: único (red de seguridad del contador atómico).
            $collection->unique('code');

            // La tabla se ordena por fecha de creación (más recientes primero).
            $collection->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::drop('products');
    }
};
