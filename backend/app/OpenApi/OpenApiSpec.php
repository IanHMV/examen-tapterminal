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
class OpenApiSpec
{
}
