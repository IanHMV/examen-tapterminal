<?php

namespace App\Support;

use App\Exports\TableExport;
use Barryvdh\DomPDF\Facade\Pdf;
use DateTimeInterface;
use Illuminate\Http\Response;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use OpenSpout\Common\Entity\Cell;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Common\Entity\Style\Style;
use OpenSpout\Writer\XLSX\Writer;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Convierte un listado (App\Exports\TableExport) en un archivo de Excel o PDF para descargar.
 */
class TableExporter
{
    public const FORMATS = ['xlsx', 'pdf'];

    /** Formato de fecha del sistema (requisito del examen: DD/MM/YYYY HH:MM). */
    private const DATE_FORMAT = 'd/m/Y H:i';

    /** El mismo formato, con la sintaxis de Excel. */
    private const EXCEL_DATE_FORMAT = 'dd/mm/yyyy hh:mm';

    /**
     * @param  'xlsx'|'pdf'  $format
     * @param  string  $timezone  Zona horaria de quien descarga: las fechas salen igual que en pantalla.
     */
    public function download(TableExport $export, string $format, string $timezone): StreamedResponse|Response
    {
        $filename = sprintf('%s-%s.%s', Str::slug($export->title()), now($timezone)->format('Y-m-d-Hi'), $format);

        return $format === 'pdf'
            ? $this->pdf($export, $filename, $timezone)
            : $this->xlsx($export, $filename, $timezone);
    }

    /**
     * Excel: se escribe fila por fila directo a la respuesta, sin armar el archivo en memoria.
     * Las fechas y los precios quedan como fecha y número (se pueden ordenar y sumar).
     */
    private function xlsx(TableExport $export, string $filename, string $timezone): StreamedResponse
    {
        return response()->streamDownload(function () use ($export, $timezone) {
            $dateStyle = (new Style())->setFormat(self::EXCEL_DATE_FORMAT);
            $numberStyle = (new Style())->setFormat('#,##0.00');

            $writer = new Writer();
            $writer->openToFile('php://output');

            $sheet = $writer->getCurrentSheet();
            $sheet->setName($export->title());
            $sheet->setColumnWidthForRange(22, 1, count($export->headings()));

            $writer->addRow(Row::fromValues($export->headings(), (new Style())->setFontBold()));

            foreach ($export->rows() as $values) {
                $writer->addRow(new Row(array_map(fn ($value) => match (true) {
                    $value instanceof DateTimeInterface => Cell::fromValue($this->localTime($value, $timezone), $dateStyle),
                    is_float($value) => Cell::fromValue($value, $numberStyle),
                    default => Cell::fromValue($value),
                }, $values)));
            }

            $writer->close();
        }, $filename, ['Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']);
    }

    /** PDF: una tabla en hoja carta horizontal (vista resources/views/exports/table.blade.php). */
    private function pdf(TableExport $export, string $filename, string $timezone): Response
    {
        $rows = [];

        foreach ($export->rows() as $values) {
            $rows[] = array_map(fn ($value) => match (true) {
                $value instanceof DateTimeInterface => $this->localTime($value, $timezone)->format(self::DATE_FORMAT),
                is_float($value) => number_format($value, 2),
                $value === null || $value === '' => '—',
                default => (string) $value,
            }, $values);
        }

        $pdf = Pdf::loadView('exports.table', [
            'title' => $export->title(),
            'headings' => $export->headings(),
            'rows' => $rows,
            'generatedAt' => now($timezone)->format(self::DATE_FORMAT),
            'timezone' => $timezone,
        ])
            ->setPaper('letter', 'landscape')
            // Solo incrusta las letras que se usan: de unos 900 KB a unos 25 KB por archivo.
            ->setOption('isFontSubsettingEnabled', true);

        // "Página X de Y" en cada hoja. El total solo se conoce al terminar de armar el documento,
        // por eso se escribe después de render() (CSS no lo puede calcular en dompdf).
        $pdf->render();
        $dompdf = $pdf->getDomPDF();
        $dompdf->getCanvas()->page_text(
            690,
            585,
            'Página {PAGE_NUM} de {PAGE_COUNT}',
            $dompdf->getFontMetrics()->getFont('DejaVu Sans'),
            8,
            [0.42, 0.45, 0.5],
        );

        return $pdf->download($filename);
    }

    /** MongoDB guarda las fechas en UTC; se muestran en la hora local de quien descarga. */
    private function localTime(DateTimeInterface $date, string $timezone): Carbon
    {
        return Carbon::instance($date)->setTimezone($timezone);
    }
}
