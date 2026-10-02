<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
use MongoDB\Laravel\Schema\Blueprint;

/**
 * Colección "personal_access_tokens": tokens de sesión de Sanctum.
 * Reemplaza la migración SQL que publica Sanctum.
 */
return new class () extends Migration {
    public function up(): void
    {
        Schema::create('personal_access_tokens', function (Blueprint $collection) {
            // Se guarda el hash SHA-256 del token, nunca el token en claro.
            $collection->unique('token');

            // Los tokens de un usuario (por ejemplo, para cerrar todas sus sesiones).
            $collection->index(['tokenable_type', 'tokenable_id']);

            // Índice TTL: MongoDB borra solo los tokens vencidos (revisa cada minuto),
            // sin tareas programadas. expireAfterSeconds 0 = borrar al llegar a expires_at.
            $collection->index('expires_at', options: ['expireAfterSeconds' => 0]);
        });
    }

    public function down(): void
    {
        Schema::drop('personal_access_tokens');
    }
};
