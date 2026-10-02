<?php

namespace Tests\Concerns;

use Illuminate\Support\Facades\DB;

/**
 * Deja vacía la base de pruebas antes de cada prueba.
 *
 * RefreshDatabase de Laravel deshace cada prueba con una transacción, y MongoDB sin
 * réplicas no tiene transacciones. Aquí la primera prueba de cada clase migra desde
 * cero (colecciones e índices) y las demás solo borran los documentos, que es más rápido.
 */
trait RefreshMongoDatabase
{
    private static bool $migrated = false;

    /** Laravel lo ejecuta antes de cada prueba de la clase que use este trait. */
    protected function setUpRefreshMongoDatabase(): void
    {
        $database = DB::connection('mongodb')->getDatabase();

        // Red de seguridad: nunca vaciar una base que no sea de pruebas (por ejemplo, la de desarrollo).
        if (! str_ends_with($database->getDatabaseName(), '_test')) {
            $this->fail('Las pruebas solo corren en una base que termine en "_test" (ver phpunit.xml).');
        }

        if (! self::$migrated) {
            $this->artisan('migrate:fresh');
            self::$migrated = true;

            return;
        }

        foreach ($database->listCollectionNames() as $collection) {
            if ($collection !== 'migrations') {
                $database->selectCollection($collection)->deleteMany([]);
            }
        }
    }
}
