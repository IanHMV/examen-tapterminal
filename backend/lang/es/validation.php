<?php

/*
|--------------------------------------------------------------------------
| Mensajes de validación en español
|--------------------------------------------------------------------------
| Solo incluye las reglas que usa la API. Si falta alguna, Laravel usa
| el mensaje en inglés .
*/

return [
    'array' => 'El campo :attribute debe ser una lista.',
    'decimal' => 'El campo :attribute debe tener :decimal decimales.',
    'distinct' => 'El campo :attribute tiene un valor duplicado.',
    'email' => 'El campo :attribute debe ser un correo electrónico válido.',
    'enum' => 'El valor de :attribute no es válido.',
    'exists' => 'El valor de :attribute no existe.',
    'image' => 'El archivo :attribute debe ser una imagen.',
    'max' => [
        'file' => 'El archivo :attribute no debe pesar más de :max kilobytes.',
        'numeric' => 'El campo :attribute no debe ser mayor que :max.',
        'string' => 'El campo :attribute no debe tener más de :max caracteres.',
    ],
    'min' => [
        'array' => 'El campo :attribute debe tener al menos :min elementos.',
        'numeric' => 'El campo :attribute debe ser al menos :min.',
    ],
    'mimes' => 'El archivo :attribute debe ser de tipo: :values.',
    'numeric' => 'El campo :attribute debe ser un número.',
    'regex' => 'El formato de :attribute no es válido.',
    'required' => 'El campo :attribute es obligatorio.',
    'string' => 'El campo :attribute debe ser texto.',
    'unique' => 'El campo :attribute ya ha sido registrado.',
    'uploaded' => 'El archivo :attribute no se pudo subir.',

    'custom' => [
        'price' => [
            'decimal' => 'El campo precio admite máximo 2 decimales.',
        ],
        'sections' => [
            'required' => 'Selecciona al menos una sección.',
            'min' => 'Selecciona al menos una sección.',
        ],
        'phone' => [
            'regex' => 'El teléfono debe incluir la lada del país, por ejemplo +52 314 123 4567.',
        ],
        'photo' => [
            'max' => 'La foto no debe pesar más de 2 MB.',
            'mimes' => 'La foto debe ser JPG, PNG o WebP.',
            'uploaded' => 'La foto no se pudo subir (máximo 2 MB).',
        ],
        'profile_codes' => [
            'required' => 'Selecciona al menos un perfil.',
            'min' => 'Selecciona al menos un perfil.',
        ],
        'profile_codes.*' => [
            'exists' => 'El perfil seleccionado no existe.',
        ],
    ],

    // Nombre de cada campo en los mensajes ("name" → "nombre").
    'attributes' => [
        'brand' => 'marca',
        'email' => 'correo',
        'name' => 'nombre',
        'phone' => 'teléfono',
        'photo' => 'foto',
        'price' => 'precio',
        'profile_codes' => 'perfiles',
        'profile_codes.*' => 'perfil',
        'sections' => 'secciones',
        'sections.*' => 'sección',
    ],
];
