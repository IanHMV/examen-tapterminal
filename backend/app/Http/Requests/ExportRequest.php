<?php

namespace App\Http\Requests;

use App\Support\TableExporter;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use OpenApi\Attributes as OA;

/**
 * Valida el formato y la zona horaria de una exportación a Excel o PDF.
 * También documenta los parámetros y las respuestas que comparten todas las exportaciones.
 */
#[OA\Parameter(
    parameter: 'ExportFormat',
    name: 'format',
    in: 'query',
    required: true,
    description: 'xlsx = Excel, pdf = PDF.',
    schema: new OA\Schema(type: 'string', enum: ['xlsx', 'pdf'], example: 'xlsx')
)]
#[OA\Parameter(
    parameter: 'ExportTimezone',
    name: 'timezone',
    in: 'query',
    required: false,
    description: 'Zona horaria de las fechas. Angular envía la del navegador; por defecto, America/Mexico_City.',
    schema: new OA\Schema(type: 'string', example: 'America/Mexico_City')
)]
#[OA\Response(
    response: 'ExportFile',
    description: 'El archivo para descargar (Content-Disposition: attachment), con todos los registros.',
    content: [
        new OA\MediaType(
            mediaType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            schema: new OA\Schema(type: 'string', format: 'binary')
        ),
        new OA\MediaType(mediaType: 'application/pdf', schema: new OA\Schema(type: 'string', format: 'binary')),
    ]
)]
#[OA\Response(
    response: 'ExportValidationError',
    description: 'El formato o la zona horaria no son válidos.',
    content: new OA\JsonContent(
        ref: '#/components/schemas/ValidationError',
        example: [
            'message' => 'El valor de formato no es válido.',
            'errors' => ['format' => ['El valor de formato no es válido.']],
        ]
    )
)]
class ExportRequest extends FormRequest
{
    /** Si el cliente no envía su zona horaria: TAP Terminal opera en Manzanillo, Colima. */
    private const DEFAULT_TIMEZONE = 'America/Mexico_City';

    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'format' => ['required', 'string', Rule::in(TableExporter::FORMATS)],
            // Angular envía la del navegador, para que las fechas salgan igual que en pantalla.
            'timezone' => ['nullable', 'string', 'timezone:all'],
        ];
    }

    /** @return 'xlsx'|'pdf' */
    public function exportFormat(): string
    {
        return $this->validated('format');
    }

    public function timezone(): string
    {
        return $this->validated('timezone') ?? self::DEFAULT_TIMEZONE;
    }
}
