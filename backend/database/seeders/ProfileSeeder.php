<?php

namespace Database\Seeders;

use App\Enums\Section;
use App\Models\Profile;
use Illuminate\Database\Seeder;

/**
 * Perfiles iniciales. Es idempotente: solo crea los que no existen (por nombre),
 * así que se puede ejecutar en producción todas las veces que haga falta.
 */
class ProfileSeeder extends Seeder
{
    public function run(): void
    {
        $profiles = [
            'Administrador' => Section::cases(),
            'Capturista de productos' => [Section::Products],
        ];

        foreach ($profiles as $name => $sections) {
            Profile::firstOrCreate(
                ['name' => $name],
                ['sections' => array_map(fn (Section $section) => $section->value, $sections)],
            );
        }
    }
}
