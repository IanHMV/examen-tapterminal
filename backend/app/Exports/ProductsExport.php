<?php

namespace App\Exports;

use App\Models\Product;

/**
 * Listado de productos completo, del más reciente al más antiguo (como en pantalla).
 */
class ProductsExport implements TableExport
{
    public function title(): string
    {
        return 'Productos';
    }

    public function headings(): array
    {
        return ['Código', 'Nombre', 'Marca', 'Precio', 'Fecha de creación'];
    }

    public function rows(): iterable
    {
        // cursor() lee los documentos de uno en uno, sin cargarlos todos en memoria.
        foreach (Product::query()->latest()->cursor() as $product) {
            yield [$product->code, $product->name, $product->brand, (float) $product->price, $product->created_at];
        }
    }
}
