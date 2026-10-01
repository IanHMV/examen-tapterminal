// Se ejecuta UNA sola vez: la primera vez que arranca MongoDB con el volumen vacío.
// Crea el usuario que usará Laravel, con permisos SOLO sobre su base de datos
// (principio de mínimo privilegio: la app nunca usa el usuario root).
const database = process.env.MONGO_INITDB_DATABASE;

db.getSiblingDB(database).createUser({
  user: process.env.MONGO_APP_USERNAME,
  pwd: process.env.MONGO_APP_PASSWORD,
  roles: [{ role: 'readWrite', db: database }],
});
