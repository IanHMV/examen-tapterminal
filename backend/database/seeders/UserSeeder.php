<?php

namespace Database\Seeders;

use App\Models\Profile;
use App\Models\User;
use App\Support\PhotoStorage;
use Illuminate\Database\Seeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;

/**
 * Usuario administrador inicial, con el perfil "Administrador" (ProfileSeeder)
 * y una foto genérica. Las credenciales vienen de config/admin.php (.env).
 *
 * Es idempotente: si el correo ya existe, no hace nada.
 */
class UserSeeder extends Seeder
{
    public function __construct(private readonly PhotoStorage $photos)
    {
    }

    public function run(): void
    {
        $admin = config('admin');

        if (blank($admin['email']) || blank($admin['password'])) {
            $this->command?->warn('UserSeeder: define ADMIN_EMAIL y ADMIN_PASSWORD en el .env para crear el administrador.');

            return;
        }

        $email = Str::lower($admin['email']);

        if (User::query()->where('email', $email)->exists()) {
            return;
        }

        $profile = Profile::query()->where('name', 'Administrador')->first();

        if ($profile === null) {
            $this->command?->warn('UserSeeder: falta el perfil "Administrador"; ejecuta antes ProfileSeeder.');

            return;
        }

        $user = new User([
            'name' => $admin['name'],
            'email' => $email,
            'profile_codes' => [$profile->code],
        ]);
        $user->password = $admin['password'];
        $user->photo_id = $this->photos->store(
            new UploadedFile(__DIR__ . '/assets/default-avatar.png', 'default-avatar.png', 'image/png', null, true),
        );
        $user->save();
    }
}
