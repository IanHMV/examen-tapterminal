<?php

namespace App\Exports;

use App\Enums\Section;
use App\Models\Profile;

/**
 * Listado de perfiles completo, con el nombre de sus secciones.
 */
class ProfilesExport implements TableExport
{
    public function title(): string
    {
        return 'Perfiles';
    }

    public function headings(): array
    {
        return ['Código', 'Nombre', 'Secciones', 'Fecha de creación'];
    }

    public function rows(): iterable
    {
        foreach (Profile::query()->latest()->cursor() as $profile) {
            $sections = array_map(fn (Section $section) => $section->label(), $profile->sectionList());

            yield [$profile->code, $profile->name, implode(', ', $sections), $profile->created_at];
        }
    }
}
