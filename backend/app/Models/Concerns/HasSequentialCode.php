<?php

namespace App\Models\Concerns;

use App\Support\SequenceGenerator;
use Illuminate\Database\Eloquent\Model;

/**
 * Asigna al modelo un código legible y único al crearse (por ejemplo, PRD-0001).
 *
 * El modelo que use este trait debe implementar codePrefix() y codeSequence();
 * si los olvida, PHP lo indica en cuanto se carga la clase.
 *
 * @method static void creating(\Closure|string $callback) Evento de Eloquent
 */

trait HasSequentialCode
{
    /** Prefijo del código, por ejemplo "PRD". */
    abstract protected static function codePrefix(): string;

    /** Nombre del contador en la colección "counters", por ejemplo "products". */
    abstract protected static function codeSequence(): string;

    public static function bootHasSequentialCode(): void
    {
        static::creating(function (Model $model): void {
            $number = app(SequenceGenerator::class)->next(static::codeSequence());

            $model->setAttribute('code', sprintf('%s-%04d', static::codePrefix(), $number));
        });
    }
}
