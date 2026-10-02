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
