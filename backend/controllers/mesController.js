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
    console.log("Usuario en request:", req.user); // Debug
    
    if (!req.user?.id) {
      console.error("No hay usuario en request");
      return res.status(401).json({ error: "No autenticado" });
    }

    const meses = await Mes.find({ usuario: req.user.id })
      .sort({ anio: -1, fechaInicio: -1 })
      .lean();

    if (!meses || meses.length === 0) {
      return res.status(404).json({ message: "No se encontraron meses" });
    }

    res.status(200).json(meses);
  } catch (error) {
    console.error("Error completo:", error);
    res.status(500).json({ 
      error: "Error interno del servidor",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener un mes por su ID
const obtenerMesPorId = async (req, res) => {
  try {
    const mes = await Mes.findById(req.params.id);
    if (!mes) {
      return res.status(404).json({ error: "Mes no encontrado" });
    }
    res.status(200).json(mes);
  } catch (error) {
    console.error("Error al obtener el mes:", error);
    res.status(500).json({ error: "Error al obtener el mes." });
  }
};

// Actualizar un mes
const actualizarMes = async (req, res) => {
  try {
    const mesActualizado = await Mes.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.status(200).json(mesActualizado);
  } catch (error) {
    console.error("Error al actualizar el mes:", error);
    res.status(500).json({ error: "Error al actualizar el mes." });
  }
};

// Eliminar un mes
const eliminarMes = async (req, res) => {
  try {
    await Mes.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Mes eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar el mes:", error);
    res.status(500).json({ error: "Error al eliminar el mes." });
  }
};

// No olvides exportar los nuevos métodos
module.exports = {
  crearMesAutomatico,
  obtenerMeses,
  obtenerMesPorId,
  actualizarMes,
  eliminarMes
};
