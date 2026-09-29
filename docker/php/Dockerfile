
# Imagen de Desarrollo backend (Laravel 11 · PHP 8.2)
# ------------------------------------------------------------------
FROM php:8.2-fpm-bookworm

# Paquetes del sistema y extensiones de PHP:
#   - unzip + libzip-dev + ext zip: Composer descarga las dependencias como .zip
#   - opcache: guarda el PHP ya compilado
# Se limpia la caché de apt en el RUN para que pese menos.
RUN apt-get update \
    && apt-get install -y --no-install-recommends unzip libzip-dev \
    && docker-php-ext-install zip opcache \
    && rm -rf /var/lib/apt/lists/*

# Composer: copiamos solo el ejecutable desde su imagen oficial
COPY --from=composer:2.10 /usr/bin/composer /usr/bin/composer

# Composer guarda su caché aquí (www-data no puede escribir en /var/www)
ENV COMPOSER_HOME=/tmp/composer

WORKDIR /var/www/html

# Todo el contenedor (PHP-FPM, artisan, composer) corre como www-data:
# un solo usuario, sin choques de permisos, y nunca como root
USER www-data
