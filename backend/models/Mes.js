// models/Mes.js
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
  ingreso: { type: Number, default: 0 }, // Total de ingresos (calculado)
  totalAsignado: { type: Number, default: 0 }, // Nuevo campo
  disponible: { type: Number, default: 0 }, // Nuevo campo
  anio: { type: Number, required: true },
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
  portafolios: [{ type: mongoose.Schema.Types.ObjectId, ref: "Portafolio" }],
  asignacionesIngresos: [{  // Para mantener compatibilidad
    portafolioId: { type: mongoose.Schema.Types.ObjectId, ref: "Portafolio" },
    monto: Number
  }]
});

// Middleware para calcular los totales
MesSchema.pre('save', function(next) {
  // Calcular total de ingresos
  this.ingreso = this.ingresos.reduce((total, ingreso) => total + (ingreso.monto || 0), 0);
  
  // Calcular total asignado (suma de asignacionesIngresos)
  this.totalAsignado = this.asignacionesIngresos.reduce((total, asignacion) => 
    total + (asignacion.monto || 0), 0);
  
  // Calcular disponible
  this.disponible = this.ingreso - this.totalAsignado;
  
  next();
});

module.exports = mongoose.model("Mes", MesSchema);