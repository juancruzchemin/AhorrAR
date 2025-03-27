const mongoose = require("mongoose");

const MesSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  fechaInicio: { type: Date, required: true },
  fechaFin: { type: Date, required: true },
  ingreso: { type: Number, default: 0 },
  anio: { type: Number, required: true }, // Año del mes
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true }, // Usuario que creó el mes
  portafolios: [{ type: mongoose.Schema.Types.ObjectId, ref: "Portafolio" }], // Array de portafolios
});

module.exports = mongoose.model("Mes", MesSchema);
