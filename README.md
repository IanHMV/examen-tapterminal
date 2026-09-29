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

🚧 Próximamente en https://ianmartinez.dev/examen-tapterminal


## Decisiones técnicas

### Laravel 11 sin soporte de seguridad (avisos aceptados)

El examen exige Laravel 11, que dejó de recibir parches de seguridad en marzo de 2026.
Composer 2.10 bloquea versiones con avisos conocidos, así que se ignoran **solo** los que
afectan a la última 11.x (`backend/composer.json` → `config.policy.advisories.ignore-id`).
Cualquier aviso nuevo, en cualquier paquete, sigue bloqueando la instalación.


