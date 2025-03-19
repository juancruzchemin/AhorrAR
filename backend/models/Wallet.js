// models/Wallet.js
const mongoose = require('mongoose');

const WalletSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  categoria: { type: String, required: true }, // División
  total: { type: Number, required: true },
  totalGasto: { type: Number, default: 0 }, // Total gastado
  totalDisponible: { type: Number, default: 0 }, // Total disponible
  portafolio: { type: mongoose.Schema.Types.ObjectId, ref: 'Portafolio' } // Referencia al portafolio
});

module.exports = mongoose.model('Wallet', WalletSchema);
