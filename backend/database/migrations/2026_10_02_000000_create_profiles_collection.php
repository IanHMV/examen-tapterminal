<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
use MongoDB\Laravel\Schema\Blueprint;

/**
 * Colección "profiles". La migración solo crea la colección y sus índices.
 */
return new class () extends Migration {
    public function up(): void
    {
        Schema::create('profiles', function (Blueprint $collection) {
            $collection->unique('code');

            // Nombre único sin distinguir mayúsculas ("Administrador" = "administrador"),
            // la misma regla que aplica la validación "unique" de laravel-mongodb.
            // strength 2 = compara letras y acentos, pero no mayúsculas.
            $collection->unique('name', options: ['collation' => ['locale' => 'es', 'strength' => 2]]);

            $collection->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::drop('profiles');
    }
};
