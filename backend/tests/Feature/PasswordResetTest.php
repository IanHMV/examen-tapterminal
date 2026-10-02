<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Tests\Concerns\RefreshMongoDatabase;
use Tests\TestCase;

/**
 * Recuperación de contraseña con enlace de un solo uso.
 */
class PasswordResetTest extends TestCase
{
    use RefreshMongoDatabase;

    private const NEW_PASSWORD = 'Nueva-Clave-2026';

    public function test_un_correo_no_registrado_no_recibe_enlace(): void
    {
        Notification::fake();

        $this->postJson('/api/v1/auth/forgot-password', ['email' => 'nadie@example.com'])
            ->assertStatus(422)
            ->assertJsonPath('errors.email.0', 'Usuario no encontrado, no es posible enviar el correo.');

        Notification::assertNothingSent();
    }

    public function test_envia_un_solo_enlace_por_minuto_a_cada_correo(): void
    {
        Notification::fake();
        $user = $this->createUser();

        $this->postJson('/api/v1/auth/forgot-password', ['email' => strtoupper($user->email)])->assertOk();
        $this->postJson('/api/v1/auth/forgot-password', ['email' => $user->email])
            ->assertStatus(429)
            ->assertJsonPath('message', fn (string $message) => str_starts_with($message, 'Ya te enviamos un enlace'));

        Notification::assertSentToTimes($user, ResetPasswordNotification::class, 1);
    }

    public function test_el_enlace_cambia_la_contrasena_cierra_las_sesiones_y_solo_sirve_una_vez(): void
    {
        $user = $this->createUser();
        $user->createToken('sesion-anterior');
        $token = Password::createToken($user);
        $data = ['email' => $user->email, 'token' => $token, 'password' => self::NEW_PASSWORD, 'password_confirmation' => self::NEW_PASSWORD];

        $this->postJson('/api/v1/auth/reset-password', $data)->assertOk();

        $this->assertSame(0, $user->tokens()->count());
        $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => self::PASSWORD])->assertStatus(422);
        $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => self::NEW_PASSWORD])->assertOk();

        $this->postJson('/api/v1/auth/reset-password', $data)
            ->assertStatus(422)
            ->assertJsonPath('errors.token.0', 'El enlace no es válido o ya venció. Pide uno nuevo.');

        // La bitácora anota que cambió la contraseña y que lo hizo el propio usuario.
        $log = AuditLog::where('entity_code', $user->code)->latest()->firstOrFail();
        $this->assertSame(['password'], $log->changed_fields);
        $this->assertSame($user->code, $log->user['code']);
    }

    public function test_un_token_falso_o_vencido_no_sirve(): void
    {
        $user = $this->createUser();
        $token = Password::createToken($user);

        $this->postJson('/api/v1/auth/reset-password', ['email' => $user->email, 'token' => 'falso', 'password' => self::NEW_PASSWORD, 'password_confirmation' => self::NEW_PASSWORD])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['token']);

        $this->travel(61)->minutes();

        $this->postJson('/api/v1/auth/reset-password', ['email' => $user->email, 'token' => $token, 'password' => self::NEW_PASSWORD, 'password_confirmation' => self::NEW_PASSWORD])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['token']);
    }

    public function test_la_contrasena_nueva_debe_tener_8_caracteres_letra_y_numero(): void
    {
        $user = $this->createUser();

        $this->postJson('/api/v1/auth/reset-password', ['email' => $user->email, 'token' => 'x', 'password' => 'abcdefgh', 'password_confirmation' => 'otra'])
            ->assertStatus(422)
            ->assertJsonPath('errors.password', [
                'La confirmación de contraseña no coincide.',
                'El campo contraseña debe contener al menos un número.',
            ]);
    }
}
