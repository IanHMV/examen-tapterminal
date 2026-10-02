<?php

namespace Tests;

use App\Enums\Section;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;

abstract class TestCase extends BaseTestCase
{
    /** Contraseña de los usuarios que crean las pruebas. */
    protected const PASSWORD = 'Clave-Prueba-2026';

    /**
     * Usuario con un perfil que da acceso a esas secciones (sin secciones, no entra a ninguna).
     *
     * @param  list<Section>  $sections
     * @param  array<string, mixed>  $attributes
     */
    protected function createUser(array $sections = [], array $attributes = []): User
    {
        $profile = Profile::create([
            'name' => 'Perfil ' . Str::random(8),
            'sections' => array_map(fn (Section $section) => $section->value, $sections),
        ]);

        return User::factory()->create([
            'password' => self::PASSWORD,
            'profile_codes' => [$profile->code],
            ...$attributes,
        ]);
    }

    /** Inicia sesión (Sanctum) con un usuario nuevo que tiene esas secciones. */
    protected function actingAsUserWith(Section ...$sections): User
    {
        $user = $this->createUser($sections);
        Sanctum::actingAs($user);

        return $user;
    }
}
