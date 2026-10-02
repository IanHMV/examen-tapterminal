<?php

namespace App\Models;

use App\Models\Concerns\HasSequentialCode;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Notifications\Notifiable;
use MongoDB\Laravel\Auth\User as Authenticatable;

/**
 * Usuario del sistema (colección "users" en MongoDB).
 *
 * Los perfiles se referencian por su código (inmutable y único), no se copian:
 * si un perfil cambia de nombre o de secciones, el usuario lo ve al instante.
 *
 * @property string $code           Código autogenerado (USR-0001).
 * @property string $name
 * @property string $email          Usuario para iniciar sesión: único y en minúsculas.
 * @property string|null $phone     Formato internacional E.164 (+523141234567).
 * @property string $photo_id       Id de la foto en GridFS (bucket "photos").
 * @property list<string> $profile_codes
 * @property \Illuminate\Support\Carbon $created_at
 */
class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory;
    use HasSequentialCode;
    use Notifiable;

    protected $table = 'users';

    /** "code", "password" y "photo_id" NO están aquí: los asigna el sistema. */
    protected $fillable = ['name', 'email', 'phone', 'profile_codes'];

    /** Nunca salen en JSON, aunque alguien serialice el modelo completo. */
    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            // Se guarda cifrada con bcrypt al asignarla: $user->password = '...'.
            'password' => 'hashed',
        ];
    }

    /** Las rutas buscan al usuario por su código (/users/USR-0001). */
    public function getRouteKeyName(): string
    {
        return 'code';
    }

    /**
     * Perfiles asignados, ordenados por nombre.
     *
     * @return Collection<int, Profile>
     */
    public function assignedProfiles(): Collection
    {
        return Profile::query()
            ->whereIn('code', $this->profile_codes ?? [])
            ->orderBy('name')
            ->get();
    }

    /** Prefijo del código autogenerado: USR-0001. */
    protected static function codePrefix(): string
    {
        return 'USR';
    }

    /** Contador que usa este modelo en la colección "counters". */
    protected static function codeSequence(): string
    {
        return 'users';
    }
}
