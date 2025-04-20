const express = require('express');
const router = express.Router();
const Movimiento = require('../models/Movimiento');
const authMiddleware = require('../middleware/authMiddleware');

// Crear movimiento
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { nombre, categoria, monto, fecha, fijo, tipo, portafolio, usuario } = req.body;
    const usuarioId = usuario || req.user.id;

    const nuevoMovimiento = new Movimiento({
      nombre,
      categoria,
      monto,
      fecha,
      fijo,
      tipo,
      usuario: usuarioId,
      portafolio
    });

    await nuevoMovimiento.save();
    res.status(201).json(nuevoMovimiento);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el movimiento' });
  }
});

// Obtener todos los movimientos del usuario con paginación y filtros
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10,
      categorias, 
      portafolios, 
      tipos, 
      montoMin, 
      montoMax, 
      fechaDesde, 
      fechaHasta 
    } = req.query;

    // Construir objeto de filtro base
    const filtro = { usuario: req.user.id };

    // Aplicar filtros adicionales si están presentes
    if (categorias) {
      filtro.categoria = { $in: categorias.split(',') };
    }
    
    if (portafolios) {
      // Asumiendo que portafolios es un array de IDs
      filtro.portafolio = { $in: portafolios.split(',') };
    }
    
    if (tipos) {
      filtro.tipo = { $in: tipos.split(',') };
    }
    
    // Filtro por monto
    if (montoMin || montoMax) {
      filtro.monto = {};
      if (montoMin) filtro.monto.$gte = parseFloat(montoMin);
      if (montoMax) filtro.monto.$lte = parseFloat(montoMax);
    }
    
    // Filtro por fecha
    if (fechaDesde || fechaHasta) {
      filtro.fecha = {};
      if (fechaDesde) filtro.fecha.$gte = new Date(fechaDesde);
      if (fechaHasta) filtro.fecha.$lte = new Date(fechaHasta);
    }

    console.log('Filtro aplicado:', filtro); // Para depuración

    const skip = (page - 1) * limit;

    // Obtener movimientos con filtros
    const movimientos = await Movimiento.find(filtro)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('portafolio', 'nombre')
      .sort({ fecha: -1 }) // Ordenar por fecha más reciente primero
      .exec();

    // Contar total de documentos que coinciden con los filtros
    const total = await Movimiento.countDocuments(filtro);

    res.status(200).json({
      movimientos,
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error al obtener movimientos:', error);
    res.status(500).json({ 
      error: 'Error al obtener movimientos',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// En tu ruta de movimientos (backend)
router.get('/all', authMiddleware, async (req, res) => {
  try {
      const { 
          categorias, 
          portafolios, 
          tipos, 
          montoMin, 
          montoMax, 
          fechaDesde, 
          fechaHasta 
      } = req.query;

      const filtro = { usuario: req.user.id };

      if (categorias) filtro.categoria = { $in: categorias.split(',') };
      if (portafolios) filtro['portafolio._id'] = { $in: portafolios.split(',') };
      if (tipos) filtro.tipo = { $in: tipos.split(',') };
      
      if (montoMin || montoMax) {
          filtro.monto = {};
          if (montoMin) filtro.monto.$gte = Number(montoMin);
          if (montoMax) filtro.monto.$lte = Number(montoMax);
      }

      if (fechaDesde || fechaHasta) {
          filtro.fecha = {};
          if (fechaDesde) filtro.fecha.$gte = new Date(fechaDesde);
          if (fechaHasta) filtro.fecha.$lte = new Date(fechaHasta);
      }

      const movimientos = await Movimiento.find(filtro)
          .sort({ fecha: -1 })
          .populate('portafolio', 'nombre')
          .exec();

      res.status(200).json(movimientos);
  } catch (error) {
      console.error('Error al obtener todos los movimientos:', error);
      res.status(500).json({ 
          error: 'Error al obtener movimientos',
          details: error.message
      });
  }
});

// Crear movimiento con autenticación por email/password
router.post('/auth', async (req, res) => {
  try {
    const { email, password, nombre, categoria, monto, fecha, fijo, tipo, portafolio } = req.body;

    const usuario = await Usuario.findOne({ email });
    if (!usuario) return res.status(400).json({ msg: "Usuario no encontrado" });

    const isMatch = await usuario.comparePassword(password);
    if (!isMatch) return res.status(400).json({ msg: "Credenciales incorrectas" });

    const nuevoMovimiento = new Movimiento({
      nombre,
      categoria,
      monto,
      fecha,
      fijo,
      tipo,
      usuario: usuario._id,
      portafolio
    });

    await nuevoMovimiento.save();
    res.status(201).json(nuevoMovimiento);
  } catch (error) {
    res.status(500).json({ error: "Error al procesar la solicitud" });
  }
});

// Obtener movimientos de portafolio
router.get('/:portafolioId', authMiddleware, async (req, res) => {
  try {
    const movimientos = await Movimiento.find({ portafolio: req.params.portafolioId })
      .populate('usuario', 'nombreUsuario');
    res.json(movimientos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener movimientos' });
  }
});

// Obtener movimiento por ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const movimiento = await Movimiento.findById(req.params.id)
      .populate('usuario', 'nombreUsuario');
    if (!movimiento) {
      return res.status(404).json({ error: 'Movimiento no encontrado' });
    }
    res.json(movimiento);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el movimiento' });
  }
});

// Actualizar movimiento
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { nombre, categoria, monto, fecha, fijo, tipo } = req.body;
    const movimiento = await Movimiento.findByIdAndUpdate(
      req.params.id,
      { nombre, categoria, monto, fecha, fijo, tipo },
      { new: true }
    );

    if (!movimiento) {
      return res.status(404).json({ error: 'Movimiento no encontrado' });
    }

    res.json(movimiento);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el movimiento' });
  }
});

// Eliminar movimiento
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const movimiento = await Movimiento.findByIdAndDelete(req.params.id);
    if (!movimiento) {
      return res.status(404).json({ error: 'Movimiento no encontrado' });
    }
    res.json({ message: 'Movimiento eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el movimiento' });
  }
});

module.exports = router;