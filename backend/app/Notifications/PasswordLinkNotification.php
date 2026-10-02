<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Arr;

/**
 * Correo con un enlace de un solo uso para elegir contraseña. El enlace abre la
 * pantalla de Angular, no la API.
 */
abstract class PasswordLinkNotification extends Notification
{
    public function __construct(#[\SensitiveParameter] private readonly string $token)
    {
    }

    /** @return list<string> */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * El token va después de "#" (fragmento): el navegador nunca lo envía al servidor,
     * así no queda en los registros de Nginx ni de Cloudflare.
     */
    protected function resetUrl(User $user): string
    {
        return rtrim(config('app.frontend_url'), '/')
            . '/restablecer-contrasena?' . Arr::query(['email' => $user->email])
            . '#' . $this->token;
    }

    /** Minutos que dura el enlace (config/auth.php). */
    protected function expiresInMinutes(): int
    {
        return (int) config('auth.passwords.users.expire');
    }
}
