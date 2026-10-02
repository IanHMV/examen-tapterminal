<?php

namespace App\Models;

use App\Models\Concerns\HasSequentialCode;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use MongoDB\Laravel\Eloquent\Model;

/**
 * Producto del catálogo (colección "products" en MongoDB).
 *
 * @property string $code   Código autogenerado (PRD-0001). Nunca lo envía el cliente.
 * @property string $name
 * @property string $brand
 * @property string $price  Precio exacto con 2 decimales (Decimal128 en MongoDB).
 * @property \Illuminate\Support\Carbon $created_at  Fecha de creación (automática).
 */
class Product extends Model
{
    use HasFactory;
    use HasSequentialCode;

    protected $table = 'products';

    /**
     * Campos que se pueden asignar desde una petición.
     * "code" NO está aquí: lo genera el sistema y nadie puede inventarlo.
     */
    protected $fillable = ['name', 'brand', 'price'];

    protected function casts(): array
    {
        return [
            // Decimal128: tipo exacto de MongoDB para dinero (sin errores de redondeo de float).
            'price' => 'decimal:2',
        ];
    }

    /** Prefijo del código autogenerado: PRD-0001. */
    protected static function codePrefix(): string
    {
        return 'PRD';
    }

    /** Contador que usa este modelo en la colección "counters". */
    protected static function codeSequence(): string
    {
        return 'products';
    }
}
