<?php

namespace App\Models;

use App\Enums\Section;
use App\Models\Concerns\Auditable;
use App\Models\Concerns\HasSequentialCode;
use MongoDB\Laravel\Eloquent\Model;

/**
 * Perfil de usuario (colección "profiles" en MongoDB).
 *
 * Las secciones se guardan dentro del mismo documento (arreglo de claves):
 * son pocas, siempre se leen junto con el perfil y no existen por sí solas.
 *
 * @property string $code   Código autogenerado (PRF-0001). Nunca lo envía el cliente.
 * @property string $name   Nombre único, sin distinguir mayúsculas.
 * @property list<string> $sections  Claves de App\Enums\Section.
 * @property \Illuminate\Support\Carbon $created_at
 */
class Profile extends Model
{
    use Auditable;
    use HasSequentialCode;

    protected $table = 'profiles';

    /** "code" NO está aquí: lo genera el sistema. */
    protected $fillable = ['name', 'sections'];

    /** Las rutas buscan el perfil por su código (/profiles/PRF-0001). */
    public function getRouteKeyName(): string
    {
        return 'code';
    }

    /**
     * Secciones del perfil en el orden del catálogo. Ignora claves que ya no existan.
     *
     * @return list<Section>
     */
    public function sectionList(): array
    {
        $keys = $this->sections ?? [];

        return array_values(array_filter(
            Section::cases(),
            fn (Section $section) => in_array($section->value, $keys, true),
        ));
    }

    /** Campos que guarda la bitácora en cada cambio. */
    protected function auditedAttributes(): array
    {
        return ['name', 'sections'];
    }

    /** Prefijo del código autogenerado: PRF-0001. */
    protected static function codePrefix(): string
    {
        return 'PRF';
    }

    /** Contador que usa este modelo en la colección "counters". */
    protected static function codeSequence(): string
    {
        return 'profiles';
    }
}
