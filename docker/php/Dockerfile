# ------------------------------------------------------------------
# Imagen de Desarrollo backend (Laravel 11 · PHP 8.2)
# ------------------------------------------------------------------
FROM php:8.2-fpm-bookworm

# Paquetes del sistema y extensiones de PHP:
#   - unzip + libzip-dev + ext zip: Composer descarga las dependencias como .zip
#   - libssl-dev: la extensión de MongoDB la necesita para autenticarse (SCRAM-SHA-256)
#   - opcache: guarda el PHP ya compilado

# Se limpia la caché de apt en el mismo RUN para que la imagen pese menos.
RUN apt-get update \
    && apt-get install -y --no-install-recommends unzip libzip-dev libssl-dev \
    && docker-php-ext-install zip opcache \
    && rm -rf /var/lib/apt/lists/*

# Extensión de MongoDB (driver oficial en C).
RUN pecl install mongodb-2.5.3 \
    && docker-php-ext-enable mongodb

#Copiamos solo el ejecutable desde su imagen oficial
COPY --from=composer:2.10 /usr/bin/composer /usr/bin/composer

# Carpetas personales en /tmp: www-data no puede escribir en /var/www
# (Composer guarda ahí su caché y "php artisan tinker" su configuración).
ENV HOME=/tmp
ENV COMPOSER_HOME=/tmp/composer

WORKDIR /var/www/html

# Todo el contenedor (PHP-FPM, artisan, composer) corre como www-data:
# un solo usuario, sin choques de permisos, y nunca como root
USER www-data
