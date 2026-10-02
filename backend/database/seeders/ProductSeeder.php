<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;

/**
 * Catálogo inicial de productos con datos fijos (sin Faker), para que también
 * pueda ejecutarse en producción. Es idempotente: si ya hay productos, no hace nada.
 */
class ProductSeeder extends Seeder
{
    private const PRODUCTS = [
        ['name' => 'Casco de seguridad tipo I', 'brand' => '3M', 'price' => 289.00],
        ['name' => 'Chaleco reflejante clase 2', 'brand' => 'Truper', 'price' => 149.90],
        ['name' => 'Guantes de carga de piel', 'brand' => 'Urrea', 'price' => 119.00],
        ['name' => 'Botas de seguridad dieléctricas', 'brand' => 'Caterpillar', 'price' => 989.00],
        ['name' => 'Precintos para contenedor (10 piezas)', 'brand' => 'TydenBrooks', 'price' => 459.00],
        ['name' => 'Candado de alta seguridad', 'brand' => 'Master Lock', 'price' => 649.00],
        ['name' => 'Radio portátil de dos vías', 'brand' => 'Motorola', 'price' => 949.00],
        ['name' => 'Lámpara LED recargable', 'brand' => 'Truper', 'price' => 359.00],
        ['name' => 'Lentes de seguridad antiempañantes', 'brand' => '3M', 'price' => 89.50],
        ['name' => 'Cinta métrica de 8 m', 'brand' => 'Stanley', 'price' => 219.00],
    ];

    public function run(): void
    {
        if (Product::query()->exists()) {
            return;
        }

        foreach (self::PRODUCTS as $product) {
            Product::create($product);
        }
    }
}
