<?php

namespace Tests\Feature;

use App\Enums\Section;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use MongoDB\BSON\Decimal128;
use Tests\Concerns\RefreshMongoDatabase;
use Tests\TestCase;

/**
 * Catálogo de productos: alta, validación, edición, eliminación y listado.
 */
class ProductTest extends TestCase
{
    use RefreshMongoDatabase;

    private const PRODUCT = ['name' => 'Casco de seguridad tipo I', 'brand' => '3M', 'price' => '289.5'];

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAsUserWith(Section::Products);
    }

    public function test_el_alta_genera_el_codigo_consecutivo_y_guarda_el_precio_exacto(): void
    {
        // El cliente no puede inventar el código: se ignora.
        $this->postJson('/api/v1/products', [...self::PRODUCT, 'code' => 'PRD-9999'])
            ->assertCreated()
            ->assertJsonPath('data.code', 'PRD-0001')
            ->assertJsonPath('data.price', '289.50');

        $this->postJson('/api/v1/products', self::PRODUCT)->assertJsonPath('data.code', 'PRD-0002');

        // En MongoDB el precio es Decimal128 (exacto), no un float.
        $document = DB::connection('mongodb')->getCollection('products')->findOne(['code' => 'PRD-0001']);
        $this->assertInstanceOf(Decimal128::class, $document['price']);
    }

    public function test_valida_precio_de_maximo_3_digitos_y_2_decimales_con_mensajes_en_espanol(): void
    {
        $cases = [
            ['price' => '1000', 'error' => 'El campo precio no debe ser mayor que 999.99.'],
            ['price' => '10.555', 'error' => 'El campo precio admite máximo 2 decimales.'],
            ['price' => '0', 'error' => 'El campo precio debe ser al menos 0.01.'],
        ];

        foreach ($cases as $case) {
            $this->postJson('/api/v1/products', [...self::PRODUCT, 'price' => $case['price']])
                ->assertStatus(422)
                ->assertJsonPath('errors.price.0', $case['error']);
        }

        $this->postJson('/api/v1/products', ['price' => '10'])
            ->assertStatus(422)
            ->assertJsonPath('errors.name.0', 'El campo nombre es obligatorio.')
            ->assertJsonPath('errors.brand.0', 'El campo marca es obligatorio.');

        $this->assertSame(0, Product::count());
    }

    public function test_edita_y_elimina_por_codigo_sin_reutilizar_el_codigo(): void
    {
        $this->postJson('/api/v1/products', self::PRODUCT);

        $this->putJson('/api/v1/products/PRD-0001', [...self::PRODUCT, 'price' => '310'])
            ->assertOk()
            ->assertJsonPath('data.price', '310.00');

        $this->deleteJson('/api/v1/products/PRD-0001')->assertNoContent();

        // 404 genérico: no revela el nombre interno del modelo.
        $this->getJson('/api/v1/products/PRD-0001')
            ->assertNotFound()
            ->assertExactJson(['message' => 'Recurso no encontrado.']);

        // El contador no retrocede: el código borrado no se vuelve a usar.
        $this->postJson('/api/v1/products', self::PRODUCT)->assertJsonPath('data.code', 'PRD-0002');
    }

    public function test_lista_en_paginas_de_10(): void
    {
        Product::factory()->count(11)->create();

        $this->getJson('/api/v1/products')
            ->assertOk()
            ->assertJsonCount(10, 'data')
            ->assertJsonPath('meta.total', 11)
            ->assertJsonPath('meta.last_page', 2);

        $this->getJson('/api/v1/products?page=2')->assertJsonCount(1, 'data');
    }
}
