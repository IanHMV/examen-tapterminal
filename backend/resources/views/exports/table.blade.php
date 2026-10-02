{{-- Listado exportado a PDF con dompdf (App\Support\TableExporter). Blade escapa cada valor. --}}
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>{{ $title }}</title>
    <style>
        @page {
            margin: 28px 28px 40px;
        }

        body {
            font-family: 'DejaVu Sans', sans-serif; /* incluida en dompdf: tiene acentos y ñ */
            font-size: 10px;
            color: #111827;
        }

        h1 {
            margin: 0 0 4px;
            font-size: 16px;
        }

        .meta {
            margin: 0 0 12px;
            color: #4b5563;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        thead {
            display: table-header-group; /* los encabezados se repiten en cada página */
        }

        th,
        td {
            padding: 4px 6px;
            text-align: left;
            vertical-align: top;
            border: 1px solid #d1d5db;
        }

        th {
            background: #f3f4f6;
        }
    </style>
</head>
<body>
    <h1>{{ config('app.name') }} · {{ $title }}</h1>
    <p class="meta">Generado el {{ $generatedAt }} (hora de {{ $timezone }}) · {{ count($rows) }} registros</p>

    <table>
        <thead>
            <tr>
                @foreach ($headings as $heading)
                    <th>{{ $heading }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @forelse ($rows as $row)
                <tr>
                    @foreach ($row as $cell)
                        <td>{{ $cell }}</td>
                    @endforeach
                </tr>
            @empty
                <tr>
                    <td colspan="{{ count($headings) }}">Sin registros.</td>
                </tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>
