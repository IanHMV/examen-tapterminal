<?php

namespace App\Http\Requests;

/**
 * Valida el alta de un usuario (multipart/form-data): los mismos datos que la
 * edición más la foto de perfil, que el examen marca como obligatoria.
 */
class StoreUserRequest extends UpdateUserRequest
{
    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            ...parent::rules(),
            'photo' => UpdateUserPhotoRequest::PHOTO_RULES,
        ];
    }
}
