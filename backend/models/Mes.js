const mongoose = require("mongoose");

const MesSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  fechaInicio: { type: Date, required: true },
  fechaFin: { type: Date, required: true },
  ingresos: [{
    concepto: String,
    monto: Number,
    fecha: { type: Date, default: Date.now }
  }],
  ingreso: { type: Number, default: 0 }, // Mantenemos esto por compatibilidad
  anio: { type: Number, required: true },
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
  portafolios: [{ type: mongoose.Schema.Types.ObjectId, ref: "Portafolio" }],
});

// Middleware para calcular el total
MesSchema.pre('save', function(next) {
  this.ingreso = this.ingresos.reduce((total, ingreso) => total + ingreso.monto, 0);
  next();
});

module.exports = mongoose.model("Mes", MesSchema);
