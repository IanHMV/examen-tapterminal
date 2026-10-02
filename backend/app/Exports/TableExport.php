<?php

namespace App\Exports;

use DateTimeInterface;

/**
 * Un listado listo para exportar a Excel o PDF (App\Support\TableExporter).
 * Cada listado del sistema tiene su clase: qué columnas lleva y de dónde salen las filas.
 */
interface TableExport
{
    /** Título del documento y nombre de la hoja de Excel, por ejemplo "Productos". */
    public function title(): string;

    /**
     * Encabezados de las columnas.
     *
     * @return list<string>
     */
    public function headings(): array;

    /**
     * Una fila por registro, con los valores en el orden de los encabezados.
     * Las fechas van como fecha (no como texto): el exportador les da el formato
     * DD/MM/YYYY HH:MM en la zona horaria de quien descarga.
     *
     * @return iterable<list<string|float|DateTimeInterface|null>>
     */
    public function rows(): iterable;
}
