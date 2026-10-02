<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
use MongoDB\Laravel\Schema\Blueprint;

/**
 * Colección "users". La migración solo crea la colección y sus índices.
 */
return new class () extends Migration {
    public function up(): void
    {
        Schema::create('users', function (Blueprint $collection) {
            $collection->unique('code');

            // El correo es el usuario para iniciar sesión. Se guarda en minúsculas,
            // así que un índice único simple basta para que no se repita.
            $collection->unique('email');

            $collection->index('created_at');

            // Índice multikey (sobre un arreglo): encuentra rápido a los usuarios de un
            // perfil, por ejemplo para impedir que se borre un perfil que está en uso.
            $collection->index('profile_codes');
        });
    }

    public function down(): void
    {
        Schema::drop('users');
    }
};
