const mongoose = require("mongoose");

const InversionSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  montoActual: { type: Number, required: true },
  precioCompra: { type: Number, required: true },
  precioActual: { type: Number, required: true },
  fechaCompra: { type: Date, required: true },
  precioVenta: { type: Number },
  fechaVenta: { type: Date },
  categoria: { type: String, required: true },
  subcategoria: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model("Inversion", InversionSchema);
