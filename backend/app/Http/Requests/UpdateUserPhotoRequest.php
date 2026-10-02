<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Valida el cambio de foto de perfil (multipart/form-data).
 */
class UpdateUserPhotoRequest extends FormRequest
{
    /**
     * Solo JPG, PNG o WebP de hasta 2 MB. Laravel revisa el contenido real del
     * archivo, no su extensión. SVG queda fuera: puede llevar código JavaScript.
     */
    public const PHOTO_RULES = ['bail', 'required', 'image', 'mimes:jpeg,png,webp', 'max:2048'];

    public function authorize(): bool
    {
        // Los permisos por perfil se aplican en el TICK-20.
        return true;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'photo' => self::PHOTO_RULES,
        ];
    }
}
