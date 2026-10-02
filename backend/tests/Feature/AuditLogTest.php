<?php

namespace Tests\Feature;

use App\Enums\Section;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Tests\Concerns\RefreshMongoDatabase;
use Tests\TestCase;

/**
 * Bitácora: dato anterior y actual de cada cambio (requisito del examen).
 */
class AuditLogTest extends TestCase
{
    use RefreshMongoDatabase;

    private const PRODUCT = ['name' => 'Casco de seguridad tipo I', 'brand' => '3M', 'price' => '289.00'];

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = $this->actingAsUserWith(Section::Products, Section::AuditLog);
    }

    public function test_registra_alta_edicion_y_eliminacion_con_el_antes_el_despues_y_el_autor(): void
    {
        $this->postJson('/api/v1/products', self::PRODUCT);
        $this->putJson('/api/v1/products/PRD-0001', [...self::PRODUCT, 'price' => '310.00']);
        $this->deleteJson('/api/v1/products/PRD-0001');

        $response = $this->getJson('/api/v1/audit-logs?code=prd-0001')->assertOk()->assertJsonCount(3, 'data');

        [$deleted, $updated, $created] = $response->json('data');
        $this->assertSame(['created', null], [$created['action'], $created['before']]);
        $this->assertSame(['deleted', null], [$deleted['action'], $deleted['after']]);
        $this->assertSame('updated', $updated['action']);
        $this->assertSame(['price'], $updated['changed_fields']);
        $this->assertSame(['289.00', '310.00'], [$updated['before']['price'], $updated['after']['price']]);
        $this->assertSame(['code' => $this->admin->code, 'name' => $this->admin->name], $updated['user']);
    }

    public function test_guardar_sin_cambios_no_agrega_registros(): void
    {
        $this->postJson('/api/v1/products', self::PRODUCT);
        $this->putJson('/api/v1/products/PRD-0001', [...self::PRODUCT, 'price' => '289'])->assertOk();

        $this->assertSame(1, AuditLog::where('entity_code', 'PRD-0001')->count());
    }

    public function test_de_la_contrasena_solo_anota_que_cambio_nunca_su_valor(): void
    {
        $this->admin->password = 'Otra-Clave-2026';
        $this->admin->save();

        $log = AuditLog::where('entity_code', $this->admin->code)->latest()->firstOrFail();
        $this->assertSame(['password'], $log->changed_fields);
        $this->assertArrayNotHasKey('password', $log->before);
        $this->assertArrayNotHasKey('password', $log->after);

        // Ningún documento de la bitácora contiene un hash bcrypt.
        $documents = json_encode(DB::connection('mongodb')->getCollection('audit_logs')->find()->toArray());
        $this->assertStringNotContainsString('$2y$', $documents);
    }

    public function test_un_registro_no_se_puede_editar_ni_borrar(): void
    {
        $this->postJson('/api/v1/products', self::PRODUCT);
        $log = AuditLog::where('entity_code', 'PRD-0001')->firstOrFail();

        $this->assertFalse($log->update(['entity_code' => 'PRD-9999']));
        $this->assertFalse($log->delete());
        $this->assertSame('PRD-0001', $log->fresh()->entity_code);
    }

    public function test_filtra_por_entidad_y_valida_los_filtros(): void
    {
        $this->postJson('/api/v1/products', self::PRODUCT);

        $this->getJson('/api/v1/audit-logs?entity=products')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.entity', 'products');

        $this->getJson('/api/v1/audit-logs?entity=passwords')
            ->assertStatus(422)
            ->assertJsonPath('errors.entity.0', 'El valor de entidad no es válido.');
    }
}
