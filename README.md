# Examen TAP Terminal — Sistema de Gestión

Sistema web desarrollado para el examen de admisión del Área de Desarrollo de TAP Terminal.

## Stack

| Capa              | Tecnología                      |
|-------------------|---------------------------------|
| Backend           | Laravel 11 · PHP 8.2            |
| Frontend          | Angular 19 · TypeScript 5       |
| Base de datos     | MongoDB                         |
| Documentación API | Swagger (OpenAPI 3)             |
| Infraestructura   | Docker · Docker Compose · Nginx |

## Estructura

```
.
├── backend/    # API REST (Laravel 11)
├── frontend/   # SPA (Angular 19)
└── docker/     # Dockerfiles y configuración de Nginx
```

## Convenciones

- Commits: [Conventional Commits](https://www.conventionalcommits.org/es/v1.0.0/)
- PHP: PSR-12 · Angular: guía de estilo oficial
- Flujo Git: GitHub Flow (una rama por ticket → Pull Request → `main`)

## Demo

- Aplicación: https://ianmartinez.dev/examen-tapterminal/
- Documentación de la API (Swagger): https://ianmartinez.dev/examen-tapterminal/api/documentation

## Decisiones técnicas

### Laravel 11 sin soporte de seguridad (avisos aceptados)

El examen exige Laravel 11, que dejó de recibir parches de seguridad en marzo de 2026.
Composer 2.10 bloquea versiones con avisos conocidos, así que se ignoran **solo** los que
afectan a la última 11.x (`backend/composer.json` → `config.policy.advisories.ignore-id`).
Cualquier aviso nuevo, en cualquier paquete, sigue bloqueando la instalación.

### Modelo de datos en MongoDB

Los nombres van en inglés en el código y en la base de datos (`products`, `price`), y en español en la interfaz.

```js
// Colección "products"
{
  _id: ObjectId("66fb6a1e9c1d4b0012a3b4c5"),
  code: "PRD-0001",                 // índice único
  name: "Casco de seguridad tipo I",
  brand: "3M",
  price: Decimal128("289.00"),
  created_at: ISODate("2026-10-01T18:30:00Z"),   // índice para ordenar el listado
  updated_at: ISODate("2026-10-01T18:30:00Z")
}
```

- **Código con contador atómico.** La colección `counters` guarda un contador por entidad
  (`{ _id: "products", value: 10 }`) y cada alta lo incrementa con `findOneAndUpdate` + `$inc`,
  que es atómico: dos altas simultáneas nunca reciben el mismo código. En una prueba con 20 altas
  simultáneas, "contar + 1" repitió 19 códigos y el contador ninguno. El índice único de `code` es
  una segunda barrera, y los códigos no se reutilizan aunque se borre un producto.
- **`code` fuera de `$fillable`:** el cliente no puede asignarlo ni falsificarlo.
- **Borrado físico:** eliminar quita el documento de MongoDB (`DELETE` → 204) y no se puede deshacer;
  por eso la interfaz pide confirmación. El contador no retrocede: el código borrado no se reutiliza.
- **Búsqueda por código:** el detalle usa el código en la URL (`/api/v1/products/PRD-0001`), que es
  único, inmutable y tiene índice. El listado ordena por `created_at` (también con índice).
- **Precio en `Decimal128`:** decimal exacto, sin los errores de redondeo de `float`. La API lo
  entrega como texto con 2 decimales (`"289.00"`).
- **"Precio máximo 3 dígitos"** se interpreta como hasta 3 dígitos enteros y 2 decimales
  (de 0.01 a 999.99). Laravel (`StoreProductRequest`) y Angular aplican la misma regla.

## Bitácora de desarrollo
Registro del avance del proyecto
> No confundir con la **bitácora de cambios del sistema** (historial de datos anterior vs. actual)

| Ticket | Fecha | Descripción | PR |
|---|---|---|---|
| TICK-01 | 2026-09-29 | Repositorio monorepo y convenciones: Git, EditorConfig y finales de línea LF. | — |
| TICK-02 | 2026-09-29 | Entorno Docker de desarrollo (PHP 8.2-FPM + Nginx) y proyecto Laravel 11. | [#1](https://github.com/IanHMV/examen-tapterminal/pull/1) |
| TICK-03 | 2026-09-29 | Proyecto Angular 19: componentes standalone, SCSS y sin SSR. | [#2](https://github.com/IanHMV/examen-tapterminal/pull/2) |
| TICK-04 | 2026-09-30 | Backend como API pura y primer endpoint: `GET /api/v1/healthcheck`. | [#3](https://github.com/IanHMV/examen-tapterminal/pull/3) |
| TICK-05 | 2026-09-30 | Documentación interactiva de la API con Swagger (OpenAPI 3), con todas sus rutas bajo `/api`. | [#4](https://github.com/IanHMV/examen-tapterminal/pull/4), [#5](https://github.com/IanHMV/examen-tapterminal/pull/5) |
| TICK-06 | 2026-09-30 | Angular consume la API: environments, servicio HTTP y estado del sistema en pantalla. | [#6](https://github.com/IanHMV/examen-tapterminal/pull/6) |
| TICK-07 | 2026-09-30 | CORS restringido al origen del frontend. | [#7](https://github.com/IanHMV/examen-tapterminal/pull/7) |
| TICK-08 | 2026-09-30 | Conexión con MongoDB 8.0 mediante un usuario de mínimo privilegio, y estado de la base de datos en el healthcheck. | [#8](https://github.com/IanHMV/examen-tapterminal/pull/8), [#9](https://github.com/IanHMV/examen-tapterminal/pull/9) |
| TICK-09 | 2026-10-01 | Imágenes de producción en varias etapas, healthchecks y reinicio automático de contenedores. | [#10](https://github.com/IanHMV/examen-tapterminal/pull/10) |
| TICK-10 | 2026-10-01 | Aplicación servida bajo la subruta `/examen-tapterminal` detrás de proxies HTTPS. | [#11](https://github.com/IanHMV/examen-tapterminal/pull/11) |
| TICK-11 | 2026-10-01 | Despliegue en producción: `https://ianmartinez.dev/examen-tapterminal`. | [#12](https://github.com/IanHMV/examen-tapterminal/pull/12) |
| TICK-12 | 2026-10-01 | Modelo `Product` en MongoDB: código autogenerado atómico (`PRD-0001`), precio `Decimal128`, índices y datos iniciales. | [#13](https://github.com/IanHMV/examen-tapterminal/pull/13) |
| TICK-13 | 2026-10-01 | Alta de productos: `POST /api/v1/products`, validación en Laravel y Angular, y mensajes en español. | [#14](https://github.com/IanHMV/examen-tapterminal/pull/14) |
| TICK-14 | 2026-10-01 | Listado paginado y detalle de productos (`GET /api/v1/products`, `GET /api/v1/products/{code}`), publicado en producción. | [#15](https://github.com/IanHMV/examen-tapterminal/pull/15) |
| TICK-15 | 2026-10-01 | Edición de productos: `PUT /api/v1/products/{code}` y el mismo formulario del alta en modo edición. | [#16](https://github.com/IanHMV/examen-tapterminal/pull/16) |
| TICK-16 | 2026-10-01 | Eliminación de productos: `DELETE /api/v1/products/{code}` y diálogo de confirmación reutilizable. | [#17](https://github.com/IanHMV/examen-tapterminal/pull/17) |
