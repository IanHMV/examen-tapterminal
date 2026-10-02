<?php

return [
    App\Providers\AppServiceProvider::class,

    // Validación "unique"/"exists" de MongoDB: compara sin distinguir mayúsculas,
    // igual que el índice único con collation. laravel-mongodb no lo registra solo.
    MongoDB\Laravel\Validation\ValidationServiceProvider::class,
];
