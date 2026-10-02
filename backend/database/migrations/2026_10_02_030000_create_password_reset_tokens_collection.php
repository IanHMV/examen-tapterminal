<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
use MongoDB\Laravel\Schema\Blueprint;

/**
 * Colección "password_reset_tokens": enlaces para elegir una contraseña nueva
 * (recuperación y bienvenida). La usa el broker de contraseñas de Laravel.
 */
return new class () extends Migration {
    public function up(): void
    {
        Schema::create('password_reset_tokens', function (Blueprint $collection) {
            // Un enlace vigente por correo: pedir otro reemplaza al anterior.
            $collection->unique('email');

            // Índice TTL: MongoDB borra solo los enlaces vencidos, sin tareas programadas.
            // Laravel ya rechaza un enlace vencido; esto solo evita que se acumulen.
            $collection->index('created_at', options: [
                'expireAfterSeconds' => config('auth.passwords.users.expire') * 60,
            ]);
        });
    }

    public function down(): void
    {
        Schema::drop('password_reset_tokens');
    }
};
