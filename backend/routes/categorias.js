const express = require('express');
const router = express.Router();
const Portafolio = require('../models/Portafolio');
const authMiddleware = require('../middleware/authMiddleware');

// Agregar categoría a portafolio
router.post('/:portafolioId/categorias', authMiddleware, async (req, res) => {
  const { nombre } = req.body;

  if (!nombre) {
    return res.status(400).json({ error: 'El nombre de la categoría es requerido' });
  }

  try {
    const portafolio = await Portafolio.findById(req.params.portafolioId);
    if (!portafolio) {
      return res.status(404).json({ error: 'Portafolio no encontrado' });
    }

    const nuevaCategoria = { nombre, porcentaje: 0, monto: 0 };
    portafolio.categorias.push(nuevaCategoria);
    await portafolio.save();

    res.status(201).json({ 
      message: 'Categoría creada exitosamente', 
      categoria: { ...nuevaCategoria, _id: portafolio.categorias[portafolio.categorias.length - 1]._id } 
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear la categoría' });
  }
});

// Obtener categorías de portafolio
router.get('/:portafolioId/categorias', authMiddleware, async (req, res) => {
  try {
    const portafolio = await Portafolio.findById(req.params.portafolioId);
    if (!portafolio) {
      return res.status(404).json({ error: 'Portafolio no encontrado' });
    }
    res.json(portafolio.categorias);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener las categorías' });
  }
});

// Obtener categorías con autenticación por email/password
router.get('/:portafolioId/categorias/auth', async (req, res) => {
  try {
    const { email, password } = req.query;
    const { portafolioId } = req.params;

    const usuario = await Usuario.findOne({ email });
    if (!usuario) return res.status(400).json({ msg: "Usuario no encontrado" });
    
    const isMatch = await usuario.comparePassword(password);
    if (!isMatch) return res.status(400).json({ msg: "Credenciales incorrectas" });

    const portafolio = await Portafolio.findOne({
      _id: portafolioId,
      usuarios: usuario._id
    });
    
    if (!portafolio) return res.status(404).json({ error: 'Portafolio no encontrado' });
    res.json(portafolio.categorias);
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Actualizar categoría
router.put('/:portafolioId/categorias/:categoriaId', authMiddleware, async (req, res) => {
  const { nombre } = req.body;

  if (!nombre) {
    return res.status(400).json({ error: 'El nombre es requerido' });
  }

  try {
    const portafolio = await Portafolio.findById(req.params.portafolioId);
    if (!portafolio) {
      return res.status(404).json({ error: 'Portafolio no encontrado' });
    }

    const categoria = portafolio.categorias.id(req.params.categoriaId);
    if (!categoria) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    categoria.nombre = nombre;
    await portafolio.save();

    res.status(200).json({ message: 'Categoría actualizada exitosamente', categoria });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar la categoría' });
  }
});

// Eliminar categoría
router.delete('/:portafolioId/categorias/:categoriaId', authMiddleware, async (req, res) => {
  try {
    const portafolio = await Portafolio.findById(req.params.portafolioId);
    if (!portafolio) {
      return res.status(404).json({ error: 'Portafolio no encontrado' });
    }

    const categoriaId = req.params.categoriaId;
    portafolio.categorias.pull(categoriaId);
    await portafolio.save();

    res.status(200).json({ message: 'Categoría eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la categoría' });
  }
});



module.exports = router;