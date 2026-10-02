<?php

namespace App\Models;

use App\Enums\Section;
use App\Models\Concerns\HasSequentialCode;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
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
    use HasApiTokens;
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

    /** Correo de recuperación en español y con el enlace a Angular (Laravel trae uno en inglés). */
    public function sendPasswordResetNotification(#[\SensitiveParameter] $token): void
    {
        $this->notify(new ResetPasswordNotification($token));
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

    /**
     * Secciones ya calculadas en esta petición: el middleware de permisos puede
     * preguntar varias veces y los perfiles solo se consultan una.
     *
     * @var list<Section>|null
     */
    private ?array $sectionsCache = null;

    /**
     * Secciones a las que el usuario tiene acceso: la suma de las de todos sus
     * perfiles, sin repetir y en el orden del catálogo.
     *
     * @return list<Section>
     */
    public function accessibleSections(): array
    {
        return $this->sectionsCache ??= $this->loadAccessibleSections();
    }

    public function hasSection(Section $section): bool
    {
        return in_array($section, $this->accessibleSections(), true);
    }

    /** @return list<Section> */
    private function loadAccessibleSections(): array
    {
        $keys = $this->assignedProfiles()
            ->flatMap(fn (Profile $profile) => $profile->sections ?? [])
            ->unique()
            ->all();

        return array_values(array_filter(
            Section::cases(),
            fn (Section $section) => in_array($section->value, $keys, true),
        ));
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
