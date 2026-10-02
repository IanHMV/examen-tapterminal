<?php

namespace Tests\Unit;

use App\Models\User;
use App\Notifications\ResetPasswordNotification;
use App\Notifications\WelcomeNotification;
use Tests\TestCase;

/**
 * Enlace de los correos de recuperación y bienvenida (sin base de datos).
 */
class PasswordLinkTest extends TestCase
{
    public function test_el_token_va_despues_de_almohadilla_y_el_correo_codificado(): void
    {
        config(['app.frontend_url' => 'https://ianmartinez.dev/examen-tapterminal/']);
        $user = new User(['name' => 'Ana López', 'email' => 'ana+pruebas@example.com']);

        $mail = (new ResetPasswordNotification('3f9a0c'))->toMail($user);

        // El fragmento (#) nunca llega al servidor: el token no queda en los registros de Nginx.
        $this->assertSame(
            'https://ianmartinez.dev/examen-tapterminal/restablecer-contrasena?email=ana%2Bpruebas%40example.com#3f9a0c',
            $mail->actionUrl,
        );
        $this->assertSame('Restablece tu contraseña', $mail->subject);
        $this->assertStringContainsString('vence en 60 minutos', implode(' ', $mail->outroLines));
    }

    public function test_la_bienvenida_lleva_el_usuario_y_el_mismo_tipo_de_enlace(): void
    {
        config(['app.frontend_url' => 'http://localhost:4200']);
        $user = new User(['name' => 'Ana López', 'email' => 'ana@example.com']);

        $mail = (new WelcomeNotification('abc123'))->toMail($user);

        $this->assertSame('http://localhost:4200/restablecer-contrasena?email=ana%40example.com#abc123', $mail->actionUrl);
        $this->assertStringContainsString('ana@example.com', implode(' ', $mail->introLines));
    }
}
