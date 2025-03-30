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