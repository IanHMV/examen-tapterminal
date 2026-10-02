<?php

/*
|--------------------------------------------------------------------------
| Usuario administrador inicial
|--------------------------------------------------------------------------
| Lo crea UserSeeder con el perfil "Administrador". Las credenciales vienen
| del .env y nunca se guardan en el código. Si falta el correo o la
| contraseña, el seeder no crea el usuario.
|
| Se leen aquí (y no con env() en el seeder) porque en producción la
| configuración se cachea y env() deja de funcionar fuera de config/.
*/

return [
    'name' => env('ADMIN_NAME', 'Administrador'),
    'email' => env('ADMIN_EMAIL'),
    'password' => env('ADMIN_PASSWORD'),
];
