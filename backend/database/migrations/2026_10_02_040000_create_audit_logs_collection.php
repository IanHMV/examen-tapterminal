<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
use MongoDB\Laravel\Schema\Blueprint;

/**
 * Colección "audit_logs": bitácora de cambios (dato anterior y actual).
 */
return new class () extends Migration {
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $collection) {
            // Listado completo, del más reciente al más antiguo.
            $collection->index(['created_at' => -1]);

            // Filtro por entidad ("products") y por código ("PRD-0001"), ya ordenados por fecha.
            // El código lleva el prefijo de su entidad, así que solo él ya identifica al registro.
            $collection->index(['entity' => 1, 'created_at' => -1]);
            $collection->index(['entity_code' => 1, 'created_at' => -1]);
        });
    }

    public function down(): void
    {
        Schema::drop('audit_logs');
    }
};
