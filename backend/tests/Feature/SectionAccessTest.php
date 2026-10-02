<?php

namespace Tests\Feature;

use App\Enums\Section;
use Tests\Concerns\RefreshMongoDatabase;
use Tests\TestCase;

/**
 * Cada usuario solo entra a las secciones de sus perfiles (requisito del examen).
 */
class SectionAccessTest extends TestCase
{
    use RefreshMongoDatabase;

    public function test_sin_la_seccion_la_api_responde_403(): void
    {
        $this->actingAsUserWith(Section::Products);

        $this->getJson('/api/v1/products')->assertOk();
        $this->getJson('/api/v1/users')
            ->assertForbidden()
            ->assertExactJson(['message' => 'No tienes acceso a esta sección.']);
        $this->getJson('/api/v1/profiles')->assertForbidden();
        $this->getJson('/api/v1/audit-logs')->assertForbidden();
    }

    public function test_las_secciones_de_varios_perfiles_se_suman(): void
    {
        $user = $this->createUser([Section::Products]);
        $other = $this->createUser([Section::Users]);
        $user->update(['profile_codes' => [...$user->profile_codes, ...$other->profile_codes]]);
        $this->actingAs($user, 'sanctum');

        $this->getJson('/api/v1/products')->assertOk();
        $this->getJson('/api/v1/users')->assertOk();
        $this->getJson('/api/v1/profiles')->assertForbidden();
    }

    public function test_las_opciones_de_perfiles_aceptan_la_seccion_usuarios_o_perfiles(): void
    {
        // El formulario de usuarios necesita la lista de perfiles.
        $this->actingAsUserWith(Section::Users);
        $this->getJson('/api/v1/profiles/options')->assertOk();

        $this->actingAsUserWith(Section::Profiles);
        $this->getJson('/api/v1/profiles/options')->assertOk();

        $this->actingAsUserWith(Section::Products);
        $this->getJson('/api/v1/profiles/options')->assertForbidden();
    }
}
