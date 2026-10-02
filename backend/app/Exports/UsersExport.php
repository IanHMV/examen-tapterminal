<?php

namespace App\Exports;

use App\Models\Profile;
use App\Models\User;

/**
 * Listado de usuarios completo, con el nombre de sus perfiles. La foto no se exporta.
 */
class UsersExport implements TableExport
{
    public function title(): string
    {
        return 'Usuarios';
    }

    public function headings(): array
    {
        return ['Código', 'Nombre', 'Usuario (correo)', 'Teléfono', 'Perfiles', 'Fecha de creación'];
    }

    public function rows(): iterable
    {
        // Los nombres de los perfiles se leen una sola vez, no una consulta por usuario.
        $profileNames = Profile::query()->pluck('name', 'code');

        foreach (User::query()->latest()->cursor() as $user) {
            $profiles = collect($user->profile_codes ?? [])
                ->map(fn (string $code) => $profileNames[$code] ?? $code)
                ->implode(', ');

            yield [$user->code, $user->name, $user->email, $user->phone, $profiles, $user->created_at];
        }
    }
}
