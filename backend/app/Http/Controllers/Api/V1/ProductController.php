<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use OpenApi\Attributes as OA;

/**
 * Catálogo de productos.
 */
#[OA\Parameter(
    parameter: 'ProductCode',
    name: 'code',
    in: 'path',
    required: true,
    description: 'Código del producto.',
    schema: new OA\Schema(type: 'string', example: 'PRD-0001')
)]
#[OA\Response(
    response: 'ProductValidationError',
    description: 'Los datos no son válidos.',
    content: new OA\JsonContent(
        ref: '#/components/schemas/ValidationError',
        example: [
            'message' => 'El campo nombre es obligatorio.',
            'errors' => [
                'name' => ['El campo nombre es obligatorio.'],
                'price' => ['El campo precio no debe ser mayor que 999.99.'],
            ],
        ]
    )
)]
class ProductController extends Controller
{
    /** Productos por página en el listado. */
    private const PER_PAGE = 10;

    #[OA\Get(
        path: '/api/v1/products',
        operationId: 'listProducts',
        summary: 'Listar productos',
        description: 'Devuelve los productos del más reciente al más antiguo, en páginas de 10.',
        tags: ['Productos'],
        parameters: [
            new OA\Parameter(
                name: 'page',
                in: 'query',
                required: false,
                description: 'Número de página (empieza en 1).',
                schema: new OA\Schema(type: 'integer', minimum: 1, example: 1)
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Una página de productos.',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(
                            property: 'data',
                            type: 'array',
                            items: new OA\Items(ref: '#/components/schemas/Product')
                        ),
                        new OA\Property(property: 'links', ref: '#/components/schemas/PaginationLinks'),
                        new OA\Property(property: 'meta', ref: '#/components/schemas/PaginationMeta'),
                    ]
                )
            ),
            new OA\Response(ref: '#/components/responses/Unauthenticated', response: 401),
            new OA\Response(ref: '#/components/responses/Forbidden', response: 403),
        ]
    )]
    public function index(): AnonymousResourceCollection
    {
        // latest() ordena por created_at descendente y aprovecha su índice.
        $products = Product::query()->latest()->paginate(self::PER_PAGE);

        return ProductResource::collection($products);
    }

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
            new OA\Response(ref: '#/components/responses/ProductValidationError', response: 422),
            new OA\Response(ref: '#/components/responses/Unauthenticated', response: 401),
            new OA\Response(ref: '#/components/responses/Forbidden', response: 403),
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

    #[OA\Get(
        path: '/api/v1/products/{code}',
        operationId: 'showProduct',
        summary: 'Ver un producto',
        description: 'Busca el producto por su código (PRD-0001).',
        tags: ['Productos'],
        parameters: [new OA\Parameter(ref: '#/components/parameters/ProductCode')],
        responses: [
            new OA\Response(
                response: 200,
                description: 'El producto.',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'data', ref: '#/components/schemas/Product'),
                    ]
                )
            ),
            new OA\Response(ref: '#/components/responses/NotFound', response: 404),
            new OA\Response(ref: '#/components/responses/Unauthenticated', response: 401),
            new OA\Response(ref: '#/components/responses/Forbidden', response: 403),
        ]
    )]
    public function show(Product $product): ProductResource
    {
        return ProductResource::make($product);
    }

    #[OA\Put(
        path: '/api/v1/products/{code}',
        operationId: 'updateProduct',
        summary: 'Editar un producto',
        description: 'Reemplaza nombre, marca y precio. El código y la fecha de creación no cambian.',
        tags: ['Productos'],
        parameters: [new OA\Parameter(ref: '#/components/parameters/ProductCode')],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: '#/components/schemas/ProductInput')
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Producto actualizado.',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'data', ref: '#/components/schemas/Product'),
                    ]
                )
            ),
            new OA\Response(ref: '#/components/responses/NotFound', response: 404),
            new OA\Response(ref: '#/components/responses/ProductValidationError', response: 422),
            new OA\Response(ref: '#/components/responses/Unauthenticated', response: 401),
            new OA\Response(ref: '#/components/responses/Forbidden', response: 403),
        ]
    )]
    public function update(UpdateProductRequest $request, Product $product): ProductResource
    {
        // Igual que en el alta: solo los campos validados; "code" se ignora aunque se envíe.
        $product->update($request->validated());

        return ProductResource::make($product);
    }

    #[OA\Delete(
        path: '/api/v1/products/{code}',
        operationId: 'deleteProduct',
        summary: 'Eliminar un producto',
        description: 'Borra el producto de forma permanente. Su código no se vuelve a asignar.',
        tags: ['Productos'],
        parameters: [new OA\Parameter(ref: '#/components/parameters/ProductCode')],
        responses: [
            new OA\Response(response: 204, description: 'Producto eliminado (sin contenido).'),
            new OA\Response(ref: '#/components/responses/NotFound', response: 404),
            new OA\Response(ref: '#/components/responses/Unauthenticated', response: 401),
            new OA\Response(ref: '#/components/responses/Forbidden', response: 403),
        ]
    )]
    public function destroy(Product $product): Response
    {
        // Borrado físico: el documento sale de MongoDB. El contador de códigos no retrocede.
        $product->delete();

        return response()->noContent();
    }
}
