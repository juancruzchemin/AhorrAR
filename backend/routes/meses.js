const express = require('express');
const router = express.Router();
const Mes = require('../models/Mes');
const authMiddleware = require('../middleware/authMiddleware');
const mongoose = require('mongoose');

// Obtener todos los meses del usuario
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const meses = await Mes.find({ usuario: userId })
      .sort({ anio: -1, fechaInicio: -1 });
    res.json(meses);
  } catch (error) {
    res.status(500).json({ msg: "Error del servidor" });
  }
});

// Obtener meses con autenticación por email/password
router.get('/auth', async (req, res) => {
  try {
    const { email, password } = req.query;
    const usuario = await Usuario.findOne({ email });
    if (!usuario) return res.status(400).json({ msg: "Usuario no encontrado" });
    
    const isMatch = await usuario.comparePassword(password);
    if (!isMatch) return res.status(400).json({ msg: "Credenciales incorrectas" });

    const meses = await Mes.find({ usuario: usuario._id })
      .sort({ anio: -1, fechaInicio: -1 });
    res.json(meses);
  } catch (error) {
    res.status(500).json({ msg: "Error del servidor" });
  }
});

// Obtener mes por ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const mes = await Mes.findById(req.params.id);
    if (!mes) {
      return res.status(404).json({ error: 'Mes no encontrado' });
    }
    
    if (mes.usuario.toString() !== req.user.id) {
      return res.status(403).json({ error: 'No autorizado' });
    }
    
    res.json(mes);
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Crear mes
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { nombre, fechaInicio, fechaFin, ingreso, anio } = req.body;
    const usuarioId = req.user.id;

    const mesExistente = await Mes.findOne({ nombre, anio });
    if (mesExistente) {
      return res.status(409).json({ error: 'Ya existe un mes con este nombre y año' });
    }

    if (!nombre || !fechaInicio || !fechaFin || !anio) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const nuevoMes = new Mes({
      nombre,
      fechaInicio: new Date(fechaInicio),
      fechaFin: new Date(fechaFin),
      ingreso: ingreso || 0,
      anio,
      usuario: usuarioId,
      portafolios: []
    });

    await nuevoMes.save();
    res.status(201).json(nuevoMes);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el mes' });
  }
});

// Crear mes automático
router.post('/auto', authMiddleware, async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const fechaActual = new Date();
    const nombreMes = fechaActual.toLocaleString("es-ES", { month: "long" });
    
    const primerDia = new Date(
      fechaActual.getFullYear(), 
      fechaActual.getMonth(), 
      1
    );
    const ultimoDia = new Date(
      fechaActual.getFullYear(), 
      fechaActual.getMonth() + 1, 
      0
    );

    const mesExistente = await Mes.findOne({
      usuario: usuarioId,
      anio: fechaActual.getFullYear(),
      nombre: nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)
    });

    if (mesExistente) {
      return res.json({ 
        message: "El mes actual ya existe", 
        mes: mesExistente 
      });
    }

    const nuevoMes = new Mes({
      nombre: nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1),
      fechaInicio: primerDia,
      fechaFin: ultimoDia,
      ingreso: 0,
      anio: fechaActual.getFullYear(),
      usuario: usuarioId,
      portafolios: []
    });

    await nuevoMes.save();
    res.status(201).json({ 
      message: "Mes creado automáticamente", 
      mes: nuevoMes 
    });
  } catch (error) {
    res.status(500).json({ 
      error: "Error al crear mes automático",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Actualizar mes
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { nombre, fechaInicio, fechaFin, ingresos, anio } = req.body;
    const usuarioId = req.user.id;

    const mesExistente = await Mes.findOne({ 
      _id: req.params.id,
      usuario: usuarioId
    });

    if (!mesExistente) {
      return res.status(404).json({ error: "Mes no encontrado o no autorizado" });
    }

    let ingresoTotal = mesExistente.ingreso;
    if (ingresos) {
      ingresoTotal = ingresos.reduce((total, ingreso) => total + ingreso.monto, 0);
    }

    const mesActualizado = await Mes.findByIdAndUpdate(
      req.params.id,
      { 
        nombre,
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(fechaFin),
        ingresos: ingresos || mesExistente.ingresos,
        ingreso: ingresoTotal,
        anio
      },
      { new: true }
    );

    res.json(mesActualizado);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el mes' });
  }
});

// Eliminar mes
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const mes = await Mes.findOne({ 
      _id: req.params.id,
      usuario: usuarioId
    });

    if (!mes) {
      return res.status(404).json({ error: "Mes no encontrado o no autorizado" });
    }

    await Mes.findByIdAndDelete(req.params.id);
    res.json({ message: "Mes eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el mes' });
  }
});

// Actualizar ingreso de mes
router.put('/:mesId/ingresos/:ingresoId', authMiddleware, async (req, res) => {
  try {
    const { mesId, ingresoId } = req.params;
    const { concepto, monto, fecha } = req.body;

    const errors = {};
    if (!concepto) errors.concepto = 'El concepto es requerido';
    if (!monto || isNaN(monto)) errors.monto = 'Monto inválido';
    
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    const mes = await Mes.findById(mesId);
    if (!mes) return res.status(404).json({ error: 'Mes no encontrado' });

    const ingresoIndex = mes.ingresos.findIndex(i => i._id.toString() === ingresoId);
    if (ingresoIndex === -1) return res.status(404).json({ error: 'Ingreso no encontrado' });

    const ingresoActualizado = {
      _id: mes.ingresos[ingresoIndex]._id,
      concepto,
      monto: parseFloat(monto),
      fecha: fecha ? new Date(fecha) : mes.ingresos[ingresoIndex].fecha
    };

    mes.ingresos[ingresoIndex] = ingresoActualizado;
    await mes.save();
    
    res.json({
      message: 'Ingreso actualizado correctamente',
      ingreso: ingresoActualizado,
      mesActualizado: mes
    });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar ingreso de mes
router.delete('/:mesId/ingresos/:ingresoId', authMiddleware, async (req, res) => {
  try {
    const { mesId, ingresoId } = req.params;
    const mes = await Mes.findById(mesId);
    if (!mes) {
      return res.status(404).json({ error: 'Mes no encontrado' });
    }

    const ingresoIndex = mes.ingresos.findIndex(i => i._id.toString() === ingresoId);
    if (ingresoIndex === -1) {
      return res.status(404).json({ error: 'Ingreso no encontrado' });
    }

    mes.ingresos.splice(ingresoIndex, 1);
    await mes.save();
    
    res.json({ 
      message: 'Ingreso eliminado correctamente',
      mesActualizado: mes
    });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar asignaciones de ingresos
router.put('/:id/asignaciones', authMiddleware, async (req, res) => {
  try {
    const { asignacionesIngresos } = req.body;
    const mesId = req.params.id;

    if (!Array.isArray(asignacionesIngresos)) {
      return res.status(400).json({ error: 'asignacionesIngresos debe ser un array' });
    }

    const mesActualizado = await Mes.findByIdAndUpdate(
      mesId,
      { asignacionesIngresos },
      { new: true }
    );

    if (!mesActualizado) {
      return res.status(404).json({ error: 'Mes no encontrado' });
    }

    res.json({ 
      mesActualizado,
      portafoliosActualizados: asignacionesIngresos.length 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;