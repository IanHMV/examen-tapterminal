<?php

namespace Database\Factories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Productos falsos para pruebas y desarrollo.
 * Usa Faker, que solo se instala en desarrollo (no existe en la imagen de producción).
 *
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        return [
            'name' => ucfirst(fake()->words(3, true)),
            'brand' => fake()->company(),
            'price' => fake()->randomFloat(2, 1, 999.99),
        ];
    }
}
