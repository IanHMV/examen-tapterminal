<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * Bienvenida a un usuario nuevo: su usuario y el enlace para elegir su contraseña.
 */
class WelcomeNotification extends PasswordLinkNotification
{
    public function toMail(User $notifiable): MailMessage
    {
        return (new MailMessage())
            ->subject('Tu cuenta en ' . config('app.name'))
            ->greeting("Hola, {$notifiable->name}")
            ->line('Se creó tu cuenta. Tu usuario para iniciar sesión es tu correo: ' . $notifiable->email)
            ->action('Elegir mi contraseña', $this->resetUrl($notifiable))
            ->line("El enlace vence en {$this->expiresInMinutes()} minutos y solo funciona una vez. "
                . 'Si vence, pide otro en «¿Olvidaste tu contraseña?», en la pantalla de inicio de sesión.');
    }
}
