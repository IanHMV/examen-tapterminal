<?php

namespace Tests\Feature;

use App\Enums\Section;
use App\Models\Product;
use DateTimeInterface;
use OpenSpout\Reader\XLSX\Reader;
use Tests\Concerns\RefreshMongoDatabase;
use Tests\TestCase;

/**
 * Exportación de los listados a Excel y PDF (fechas DD/MM/YYYY HH:MM).
 */
class ExportTest extends TestCase
{
    use RefreshMongoDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAsUserWith(Section::Products, Section::Profiles, Section::AuditLog);

        // 18:30 UTC = 12:30 en Ciudad de México.
        $this->travelTo('2026-10-02 18:30:00');
        Product::create(['name' => 'Casco de seguridad tipo I', 'brand' => '3M', 'price' => '1289.5']);
    }

    /**
     * Filas del primer libro de un Excel descargado.
     *
     * @return list<list<mixed>>
     */
    private function excelRows(string $content): array
    {
        $path = tempnam(sys_get_temp_dir(), 'xlsx');
        file_put_contents($path, $content);

        $reader = new Reader();
        $reader->open($path);
        $rows = [];

        foreach ($reader->getSheetIterator() as $sheet) {
            foreach ($sheet->getRowIterator() as $row) {
                $rows[] = $row->toArray();
            }
            break;
        }

        $reader->close();
        unlink($path);

        return $rows;
    }

    public function test_el_excel_trae_fechas_y_precios_como_valores_reales_en_la_hora_local(): void
    {
        $response = $this->get('/api/v1/products/export?format=xlsx&timezone=America/Mexico_City')
            ->assertOk()
            ->assertDownload('productos-2026-10-02-1230.xlsx');

        [$headings, $product] = $this->excelRows($response->streamedContent());

        $this->assertSame(['Código', 'Nombre', 'Marca', 'Precio', 'Fecha de creación'], $headings);
        $this->assertSame(['PRD-0001', 'Casco de seguridad tipo I', '3M'], array_slice($product, 0, 3));
        $this->assertSame(1289.5, $product[3]);
        $this->assertInstanceOf(DateTimeInterface::class, $product[4]);
        $this->assertSame('02/10/2026 12:30', $product[4]->format('d/m/Y H:i'));
    }

    public function test_el_pdf_se_descarga_con_su_nombre(): void
    {
        $response = $this->get('/api/v1/products/export?format=pdf')
            ->assertOk()
            ->assertHeader('Content-Type', 'application/pdf')
            ->assertDownload('productos-2026-10-02-1230.pdf');

        $this->assertStringStartsWith('%PDF', $response->getContent());
    }

    public function test_la_bitacora_se_exporta_con_sus_filtros(): void
    {
        $this->postJson('/api/v1/profiles', ['name' => 'Supervisor', 'sections' => ['products']])->assertCreated();

        $response = $this->get('/api/v1/audit-logs/export?format=xlsx&entity=profiles')->assertOk();
        $rows = array_slice($this->excelRows($response->streamedContent()), 1);

        $this->assertNotEmpty($rows);
        $this->assertSame(['Perfil'], array_values(array_unique(array_column($rows, 1))));
        $this->assertContains('Nombre: Supervisor; Secciones: Productos', array_column($rows, 5));
    }

    public function test_valida_el_formato_y_la_zona_horaria(): void
    {
        $this->getJson('/api/v1/products/export?format=csv&timezone=Luna/Base')
            ->assertStatus(422)
            ->assertJsonPath('errors.format.0', 'El valor de formato no es válido.')
            ->assertJsonPath('errors.timezone.0', 'El campo zona horaria debe ser una zona horaria válida.');
    }

    public function test_exportar_exige_la_seccion_del_listado(): void
    {
        $this->getJson('/api/v1/users/export?format=xlsx')->assertForbidden();
    }
}
