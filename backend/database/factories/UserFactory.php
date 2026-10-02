<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use MongoDB\BSON\ObjectId;

/**
 * Usuarios falsos para pruebas y desarrollo.
 * Usa Faker, que solo se instala en desarrollo (no existe en la imagen de producción).
 *
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected $model = User::class;

    /** Contraseña compartida: cifrarla una sola vez hace más rápidas las pruebas. */
    protected static ?string $password;

    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'phone' => null,
            'profile_codes' => [],
            'password' => static::$password ??= Hash::make('password'),
            // Id de una foto que no existe en GridFS: basta para pruebas que no la descargan.
            'photo_id' => (string) new ObjectId(),
        ];
    }
}
