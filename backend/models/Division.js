// models/Division.js
const mongoose = require('mongoose');

const DivisionSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  monto: { type: Number, required: true },
  porcentaje: { type: Number, required: true }, // Porcentaje
  wallet: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet' } // Referencia a la wallet
});

module.exports = mongoose.model('Division', DivisionSchema);
