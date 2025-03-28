// models/Portafolio.js
const mongoose = require('mongoose');

const CategoriaSchema = new mongoose.Schema({
  nombre: { type: String, required: true }, // Nombre de la categoría
  porcentaje: { type: Number, default: 0 }, // Porcentaje asignado a la categoría
  monto: { type: Number, default: 0 } // Monto calculado basado en el porcentaje
});


const PortafolioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  tipo: [{ type: String }], // Array de tipos (principal/personal/compartido)
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }], // Referencia a los administradores
  mes: { type: String, required: true }, // Mes
  inicio: { type: Date, required: true }, // Fecha de inicio
  fin: { type: Date, required: true }, // Fecha de fin
  monto: { type: Number, required: false, default: 0 }, // Monto total
  montoAsignado: { type: Number, required: false, default: 0 }, // Monto asignado
  totalGastado: { type: Number, required: false, default: 0 }, // Monto total gastado
  usuarios: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }], // Referencia a los usuarios
  movimientos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movimiento' }], // Referencia a los movimientos
  wallet: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet' }, // Referencia a la wallet
  categorias: [CategoriaSchema] // Array de categorías
});

module.exports = mongoose.model('Portafolio', PortafolioSchema);
