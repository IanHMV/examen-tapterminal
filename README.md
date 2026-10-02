# Examen TAP Terminal — Sistema de Gestión

Sistema web desarrollado para el examen de admisión del Área de Desarrollo de TAP Terminal.

## Stack

| Capa              | Tecnología                             |
|-------------------|----------------------------------------|
| Backend           | Laravel 11 · PHP 8.2                   |
| Frontend          | Angular 19 · TypeScript 5              |
| Base de datos     | MongoDB 8.0 (GridFS para las fotos)    |
| Documentación API | Swagger (OpenAPI 3) · Postman          |
| Pruebas           | PHPUnit 11 · Jasmine + Karma           |
| Infraestructura   | Docker · Docker Compose · Nginx        |
| CI/CD             | GitHub Actions                         |

## Estructura

```
.
├── backend/    # API REST (Laravel 11) y sus pruebas (PHPUnit)
├── frontend/   # SPA (Angular 19) y sus pruebas (Jasmine + Karma)
├── docker/     # Dockerfiles y configuración de Nginx
├── postman/    # Colección y entornos de Postman
├── scripts/    # deploy.sh: despliegue en el VPS
└── .github/    # Workflows de GitHub Actions (CI/CD)
```

## Convenciones

- Commits: [Conventional Commits](https://www.conventionalcommits.org/es/v1.0.0/)
- PHP: PSR-12 · Angular: guía de estilo oficial
- Flujo Git: GitHub Flow (una rama por ticket → Pull Request → `main`)

## Demo

- Aplicación: https://ianmartinez.dev/examen-tapterminal/
- Documentación de la API (Swagger): https://ianmartinez.dev/examen-tapterminal/api/documentation
- Colección de Postman: [`postman/`](postman/) (ver [Postman](#postman))

## Requisitos del examen

| Requisito | Cómo se cumple |
|---|---|
| Productos: código automático, nombre, marca, precio (máx. 3 dígitos) y fecha; tabla con ver, editar y eliminar | Pantalla "Productos" y `/api/v1/products`. Código atómico `PRD-0001`, precio de 0.01 a 999.99 en `Decimal128` |
| Usuarios: código, nombre, foto (requerida), usuario = correo único, teléfono opcional con lada; el detalle muestra sus perfiles | Pantalla "Usuarios" y `/api/v1/users`. Foto en GridFS, teléfono en formato E.164 |
| Perfiles: código, nombre y fecha; detalle en ventana modal con sus secciones | Pantalla "Perfiles" (modal) y `/api/v1/profiles` |
| Exportar cada listado a PDF y Excel, con fechas DD/MM/YYYY HH:MM | Botones en cada listado y `GET /api/v1/{listado}/export?format=xlsx\|pdf` |
| Iniciar y cerrar sesión | Laravel Sanctum (tokens Bearer que vencen en 8 horas) |
| Recuperar la contraseña por correo | Enlace de un solo uso (60 minutos) y correo de bienvenida a los usuarios nuevos |
| Acceso solo a las secciones de los perfiles del usuario | Middleware en la API (403), y menú y guard en Angular |
| Contraseñas cifradas y validación de formularios | bcrypt; validación en Laravel (`FormRequest`) y en Angular, con mensajes en español |
| Bitácora: guardar el dato anterior para compararlo con el actual | Pantalla "Bitácora" con comparación campo por campo (`audit_logs`) |
| Laravel 11 + PHP 8.2, Angular 19 + TypeScript 5, MongoDB, Swagger/Postman, Git, PSR-12 | Ver [Stack](#stack). Pint revisa PSR-12 en cada PR |
| Extras: pruebas y CI/CD | 38 pruebas de la API, 142 de Angular, GitHub Actions y despliegue automático |

## Cómo ejecutarlo en local

Requisitos: Docker Desktop, Node.js 20 o superior y Git.

```bash
git clone https://github.com/IanHMV/examen-tapterminal.git
cd examen-tapterminal

# 1. Variables de entorno (los .env no están en Git)
cp .env.example .env                  # contraseñas de MongoDB: cámbialas
cp backend/.env.example backend/.env  # usa la misma clave de app_user en MONGODB_URI y define ADMIN_EMAIL y ADMIN_PASSWORD

# 2. API, MongoDB y Mailpit
docker compose up -d
docker compose exec api composer install
docker compose exec api php artisan key:generate
docker compose exec api php artisan migrate
docker compose exec api php artisan db:seed   # perfiles, productos de ejemplo y el administrador

# 3. Angular
cd frontend
npm ci
npm start
```

| Servicio | Dirección |
|---|---|
| Aplicación (inicia sesión con `ADMIN_EMAIL` y `ADMIN_PASSWORD`) | http://localhost:4200 |
| API | http://localhost:8000/api/v1 |
| Swagger | http://localhost:8000/api/documentation |
| Mailpit (correos de desarrollo) | http://localhost:8025 |

Para probar la versión de producción en tu equipo, crea `backend/.env.production` a partir de
`backend/.env.production.example` y ejecuta `docker compose -f docker-compose.prod.yml up -d --build`.
Queda en http://localhost:8090/examen-tapterminal/.

## Postman

1. Importa en Postman los 3 archivos de [`postman/`](postman/): la colección y los entornos "Local" y "Producción".
2. Elige el entorno y escribe tu correo y contraseña en las variables `email` y `password`.
3. Ejecuta "Sesión → Iniciar sesión". El token se guarda solo y las demás peticiones lo envían como
   `Authorization: Bearer {{token}}`.

- Las 30 rutas están organizadas por sección. Cada una trae ejemplos de respuesta (pestaña "Examples") y
  pruebas (pestaña "Tests").
- "Run collection" recorre todo de principio a fin: crea, consulta, edita, exporta y elimina un registro de
  cada tipo, porque cada alta guarda su código en una variable.
- "Pedir un enlace" envía un correo real al usuario con el que iniciaste sesión.
- Las exportaciones se descargan con "Send and Download".
- La colección se generó a partir de la especificación OpenAPI, así que coincide con Swagger.

## Decisiones técnicas

### Laravel 11 sin soporte de seguridad (avisos aceptados)

El examen exige Laravel 11, que dejó de recibir parches de seguridad en marzo de 2026.
Composer 2.10 bloquea versiones con avisos conocidos, así que se ignoran **solo** los que
afectan a la última 11.x (`backend/composer.json` → `config.policy.advisories.ignore-id`).
Cualquier aviso nuevo, en cualquier paquete, sigue bloqueando la instalación.

### Autenticación (Laravel Sanctum)

- **Tokens Bearer, no cookies:** `POST /api/v1/auth/login` devuelve un token que se envía en
  `Authorization: Bearer <token>`. La API no guarda sesiones y el mismo token sirve en Swagger
  ("Authorize") y Postman. Todas las rutas lo exigen, salvo el healthcheck, el login y la recuperación
  de contraseña.
- **Vencimiento automático:** el token dura 8 horas (`SANCTUM_EXPIRATION`). Un índice TTL de MongoDB
  sobre `expires_at` borra los tokens vencidos sin tareas programadas. Cerrar sesión revoca el token.
- **Login difícil de atacar:** máximo 5 intentos por minuto por correo e IP (429), el mismo mensaje
  para correo inexistente o contraseña incorrecta, y la contraseña se compara siempre (aunque el
  correo no exista) para que el tiempo de respuesta no revele qué correos están registrados.
- **Fotos con URL firmada:** `<img>` no puede enviar el token, así que la API entrega la foto con una
  URL firmada que vence en 1 a 2 horas. Sin la firma, o con la URL alterada, responde 403.
- **En Angular:** el token se guarda en `localStorage` y un interceptor lo agrega **solo** a las
  peticiones a la API. Si la API responde 401, se cierra la sesión y se vuelve al login recordando la
  pantalla (solo se aceptan rutas internas como destino).

### Recuperación de contraseña y correo de bienvenida

- **Enlace de un solo uso, nunca una contraseña por correo:** "¿Olvidaste tu contraseña?" envía un
  enlace que vence en 60 minutos y abre una pantalla para elegir una contraseña nueva. Así lo recomienda
  OWASP: la contraseña no queda guardada en el buzón y la actual sigue sirviendo hasta que se usa el
  enlace. Es la interpretación de "enviar credenciales al correo registrado": el correo lleva el
  usuario y el medio para entrar.
- **Bienvenida:** el alta de usuarios no tiene contraseña, así que el usuario nuevo recibe un correo con
  su usuario y un enlace (el mismo mecanismo) para elegir la suya.
- **Correo no registrado:** `POST /api/v1/auth/forgot-password` responde 422 "Usuario no encontrado, no es
  posible enviar el correo", para que el usuario sepa si escribió mal su correo. Es una decisión de
  usabilidad: a cambio, la API revela qué correos están registrados, y el límite de 5 solicitudes por minuto
  por IP frena a quien intente probar muchos. Si ese correo ya pidió un enlace hace menos de un minuto,
  responde 429. El correo se envía después de responder (`defer`): la respuesta no espera al servidor de correo.
- **Enlace inválido sin detalles:** un enlace vencido, ya usado o de otro correo recibe el mismo mensaje.
- **El token no queda en los registros:** va después de `#` en el enlace
  (`/restablecer-contrasena?email=…#token`) y el navegador nunca envía esa parte al servidor (Nginx,
  Cloudflare). En MongoDB solo se guarda su hash bcrypt.
- **Límites:** máximo 5 solicitudes por minuto desde cada IP (429) y un enlace por minuto para cada correo.
- **Al cambiar la contraseña se cierran todas las sesiones** del usuario: si alguien tenía un token, deja
  de servir.
- **Contraseña nueva:** de 8 a 72 caracteres (bcrypt ignora lo que pasa de 72 bytes), con al menos una
  letra y un número. Laravel (`ResetPasswordRequest`) y Angular aplican la misma regla.
- **Servidor de correo:** en desarrollo, Mailpit atrapa los correos y los muestra en
  http://localhost:8025 (no salen a internet); en producción, Gmail por SMTP con contraseña de aplicación.

### Permisos por sección

- **Requisito:** cada usuario solo entra a las secciones que tienen sus perfiles (la suma de todas).
- **La API es la que protege:** un middleware (`section:products`, `section:users,profiles`) responde
  403 en cada ruta si el usuario no tiene la sección, aunque alguien llame a la API sin pasar por Angular.
- **Angular acompaña:** el menú muestra solo las secciones permitidas, un guard bloquea las pantallas
  que no le tocan ("Sin acceso") y, si un administrador le cambia los perfiles mientras tiene la sesión
  abierta, el siguiente 403 actualiza su menú.
- **Nadie puede borrarse a sí mismo** (409): evita quedarse sin sesión o sin administrador.

### Bitácora del sistema

- **Requisito:** guardar el dato anterior para compararlo con el actual. Cada alta, edición y eliminación
  de productos, perfiles y usuarios guarda el antes, el después y la lista de campos que cambiaron.
- **Automática:** el trait `App\Models\Concerns\Auditable` escucha los eventos de Eloquent (`created`,
  `updated`, `deleted`). Ningún controlador tiene que acordarse de escribir en la bitácora, y cada modelo
  declara qué campos se guardan (`auditedAttributes()`). En el evento `updated` Laravel todavía conserva
  el valor anterior (`getOriginal()`), así que no hace falta otra consulta. Guardar sin cambios no se registra.
- **Nunca guarda contraseñas:** de los campos ocultos del modelo (`$hidden`) solo se anota que cambiaron;
  ni la contraseña ni su hash llegan a la bitácora.
- **Quien hace las consultas** el registro guarda una copia del código y el nombre del usuario y la IP. Si
  después ese usuario cambia de nombre o se borra, la bitácora sigue diciendo quién fue. Los datos iniciales
  (`db:seed`) aparecen como "Sistema", y quien cambia su contraseña con el enlace del correo, como autor.
- **Solo lectura:** la API solo ofrece `GET /api/v1/audit-logs` (sección Bitácora) y el modelo cancela
  cualquier intento de editar o borrar un registro. No tiene índice TTL: el historial se conserva completo.
- **Limitación conocida:** MongoDB sin réplicas no admite transacciones entre documentos, así que el
  registro se escribe justo después del cambio, no en la misma operación. Las actualizaciones masivas
  (`Model::where(...)->update()`) no disparan eventos; la API no las usa.
- **En Angular:** la pantalla "Bitácora" filtra por entidad y código (los filtros viven en la URL, igual
  que la página) y una ventana modal compara campo por campo el antes y el después, resaltando lo que cambió.

### Exportación a Excel y PDF

- **Requisito:** cada listado (productos, usuarios, perfiles y bitácora) se exporta a Excel y PDF, con las
  fechas en formato DD/MM/YYYY HH:MM.
- **Los genera la API, con todos los registros:** `GET /api/v1/{listado}/export?format=xlsx|pdf` (la bitácora
  acepta además sus filtros). Así el archivo trae todo, no solo la página que se ve, y la ruta exige la
  misma sección que el listado (403 sin ella). También se puede descargar desde Swagger o Postman.
- **Cada listado describe sus columnas** en una clase de `app/Exports` (interfaz `TableExport`) y
  `App\Support\TableExporter` escribe el archivo. Agregar otro listado es una clase de unas 20 líneas.
- **Excel con OpenSpout:** se escribe fila por fila directo a la respuesta, sin cargar todos los documentos en
  memoria (`cursor()`). Las fechas y los precios quedan como fecha y número, así se pueden ordenar y sumar.
- **PDF con dompdf:** una vista Blade (`resources/views/exports/table.blade.php`) en hoja carta horizontal,
  con los encabezados repetidos en cada página y "Página X de Y". Blade escapa cada valor (un nombre con
  HTML no se interpreta), las imágenes remotas están desactivadas y solo se incrustan las letras que se
  usan (unos 25 KB por archivo en lugar de 900 KB).
- **Fechas en la hora de quien descarga:** Angular envía la zona horaria del navegador (`timezone`) y la API
  convierte las fechas, que MongoDB guarda en UTC.
- **Descarga con token:** un enlace normal no puede enviar el encabezado `Authorization`, así que Angular pide
  el archivo con `HttpClient` y lo guarda desde el navegador. La API expone `Content-Disposition` por CORS
  para que se conserve el nombre del archivo (`productos-2026-10-02-1534.xlsx`).
- **Dependencias** (las versiones más recientes compatibles con PHP 8.2, sin avisos de seguridad):
  `openspout/openspout` 4.28 y `barryvdh/laravel-dompdf` 3.1 (dompdf 3.1).

### Pruebas automáticas

| Parte | Herramienta | Pruebas | Comando |
|---|---|---|---|
| API | PHPUnit 11 | 38 | `docker compose exec api php artisan test` |
| Angular | Jasmine + Karma | 142 | `cd frontend && npm test -- --watch=false --browsers=ChromeHeadless` |

- **La API se prueba de punta a punta:** cada prueba hace peticiones HTTP reales a Laravel contra un
  MongoDB real, sin simular la base de datos. Cubren las reglas del examen y los errores que ya ocurrieron
  una vez (regresiones):
  - 401 en JSON aunque la petición no pida JSON;
  - 403 sin la sección y 409 al borrarse a sí mismo o al borrar un perfil asignado;
  - clave duplicada de MongoDB → 409;
  - nombre de perfil y correo únicos sin distinguir mayúsculas;
  - foto con URL firmada y límite de intentos del login;
  - recuperación de contraseña, bitácora (sin contraseñas, de solo lectura) y exportaciones con fechas
    en hora local.
- **Base de datos propia:** el servicio `mongo-test` de Docker guarda los datos en memoria y
  `phpunit.xml` apunta a la base `examen_tapterminal_test`. Antes de cada prueba se vacían los documentos
  (MongoDB sin réplicas no tiene transacciones, así que no sirve `RefreshDatabase` de Laravel), y una
  protección detiene las pruebas si la base no termina en `_test`.
- **Cada prueba se comprobó con una mutación:** se rompió a propósito el código que protege
  (por ejemplo, quitar el arreglo del 401) y se verificó que al menos una prueba fallara.

### Integración y despliegue continuos (GitHub Actions)

```text
PR ─────────► CI: API (Pint, Swagger, PHPUnit + MongoDB) · Angular (pruebas, build) · imágenes de producción
   └────────► Título del PR (Conventional Commits)
fusión a main ─► CI ─(si pasa)─► Despliegue: SSH al VPS → scripts/deploy.sh → verificación pública
```

- **CI en cada PR y en cada fusión a `main`** (`.github/workflows/ci.yml`): las mismas versiones que Docker
  (PHP 8.2 con la extensión mongodb 2.5.3, Node 22) y un MongoDB de servicio para las pruebas. También
  construye las imágenes de producción: un error en un Dockerfile aparece en el PR, no en el servidor.
- **Título del PR** (`pr-title.yml`): al fusionar con squash, el título se convierte en el commit de `main`,
  así que debe seguir Conventional Commits. El título se lee desde una variable de entorno y no dentro del
  script, para que un título malicioso no pueda ejecutar comandos.
- **Despliegue automático** (`deploy.yml`): cuando el CI de `main` termina bien (o a mano, con "Run workflow"),
  se conecta al VPS por SSH y ejecuta `scripts/deploy.sh`. Ese script:
  - trae el código solo si avanza en línea recta (si alguien cambió archivos en el servidor, se detiene);
  - construye las imágenes de una en una, porque el VPS tiene 2 GB de RAM;
  - reinicia los contenedores, aplica migraciones y datos iniciales, y borra las imágenes viejas.

  Al final, el workflow comprueba el healthcheck público y que la API responda 401 sin token.
- **Una llave que solo sirve para desplegar:** en `authorized_keys` la llave de GitHub tiene un comando
  forzado y `restrict`, así que solo puede ejecutar el script (sin terminal ni túneles). La huella del
  servidor está fijada en `VPS_KNOWN_HOSTS`, así que SSH no se conecta a un servidor que se haga pasar por el VPS.
- **Configuración (una sola vez):**
  1. En el VPS: `ssh-keygen -t ed25519 -N "" -C github-actions -f ~/.ssh/github_deploy`.
  2. Agrega a `~/.ssh/authorized_keys` la línea
     `restrict,command="bash /home/ian/apps/examen-tapterminal/scripts/deploy.sh" ` seguida del contenido de
     `~/.ssh/github_deploy.pub`.
  3. En GitHub (Settings → Secrets and variables → Actions) crea `VPS_HOST` (IP del VPS), `VPS_USER` (`ian`),
     `VPS_SSH_KEY` (contenido de `~/.ssh/github_deploy`) y `VPS_KNOWN_HOSTS`
     (salida de `awk -v ip=IP_DEL_VPS '{print ip, $1, $2}' /etc/ssh/ssh_host_ed25519_key.pub`).
  4. Borra la llave privada del VPS (`rm ~/.ssh/github_deploy`): solo GitHub la necesita.

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
- **Puede haber huecos en los códigos:** si un alta falla después de pedir el número (por ejemplo, por
  una clave duplicada), ese número se pierde, como en las secuencias de SQL. Nunca hay códigos repetidos.
- **`code` fuera de `$fillable`:** el cliente no puede asignarlo ni falsificarlo.
- **Borrado físico:** eliminar quita el documento de MongoDB (`DELETE` → 204) y no se puede deshacer;
  por eso la interfaz pide confirmación. El contador no retrocede: el código borrado no se reutiliza.
- **Búsqueda por código:** el detalle usa el código en la URL (`/api/v1/products/PRD-0001`), que es
  único, inmutable y tiene índice. El listado ordena por `created_at` (también con índice).
- **Precio en `Decimal128`:** decimal exacto, sin los errores de redondeo de `float`. La API lo
  entrega como texto con 2 decimales (`"289.00"`).
- **"Precio máximo 3 dígitos"** se interpreta como hasta 3 dígitos enteros y 2 decimales
  (de 0.01 a 999.99). Laravel (`StoreProductRequest`) y Angular aplican la misma regla.

```js
// Colección "profiles"
{
  _id: ObjectId("66fb6a1e9c1d4b0012a3b4c6"),
  code: "PRF-0001",                                       // índice único
  name: "Administrador",                                  // índice único sin distinguir mayúsculas
  sections: ["products", "users", "profiles", "audit_log"],
  created_at: ISODate("2026-10-01T18:30:00Z"),
  updated_at: ISODate("2026-10-01T18:30:00Z")
}
```

- **Secciones embebidas en el perfil:**  siempre se leen junto con el perfil y no existen
  por sí solas, así que se guardan como un arreglo de claves dentro del mismo documento (sin
  "tabla intermedia"). El catálogo es un enum de PHP (`App\Enums\Section`) porque cada sección
  corresponde a pantallas reales; la API lo expone en `GET /api/v1/sections`.
- **Nombre de perfil único sin distinguir mayúsculas:** índice con *collation*
  `{ locale: "es", strength: 2 }` y la validación `unique` de laravel-mongodb (registrada en
  `bootstrap/providers.php`), que aplican la misma regla. Si dos altas simultáneas pasan la
  validación, el índice rechaza la segunda y la API responde 409 en lugar de 500. En una prueba
  con 12 altas simultáneas del mismo nombre se creó exactamente un perfil.

```js
// Colección "users"
{
  _id: ObjectId("66fb6a1e9c1d4b0012a3b4c7"),
  code: "USR-0001",                                  // índice único
  name: "Ana López",
  email: "ana.lopez@tapterminal.com",                // índice único; siempre en minúsculas
  phone: "+523141234567",                            // opcional, formato internacional E.164
  password: "$2y$12$…",                              // bcrypt; nunca sale de la API
  photo_id: "66fb6a1e9c1d4b0012a3b4c8",              // archivo en GridFS (bucket "photos")
  profile_codes: ["PRF-0002"],                       // índice multikey
  created_at: ISODate("2026-10-01T18:30:00Z"),
  updated_at: ISODate("2026-10-01T18:30:00Z")
}
```

- **Perfiles por referencia, no copiados:** el usuario guarda los códigos de sus perfiles (únicos e
  inmutables). Si un perfil cambia de nombre o de secciones, el usuario lo ve al instante. Un índice
  multikey sobre `profile_codes` permite saber qué usuarios tienen un perfil; por eso la API responde
  409 si se intenta borrar un perfil asignado.
- **Fotos en GridFS:** el sistema de archivos de MongoDB guarda cada imagen en `photos.files` (datos)
  y `photos.chunks` (contenido en trozos). Las fotos viven en la misma base de datos que el resto:
  un solo respaldo y sin volúmenes extra en Docker. La API las sirve en `GET /users/{code}/photo`;
  la URL lleva `?v=<id de la foto>`, así que cambia cuando cambia la foto y se puede guardar en caché.
  Solo se aceptan JPG, PNG o WebP de hasta 2 MB, revisando el contenido real del archivo (SVG no:
  puede llevar JavaScript).
- **El usuario elige su contraseña:** el alta del examen no tiene contraseña. La API guarda una
  aleatoria cifrada que nadie conoce y le envía al usuario un correo con un enlace para elegir la suya.
  El administrador inicial se crea con `ADMIN_EMAIL` y `ADMIN_PASSWORD` del `.env`.
- **Datos normalizados antes de validar:** el correo se guarda en minúsculas y el teléfono sin
  espacios (`+52 (314) 123-4567` → `+523141234567`), así no hay duplicados por formato.

```js
// Colección "password_reset_tokens": enlaces para elegir contraseña (recuperación y bienvenida)
{
  _id: ObjectId("66fb6a1e9c1d4b0012a3b4c9"),
  email: "ana.lopez@tapterminal.com",          // índice único: un enlace vigente por correo
  token: "$2y$12$…",                            // hash bcrypt; el token en claro solo va en el correo
  created_at: ISODate("2026-10-02T18:30:00Z")  // índice TTL: MongoDB lo borra a los 60 minutos
}
```

- **Lo administra el broker de contraseñas de Laravel** (`Password::sendResetLink` y `Password::reset`),
  que funciona tal cual con laravel-mongodb: las fechas se guardan como `Date` de MongoDB y el índice TTL
  borra los enlaces vencidos sin tareas programadas. Pedir otro enlace reemplaza al anterior.

```js
// Colección "audit_logs": bitácora de cambios
{
  _id: ObjectId("66fd1a2b9c1d4b0012a3b4d0"),
  entity: "products",                                   // products, profiles o users
  entity_code: "PRD-0001",
  action: "updated",                                    // created, updated o deleted
  before: { name: "Casco de seguridad tipo I", brand: "3M", price: "289.00" },  // null en un alta
  after:  { name: "Casco de seguridad tipo I", brand: "3M", price: "310.00" },  // null en una eliminación
  changed_fields: ["price"],
  user: { code: "USR-0001", name: "Administrador" },    // copia; null = el sistema
  ip: "203.0.113.7",
  created_at: ISODate("2026-10-02T18:30:00Z")
}
```

- **Documentos embebidos:** el antes y el después son subdocumentos con la forma de cada entidad, algo
  natural en MongoDB. En SQL harían falta una fila por campo o columnas de texto con JSON.
- **Índices para cada consulta de la pantalla:** `created_at` (listado completo, del más reciente al más
  antiguo), `{ entity, created_at }` (filtro por entidad) y `{ entity_code, created_at }` (historial de un
  registro). El código lleva el prefijo de su entidad (`PRD-`, `PRF-`, `USR-`), así que solo él ya
  identifica al registro.

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
| TICK-17 | 2026-10-01 | Perfiles y secciones: CRUD completo, detalle en ventana modal, nombre único sin distinguir mayúsculas y estilos compartidos. | [#18](https://github.com/IanHMV/examen-tapterminal/pull/18) |
| TICK-18 | 2026-10-01 | Usuarios: CRUD completo, foto de perfil en GridFS, teléfono con lada, perfiles asignados y administrador inicial. | [#19](https://github.com/IanHMV/examen-tapterminal/pull/19) |
| TICK-19 | 2026-10-02 | Inicio y cierre de sesión con Laravel Sanctum: tokens con vencimiento (TTL), límite de intentos, rutas protegidas y fotos con URL firmada. | [#20](https://github.com/IanHMV/examen-tapterminal/pull/20), [#21](https://github.com/IanHMV/examen-tapterminal/pull/21) |
| TICK-20 | 2026-10-02 | Permisos por sección: middleware en la API (403), menú y guard en Angular según los perfiles del usuario. | [#22](https://github.com/IanHMV/examen-tapterminal/pull/22) |
| TICK-21 | 2026-10-02 | Recuperación de contraseña y correo de bienvenida con enlace de un solo uso (60 min), Mailpit en desarrollo y Gmail en producción. | [#23](https://github.com/IanHMV/examen-tapterminal/pull/23) |
| TICK-22 | 2026-10-02 | Bitácora del sistema: cada alta, edición y eliminación guarda el dato anterior y el actual; consulta con filtros y comparación campo por campo. | [#24](https://github.com/IanHMV/examen-tapterminal/pull/24) |
| TICK-23 | 2026-10-02 | Exportación de cada listado a Excel y PDF desde la API (todos los registros, fechas DD/MM/YYYY HH:MM en la hora local) y botones en Angular. | [#25](https://github.com/IanHMV/examen-tapterminal/pull/25) |
| TICK-24 | 2026-10-02 | Pruebas de la API con PHPUnit contra un MongoDB desechable: reglas del examen, seguridad y regresiones. | [#26](https://github.com/IanHMV/examen-tapterminal/pull/26) |
| TICK-25 | 2026-10-02 | CI/CD con GitHub Actions: pruebas, PSR-12, Swagger e imágenes en cada PR, validación del título y despliegue automático al VPS. | [#27](https://github.com/IanHMV/examen-tapterminal/pull/27) |
| TICK-26 | 2026-10-02 | Colección de Postman (30 rutas, ejemplos y pruebas) generada desde OpenAPI, guía para ejecutarlo en local y verificación final. | [#28](https://github.com/IanHMV/examen-tapterminal/pull/28) |
