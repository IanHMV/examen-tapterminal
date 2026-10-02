<?php

namespace App\OpenApi;

use OpenApi\Attributes as OA;

/**
 * Metadatos generales de la documentación OpenAPI (Swagger).
 *
 * Esta clase no contiene lógica: solo agrupa los atributos que describen
 * la API completa. Cada endpoint se documenta en su propio controlador.
 *
 * L5_SWAGGER_CONST_HOST se define al generar la documentación a partir de
 * APP_URL (config/l5-swagger.php), así la URL cambia según el entorno.
 */
#[OA\Info(
    version: '1.0.0',
    title: 'Examen TAP Terminal API',
    description: 'API REST del sistema de gestión de productos, usuarios y perfiles.',
)]
#[OA\Server(url: L5_SWAGGER_CONST_HOST, description: 'Servidor actual')]
#[OA\Tag(name: 'Sistema', description: 'Estado y salud del servicio')]
#[OA\Tag(name: 'Productos', description: 'Catálogo de productos')]
#[OA\Tag(name: 'Perfiles', description: 'Perfiles de usuario y las secciones a las que dan acceso')]
#[OA\Schema(
    schema: 'ValidationError',
    description: 'Respuesta 422 de Laravel: un mensaje general y los errores de cada campo.',
    required: ['message', 'errors'],
    properties: [
        new OA\Property(property: 'message', type: 'string', description: 'Primer error y cuántos más hay.'),
        new OA\Property(
            property: 'errors',
            type: 'object',
            additionalProperties: new OA\AdditionalProperties(
                type: 'array',
                items: new OA\Items(type: 'string')
            )
        ),
    ],
    type: 'object'
)]
#[OA\Schema(
    schema: 'PaginationLinks',
    description: 'URL de las páginas vecinas (null si no existen).',
    properties: [
        new OA\Property(
            property: 'first',
            type: 'string',
            nullable: true,
            example: 'http://localhost:8000/api/v1/products?page=1',
            description: 'Primera página.'
        ),
        new OA\Property(property: 'last', type: 'string', nullable: true),
        new OA\Property(property: 'prev', type: 'string', nullable: true),
        new OA\Property(property: 'next', type: 'string', nullable: true),
    ],
    type: 'object'
)]
#[OA\Schema(
    schema: 'PaginationMeta',
    description: 'Datos de la página actual.',
    properties: [
        new OA\Property(property: 'current_page', type: 'integer', example: 1, description: 'Página actual.'),
        new OA\Property(property: 'from', type: 'integer', nullable: true, example: 1),
        new OA\Property(property: 'last_page', type: 'integer', example: 2),
        new OA\Property(
            property: 'links',
            type: 'array',
            items: new OA\Items(type: 'object'),
            description: 'Enlaces numerados para paginadores HTML (la app no los usa).'
        ),
        new OA\Property(property: 'path', type: 'string', example: 'http://localhost:8000/api/v1/products'),
        new OA\Property(property: 'per_page', type: 'integer', example: 10),
        new OA\Property(property: 'to', type: 'integer', nullable: true, example: 10),
        new OA\Property(property: 'total', type: 'integer', example: 11),
    ],
    type: 'object'
)]
#[OA\Response(
    response: 'NotFound',
    description: 'El recurso no existe.',
    content: new OA\JsonContent(
        properties: [
            new OA\Property(property: 'message', type: 'string', example: 'Recurso no encontrado.'),
        ]
    )
)]
#[OA\Response(
    response: 'Conflict',
    description: 'Otro registro con el mismo dato único se guardó al mismo tiempo.',
    content: new OA\JsonContent(
        properties: [
            new OA\Property(property: 'message', type: 'string', example: 'El registro ya existe.'),
        ]
    )
)]
class OpenApiSpec
{
}
