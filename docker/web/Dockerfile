# ==================================================================
# Imagen de Produccion del frontend: Angular compilado + Nginx.
# ==================================================================

# ---------- Compilar Angular ----------
FROM node:22-alpine AS build

WORKDIR /app

# Primero solo package.json/lock
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY frontend/ ./
RUN npm run build

# ---------- Servir los archivos con Nginx ----------
# La imagen final NO contiene Node ni el código fuente: solo HTML, CSS y JS.
FROM nginx:1.30-alpine

COPY docker/web/default.conf /etc/nginx/conf.d/default.conf


RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html/examen-tapterminal
