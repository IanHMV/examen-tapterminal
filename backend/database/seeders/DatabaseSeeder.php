<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Datos iniciales del sistema.
     *
     * NO usar el trait WithoutModelEvents aquí. Los códigos
     * autogenerados (PRD-0001) se asignan en el evento "creating" del modelo.
     */
    public function run(): void
    {
        $this->call([
            ProductSeeder::class,
            ProfileSeeder::class,
        ]);
    }
}
