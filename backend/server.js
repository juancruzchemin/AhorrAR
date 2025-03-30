require('dotenv').config();
const app = require('./app');
const PORT = process.env.PORT || 5000;

// Iniciar el servidor
const server = app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
  console.error('Error no capturado:', err);
  server.close(() => process.exit(1));
});

// Manejo de señales de terminación
process.on('SIGTERM', () => {
  console.log('Recibida señal SIGTERM. Cerrando servidor...');
  server.close(() => {
    console.log('Servidor cerrado');
    process.exit(0);
  });
});