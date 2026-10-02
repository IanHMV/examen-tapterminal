<?php

/*
|--------------------------------------------------------------------------
| Mensajes de validación en español
|--------------------------------------------------------------------------
| Solo incluye las reglas que usa la API. Si falta alguna, Laravel usa
| el mensaje en inglés .
*/

return [
    'decimal' => 'El campo :attribute debe tener :decimal decimales.',
    'max' => [
        'numeric' => 'El campo :attribute no debe ser mayor que :max.',
        'string' => 'El campo :attribute no debe tener más de :max caracteres.',
    ],
    'min' => [
        'numeric' => 'El campo :attribute debe ser al menos :min.',
    ],
    'numeric' => 'El campo :attribute debe ser un número.',
    'required' => 'El campo :attribute es obligatorio.',
    'string' => 'El campo :attribute debe ser texto.',

    'custom' => [
        'price' => [
            'decimal' => 'El campo precio admite máximo 2 decimales.',
        ],
    ],

    // Nombre de cada campo en los mensajes ("name" → "nombre").
    'attributes' => [
        'brand' => 'marca',
        'name' => 'nombre',
        'price' => 'precio',
    ],
];
