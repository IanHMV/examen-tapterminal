<?php

namespace Tests\Feature;

use App\Enums\Section;
use App\Models\User;
use App\Notifications\WelcomeNotification;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Testing\TestResponse;
use Tests\Concerns\RefreshMongoDatabase;
use Tests\TestCase;

/**
 * Usuarios: alta con foto en GridFS, correo de bienvenida y reglas de borrado.
 */
class UserTest extends TestCase
{
    use RefreshMongoDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = $this->actingAsUserWith(Section::Users);
    }

    /** Alta por la API con una foto PNG real (la imagen del administrador inicial). */
    private function createViaApi(array $data = []): TestResponse
    {
        $photo = new UploadedFile(base_path('database/seeders/assets/default-avatar.png'), 'ana.png', 'image/png', null, true);

        return $this->post('/api/v1/users', [
            'name' => 'Ana López',
            'email' => 'Ana.Lopez@Example.com',
            'phone' => '+52 (314) 123-4567',
            'profile_codes' => [strtolower($this->admin->profile_codes[0])],
            'photo' => $photo,
            ...$data,
        ], ['Accept' => 'application/json']);
    }

    public function test_el_alta_normaliza_los_datos_y_envia_el_enlace_de_bienvenida(): void
    {
        Notification::fake();

        $this->createViaApi()
            ->assertCreated()
            ->assertJsonPath('data.email', 'ana.lopez@example.com')
            ->assertJsonPath('data.phone', '+523141234567')
            ->assertJsonPath('data.profiles.0.code', $this->admin->profile_codes[0])
            ->assertJsonMissingPath('data.password');

        $user = User::where('email', 'ana.lopez@example.com')->firstOrFail();
        Notification::assertSentTo($user, WelcomeNotification::class);
        $this->assertSame(1, DB::table('password_reset_tokens')->where('email', $user->email)->count());
    }

    public function test_el_correo_es_unico_sin_distinguir_mayusculas(): void
    {
        $this->createViaApi()->assertCreated();

        $this->createViaApi(['email' => 'ANA.LOPEZ@example.com'])
            ->assertStatus(422)
            ->assertJsonPath('errors.email.0', 'El campo correo ya ha sido registrado.');
    }

    public function test_la_foto_se_sirve_con_una_url_firmada(): void
    {
        $photoUrl = $this->createViaApi()->json('data.photo_url');

        $this->get($photoUrl)->assertOk()->assertHeader('Content-Type', 'image/png');

        // Sin la firma o con la URL alterada: 403.
        $this->get(preg_replace('/signature=\w+/', 'signature=alterada', $photoUrl))
            ->assertForbidden()
            ->assertExactJson(['message' => 'El enlace no es válido o ya venció.']);
    }

    public function test_nadie_puede_eliminarse_a_si_mismo(): void
    {
        $this->deleteJson("/api/v1/users/{$this->admin->code}")
            ->assertConflict()
            ->assertExactJson(['message' => 'No puedes eliminar tu propio usuario.']);

        $other = $this->createUser();
        $this->deleteJson("/api/v1/users/{$other->code}")->assertNoContent();
    }
}
