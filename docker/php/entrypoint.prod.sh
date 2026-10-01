#!/bin/sh
# Se ejecuta cada vez que arranca el contenedor de producción.
set -e

# Cachés de Laravel: se generan Aal arrancar (no al construir la imagen)
# porque dependen de las variables de entorno de cada servidor.
php artisan config:cache
php artisan route:cache

# Documentación OpenAPI (Swagger) con la URL de este entorno (APP_URL).
php artisan l5-swagger:generate

# Reemplaza este script por PHP-FPM (el proceso principal del contenedor).
exec "$@"
