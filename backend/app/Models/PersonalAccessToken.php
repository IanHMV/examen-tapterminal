<?php

namespace App\Models;

use Laravel\Sanctum\PersonalAccessToken as SanctumPersonalAccessToken;
use MongoDB\Laravel\Eloquent\DocumentModel;

/**
 * Token de sesión de Sanctum guardado en MongoDB (colección "personal_access_tokens").
 *
 * El modelo que trae Sanctum es de SQL; el trait DocumentModel de laravel-mongodb
 * lo adapta a documentos. Se registra en AppServiceProvider.
 */
class PersonalAccessToken extends SanctumPersonalAccessToken
{
    use DocumentModel;

    protected $connection = 'mongodb';

    protected $table = 'personal_access_tokens';

    protected $primaryKey = '_id';

    protected $keyType = 'string';
}
