<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;
use MongoDB\Operation\FindOneAndUpdate;

/**
 * Genera números consecutivos de forma Atomica con la colección "counters".
 *
 * MongoDB incrementa el contador en una sola operación ($inc), así que dos
 * peticiones simultáneas nunca reciben el mismo número. "Contar documentos
 * y sumar 1" sí puede repetir números cuando llegan dos peticiones a la vez.
 */
class SequenceGenerator
{
    public function next(string $sequence): int
    {
        $counter = DB::connection('mongodb')
            ->getCollection('counters')
            ->findOneAndUpdate(
                ['_id' => $sequence],
                ['$inc' => ['value' => 1]],
                [
                    // Si el contador no existe todavía, lo crea empezando en 1.
                    'upsert' => true,
                    'returnDocument' => FindOneAndUpdate::RETURN_DOCUMENT_AFTER,
                ],
            );

        return (int) $counter['value'];
    }
}
