<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use MongoDB\BSON\ObjectId;
use MongoDB\Exception\InvalidArgumentException;
use MongoDB\GridFS\Bucket;
use MongoDB\GridFS\Exception\FileNotFoundException;

/**
 * Guarda las fotos de perfil en GridFS, el sistema de archivos de MongoDB.
 *
 * GridFS parte cada archivo en trozos (colección "photos.chunks") y guarda sus
 * datos en "photos.files". Las fotos viven en la misma base de datos que el
 * resto de la información: un solo respaldo y sin volúmenes extra en Docker.
 */
class PhotoStorage
{
    private const BUCKET = 'photos';

    /** Guarda la imagen y devuelve su id en GridFS. */
    public function store(UploadedFile $file): string
    {
        $stream = fopen($file->getRealPath(), 'rb');

        try {
            $id = $this->bucket()->uploadFromStream($file->hashName(), $stream, [
                // El tipo lo detecta PHP leyendo el contenido, no la extensión del nombre.
                'metadata' => ['contentType' => $file->getMimeType()],
            ]);
        } finally {
            fclose($stream);
        }

        return (string) $id;
    }

    /**
     * Abre la imagen para enviarla al navegador; null si no existe.
     *
     * @return array{stream: resource, contentType: string, length: int}|null
     */
    public function open(string $id): ?array
    {
        try {
            $stream = $this->bucket()->openDownloadStream(new ObjectId($id));
        } catch (FileNotFoundException | InvalidArgumentException) {
            return null;
        }

        $file = $this->bucket()->getFileDocumentForStream($stream);

        return [
            'stream' => $stream,
            'contentType' => $file->metadata->contentType ?? 'application/octet-stream',
            'length' => (int) $file->length,
        ];
    }

    /** Borra la imagen; si ya no existe, no hace nada. */
    public function delete(string $id): void
    {
        try {
            $this->bucket()->delete(new ObjectId($id));
        } catch (FileNotFoundException | InvalidArgumentException) {
            // Ya no estaba: el resultado es el mismo.
        }
    }

    private function bucket(): Bucket
    {
        return DB::connection('mongodb')->getDatabase()->selectGridFSBucket(['bucketName' => self::BUCKET]);
    }
}
