// models/Movimiento.js
const mongoose = require('mongoose');

const MovimientoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  categoria: [{ type: String }], // Array de categorías
  monto: { type: Number, required: true },
  fecha: { type: Date, default: Date.now },
  fijo: { type: Boolean, default: false }, // Indica si es un gasto fijo
  tipo: { type: String, enum: ['gasto', 'ingreso'], required: true }, // Nuevo campo para tipo de movimiento
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true }, // Referencia al modelo Usuario
  portafolio: { type: mongoose.Schema.Types.ObjectId, ref: 'Portafolio' } // Referencia al modelo Portafolio
});

module.exports = mongoose.model('Movimiento', MovimientoSchema);
