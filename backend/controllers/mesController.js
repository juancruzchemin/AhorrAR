const Mes = require("../models/Mes");

// Función para obtener los datos del mes actual
const obtenerMesActual = (usuarioId) => {
  const fechaActual = new Date();
  const nombreMes = fechaActual.toLocaleString("es-ES", { month: "long" });
  const primerDia = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
  const ultimoDia = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0);
  const anioActual = fechaActual.getFullYear();

  return {
    nombre: nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1),
    fechaInicio: primerDia,
    fechaFin: ultimoDia,
    ingreso: 0,
    anio: anioActual,
    usuario: usuarioId,
    portafolios: [],
  };
};

// Función para crear el mes automáticamente si no existe
const crearMesAutomatico = async (req, res) => {
  try {
    const usuarioId = req.user.id; // Obtener usuario autenticado (desde middleware de autenticación)
    const { nombre, fechaInicio, fechaFin, ingreso, anio, usuario } = obtenerMesActual(usuarioId);

    // Verificar si ya existe el mes del usuario en este año
    const mesExistente = await Mes.findOne({ nombre, anio, usuario });

    if (mesExistente) {
      return res.status(200).json({ message: "El mes actual ya existe.", mes: mesExistente });
    }

    // Si no existe, crearlo
    const nuevoMes = new Mes({ nombre, fechaInicio, fechaFin, ingreso, anio, usuario });
    await nuevoMes.save();

    res.status(201).json({ message: "Mes creado automáticamente.", mes: nuevoMes });
  } catch (error) {
    console.error("Error al crear el mes automáticamente:", error);
    res.status(500).json({ error: "Error al crear el mes." });
  }
};

// Obtener los meses del usuario autenticado
const obtenerMeses = async (req, res) => {
  try {
    const usuarioId = req.user.id; // Obtener usuario autenticado
    const meses = await Mes.find({ usuario: usuarioId }).sort({ anio: -1, fechaInicio: -1 });

    res.status(200).json(meses);
  } catch (error) {
    console.error("Error al obtener los meses:", error);
    res.status(500).json({ error: "Error al obtener los meses." });
  }
};

module.exports = {
  crearMesAutomatico,
  obtenerMeses,
};
