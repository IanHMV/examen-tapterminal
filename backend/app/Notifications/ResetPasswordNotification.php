<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * Recuperación de contraseña: lo envía POST /api/v1/auth/forgot-password.
 */
class ResetPasswordNotification extends PasswordLinkNotification
{
    public function toMail(User $notifiable): MailMessage
    {
        return (new MailMessage())
            ->subject('Restablece tu contraseña')
            ->greeting("Hola, {$notifiable->name}")
            ->line('Recibimos una solicitud para restablecer la contraseña de tu cuenta.')
            ->action('Elegir una contraseña nueva', $this->resetUrl($notifiable))
            ->line("El enlace vence en {$this->expiresInMinutes()} minutos y solo funciona una vez.")
            ->line('Si no lo pediste, ignora este correo: tu contraseña no cambiará.');
    }
}
