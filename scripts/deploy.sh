#!/usr/bin/env bash
# Despliegue en el VPS. Lo ejecuta GitHub Actions por SSH (comando forzado en
# ~/.ssh/authorized_keys) y también se puede correr a mano: bash scripts/deploy.sh
set -euo pipefail

main() {
    cd "$(dirname "$0")/.."
    local compose=(docker compose -f docker-compose.prod.yml)

    echo "==> Código"
    git fetch --quiet origin main
    # Solo avanza: si alguien cambió archivos en el servidor, se detiene en lugar de pisarlos.
    git merge --ff-only origin/main
    git log --oneline -1

    echo "==> Imágenes (una por una: el VPS tiene 2 GB de RAM)"
    "${compose[@]}" build api
    "${compose[@]}" build web

    echo "==> Contenedores"
    "${compose[@]}" up -d --remove-orphans

    echo "==> Base de datos"
    "${compose[@]}" exec -T api php artisan migrate --force
    "${compose[@]}" exec -T api php artisan db:seed --force

    echo "==> Limpieza de imágenes sin usar"
    docker image prune --force

    echo "==> Listo: $(git rev-parse --short HEAD)"
}

# Todo va dentro de main(): bash lee la función completa antes de ejecutarla, así que el
# "git merge" puede actualizar este mismo archivo sin romper el despliegue en curso.
main "$@"
