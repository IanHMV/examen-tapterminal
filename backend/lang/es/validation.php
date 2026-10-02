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
    'enum' => 'El valor de :attribute no es válido.',
    'max' => [
        'numeric' => 'El campo :attribute no debe ser mayor que :max.',
        'string' => 'El campo :attribute no debe tener más de :max caracteres.',
    ],
    'min' => [
        'array' => 'El campo :attribute debe tener al menos :min elementos.',
        'numeric' => 'El campo :attribute debe ser al menos :min.',
    ],
    'numeric' => 'El campo :attribute debe ser un número.',
    'required' => 'El campo :attribute es obligatorio.',
    'string' => 'El campo :attribute debe ser texto.',
    'unique' => 'El campo :attribute ya ha sido registrado.',

    'custom' => [
        'price' => [
            'decimal' => 'El campo precio admite máximo 2 decimales.',
        ],
        'sections' => [
            'required' => 'Selecciona al menos una sección.',
            'min' => 'Selecciona al menos una sección.',
        ],
    ],

    // Nombre de cada campo en los mensajes ("name" → "nombre").
    'attributes' => [
        'brand' => 'marca',
        'name' => 'nombre',
        'price' => 'precio',
        'sections' => 'secciones',
        'sections.*' => 'sección',
    ],
];
