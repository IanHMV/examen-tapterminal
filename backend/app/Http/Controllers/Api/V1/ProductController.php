<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use OpenApi\Attributes as OA;

/**
 * Catálogo de productos.
 */
class ProductController extends Controller
{
    #[OA\Post(
        path: '/api/v1/products',
        operationId: 'storeProduct',
        summary: 'Crear un producto',
        description: 'Registra un producto. El código (PRD-0001) y la fecha de creación los genera el sistema.',
        tags: ['Productos'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: '#/components/schemas/ProductInput')
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Producto creado.',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'data', ref: '#/components/schemas/Product'),
                    ]
                )
            ),
            new OA\Response(
                response: 422,
                description: 'Los datos no son válidos.',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ValidationError',
                    example: [
                        'message' => 'El campo nombre es obligatorio. (y 1 error más)',
                        'errors' => [
                            'name' => ['El campo nombre es obligatorio.'],
                            'price' => ['El campo precio no debe ser mayor que 999.99.'],
                        ],
                    ]
                )
            ),
        ]
    )]
    public function store(StoreProductRequest $request): JsonResponse
    {
        // validated() solo devuelve los campos con reglas: "code" nunca llega desde el cliente.
        $product = Product::create($request->validated());

        return ProductResource::make($product)
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }
}
