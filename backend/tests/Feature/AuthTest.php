<?php

namespace Tests\Feature;

use App\Enums\Section;
use Tests\Concerns\RefreshMongoDatabase;
use Tests\TestCase;

/**
 * Inicio y cierre de sesión con tokens de Sanctum.
 */
class AuthTest extends TestCase
{
    use RefreshMongoDatabase;

    public function test_login_devuelve_un_token_bearer_y_las_secciones_del_usuario(): void
    {
        $user = $this->createUser([Section::Products]);

        $response = $this->postJson('/api/v1/auth/login', ['email' => strtoupper($user->email), 'password' => self::PASSWORD]);

        $response->assertOk()
            ->assertJsonPath('token_type', 'Bearer')
            ->assertJsonPath('user.code', $user->code)
            ->assertJsonPath('user.sections', [['key' => 'products', 'name' => 'Productos']])
            ->assertJsonMissingPath('user.password');

        // El token sirve para las rutas protegidas.
        $this->withToken($response->json('token'))->getJson('/api/v1/auth/me')->assertOk();
    }

    public function test_login_da_el_mismo_mensaje_con_correo_inexistente_o_contrasena_incorrecta(): void
    {
        $user = $this->createUser();
        $message = 'El correo o la contraseña no son correctos.';

        $this->postJson('/api/v1/auth/login', ['email' => 'nadie@example.com', 'password' => self::PASSWORD])
            ->assertStatus(422)
            ->assertJsonPath('errors.email.0', $message);

        $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'otra-clave'])
            ->assertStatus(422)
            ->assertJsonPath('errors.email.0', $message);
    }

    public function test_login_permite_cinco_intentos_por_minuto(): void
    {
        $credentials = ['email' => 'ataque@example.com', 'password' => 'adivinando'];

        for ($attempt = 1; $attempt <= 5; $attempt++) {
            $this->postJson('/api/v1/auth/login', $credentials)->assertStatus(422);
        }

        $this->postJson('/api/v1/auth/login', $credentials)
            ->assertStatus(429)
            ->assertHeader('Retry-After')
            ->assertJsonPath('message', fn (string $message) => str_starts_with($message, 'Demasiados intentos.'));
    }

    public function test_logout_revoca_el_token(): void
    {
        $user = $this->createUser();
        $token = $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => self::PASSWORD])->json('token');

        $this->withToken($token)->postJson('/api/v1/auth/logout')->assertNoContent();

        // Sanctum recuerda al usuario dentro de la misma prueba: se olvida para simular otra petición.
        $this->app['auth']->forgetGuards();
        $this->withToken($token)->getJson('/api/v1/auth/me')->assertUnauthorized();
    }

    public function test_sin_token_responde_401_en_json_aunque_la_peticion_no_pida_json(): void
    {
        // Regresión (PR #21): sin "Accept: application/json", Laravel buscaba la ruta "login" y respondía 500.
        $this->get('/api/v1/products')
            ->assertUnauthorized()
            ->assertExactJson(['message' => 'No has iniciado sesión o tu sesión venció.']);
    }
}
