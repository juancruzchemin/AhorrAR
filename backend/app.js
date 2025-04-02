const express = require('express');
const cors = require('cors');
const corsOptions = require('./config/cors');
const connectDB = require('./config/db');

// Importar rutas
const usuariosRouter = require('./routes/usuarios.js');
const portafoliosRouter = require('./routes/portafolios.js');
const categoriasRouter = require('./routes/categorias.js');
const movimientosRouter = require('./routes/movimientos.js');
const inversionesRouter = require('./routes/inversiones.js');
const mesesRouter = require('./routes/meses.js');

const app = express();

// Conexión a la base de datos
connectDB();

// Middlewares
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// Headers adicionales
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

// Rutas
app.use('/api/usuarios', usuariosRouter);
app.use('/api/portafolios', portafoliosRouter);
// app.use('/api/categorias', categoriasRouter);
app.use('/api/movimientos', movimientosRouter);
app.use('/api/inversiones', inversionesRouter);
app.use('/api/mes', mesesRouter);

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo salió mal!' });
});

module.exports = app;