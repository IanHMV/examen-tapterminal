<?php

namespace Tests\Feature;

use App\Enums\Section;
use App\Models\Profile;
use Illuminate\Support\Facades\Route;
use Tests\Concerns\RefreshMongoDatabase;
use Tests\TestCase;

/**
 * Perfiles y sus secciones.
 */
class ProfileTest extends TestCase
{
    use RefreshMongoDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAsUserWith(Section::Profiles);
    }

    public function test_crea_un_perfil_con_sus_secciones(): void
    {
        $this->postJson('/api/v1/profiles', ['name' => 'Supervisor', 'sections' => ['products', 'audit_log']])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Supervisor')
            ->assertJsonPath('data.sections', [
                ['key' => 'products', 'name' => 'Productos'],
                ['key' => 'audit_log', 'name' => 'Bitácora'],
            ]);

        $this->postJson('/api/v1/profiles', ['name' => 'Otro', 'sections' => ['inventada']])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['sections.0']);
    }

    public function test_el_nombre_es_unico_sin_distinguir_mayusculas(): void
    {
        $this->postJson('/api/v1/profiles', ['name' => 'Supervisor', 'sections' => ['products']])->assertCreated();

        $this->postJson('/api/v1/profiles', ['name' => 'SUPERVISOR', 'sections' => ['products']])
            ->assertStatus(422)
            ->assertJsonPath('errors.name.0', 'El campo nombre ya ha sido registrado.');
    }

    public function test_no_se_puede_eliminar_un_perfil_asignado_a_un_usuario(): void
    {
        $user = $this->createUser([Section::Products]);

        $this->deleteJson("/api/v1/profiles/{$user->profile_codes[0]}")
            ->assertConflict()
            ->assertJsonPath('message', 'No se puede eliminar: el perfil está asignado a 1 usuario(s).');
    }

    public function test_una_clave_duplicada_en_mongodb_responde_409_y_no_500(): void
    {
        // Simula dos altas simultáneas que pasaron la validación: el índice único rechaza la segunda.
        Route::post('/api/prueba-duplicado', function () {
            Profile::create(['name' => 'Duplicado', 'sections' => ['products']]);
            Profile::create(['name' => 'DUPLICADO', 'sections' => ['products']]);
        });

        $this->postJson('/api/prueba-duplicado')
            ->assertConflict()
            ->assertExactJson(['message' => 'El registro ya existe.']);
    }
}
