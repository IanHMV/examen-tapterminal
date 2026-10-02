<?php

namespace App\Enums;

use OpenApi\Attributes as OA;

/**
 * Secciones (pantallas) del sistema a las que un perfil puede dar acceso.
 *
 * Es un catálogo fijo en el código y no una colección editable: cada sección
 * corresponde a pantallas y rutas que existen en la aplicación. Los perfiles
 * guardan solo las claves, por ejemplo ["products", "users"].
 */
#[OA\Schema(schema: 'SectionKey', type: 'string', description: 'Clave de una sección del sistema.')]
enum Section: string
{
    case Products = 'products';
    case Users = 'users';
    case Profiles = 'profiles';
    case AuditLog = 'audit_log';

    /** Nombre que se muestra en la interfaz. */
    public function label(): string
    {
        return match ($this) {
            self::Products => 'Productos',
            self::Users => 'Usuarios',
            self::Profiles => 'Perfiles',
            self::AuditLog => 'Bitácora',
        };
    }

    /**
     * Clave y nombre, para enviarlo a la interfaz.
     *
     * @return array{key: string, name: string}
     */
    public function toArray(): array
    {
        return ['key' => $this->value, 'name' => $this->label()];
    }
}
