<?php

namespace Tests\Feature;

use App\Support\SequenceGenerator;
use Tests\Concerns\RefreshMongoDatabase;
use Tests\TestCase;

/**
 * Contador atómico de los códigos (PRD-0001, USR-0001...).
 */
class SequenceGeneratorTest extends TestCase
{
    use RefreshMongoDatabase;

    public function test_cada_contador_avanza_de_uno_en_uno_por_separado(): void
    {
        $sequences = app(SequenceGenerator::class);

        $this->assertSame([1, 2, 3], [$sequences->next('prueba'), $sequences->next('prueba'), $sequences->next('prueba')]);
        $this->assertSame(1, $sequences->next('otra'));
    }
}
