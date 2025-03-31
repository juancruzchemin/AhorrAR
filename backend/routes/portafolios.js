const express = require('express');
const router = express.Router();
const Portafolio = require('../models/Portafolio');
const Movimiento = require('../models/Movimiento');
const authMiddleware = require('../middleware/authMiddleware');
const mongoose = require('mongoose');

// Obtener todos los portafolios del usuario
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const portafolios = await Portafolio.find({ usuarios: userId });
    res.json(portafolios);
  } catch (error) {
    res.status(500).json({ msg: "Error del servidor" });
  }
});

// Obtener portafolios con autenticación por email/password
router.get('/auth', async (req, res) => {
  try {
    const { email, password } = req.query;
    const usuario = await Usuario.findOne({ email });
    if (!usuario) return res.status(400).json({ msg: "Usuario no encontrado" });
    
    const isMatch = await usuario.comparePassword(password);
    if (!isMatch) return res.status(400).json({ msg: "Credenciales incorrectas" });

    const portafolios = await Portafolio.find({ usuarios: usuario._id });
    res.json(portafolios);
  } catch (error) {
    res.status(500).json({ msg: "Error del servidor" });
  }
});

// Obtener un portafolio por ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const portafolio = await Portafolio.findById(req.params.id)
      .populate('usuarios', 'nombre email')
      .populate('admins', 'nombre email');

    if (!portafolio) {
      return res.status(404).json({ error: 'Portafolio no encontrado' });
    }

    // Verificar que el usuario tiene acceso
    const userId = req.user.id;
    const tieneAcceso = portafolio.usuarios.some(u => u._id.toString() === userId) || 
                       portafolio.admins.some(a => a._id.toString() === userId);

    if (!tieneAcceso) {
      return res.status(403).json({ error: 'No tienes acceso a este portafolio' });
    }

    res.json(portafolio);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el portafolio' });
  }
});

// Crear un nuevo portafolio
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { nombre, tipo, mes, inicio, fin, usuarios, admins, portafolioId } = req.body;

    const usuariosIds = usuarios.filter(userId => userId).map((userId) => {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error(`Invalid ObjectId: ${userId}`);
      }
      return new mongoose.Types.ObjectId(userId);
    });

    const adminsIds = admins.filter(adminId => adminId).map((adminId) => {
      if (!mongoose.Types.ObjectId.isValid(adminId)) {
        throw new Error(`Invalid ObjectId: ${adminId}`);
      }
      return new mongoose.Types.ObjectId(adminId);
    });

    const nuevoPortafolio = new Portafolio({
      nombre,
      tipo,
      mes,
      inicio,
      fin,
      usuarios: usuariosIds,
      admins: adminsIds,
    });

    await nuevoPortafolio.save();

    const portafolioActual = await Portafolio.findById(portafolioId);
    if (!portafolioActual) {
      throw new Error('Portafolio actual no encontrado');
    }

    nuevoPortafolio.categorias = portafolioActual.categorias.map((categoria) => ({
      nombre: categoria.nombre,
      porcentaje: categoria.porcentaje,
      monto: categoria.monto,
    }));

    await nuevoPortafolio.save();

    const movimientosFijos = await Movimiento.find({ portafolio: portafolioId, fijo: true });
    for (const movimiento of movimientosFijos) {
      const nuevoMovimiento = new Movimiento({
        nombre: movimiento.nombre,
        categoria: movimiento.categoria,
        monto: movimiento.monto,
        fecha: movimiento.fecha,
        fijo: movimiento.fijo,
        tipo: movimiento.tipo,
        usuario: movimiento.usuario,
        portafolio: nuevoPortafolio._id,
      });
      await nuevoMovimiento.save();
    }

    res.status(201).json(nuevoPortafolio);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el portafolio' });
  }
});

// Actualizar un portafolio
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { nombre, tipo, mes, inicio, fin, usuarios } = req.body;
    const userId = req.user.id;

    const usuariosIds = [...new Set([...usuarios, userId])].map((user) => {
      if (!mongoose.Types.ObjectId.isValid(user)) {
        throw new Error(`Invalid ObjectId: ${user}`);
      }
      return new mongoose.Types.ObjectId(user);
    });

    const portafolioActualizado = await Portafolio.findByIdAndUpdate(
      req.params.id,
      { nombre, tipo, mes, inicio, fin, usuarios: usuariosIds },
      { new: true }
    );

    if (!portafolioActualizado) {
      return res.status(404).json({ error: "Portafolio no encontrado" });
    }

    res.json(portafolioActualizado);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el portafolio' });
  }
});

// Eliminar un portafolio
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const portafolioId = req.params.id;
    const portafolio = await Portafolio.findById(portafolioId);
    if (!portafolio) {
      return res.status(404).json({ error: "Portafolio no encontrado" });
    }

    await Movimiento.deleteMany({ portafolio: portafolioId });
    await Portafolio.findByIdAndDelete(portafolioId);

    res.json({ message: "Portafolio eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar el portafolio" });
  }
});

// Actualizar monto asignado
router.put('/:id/monto-asignado', authMiddleware, async (req, res) => {
  try {
    const { montoAsignado } = req.body;
    
    if (typeof montoAsignado !== 'number' || montoAsignado < 0) {
      return res.status(400).json({ error: 'Monto inválido' });
    }

    const portafolio = await Portafolio.findByIdAndUpdate(
      req.params.id,
      { montoAsignado },
      { new: true }
    );

    if (!portafolio) {
      return res.status(404).json({ error: 'Portafolio no encontrado' });
    }

    res.json(portafolio);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar total gastado
router.put('/:id/total-gastado', authMiddleware, async (req, res) => {
  try {
    const { totalGastado } = req.body;
    
    if (typeof totalGastado !== 'number' || totalGastado < 0) {
      return res.status(400).json({ error: 'Monto inválido' });
    }

    const portafolio = await Portafolio.findByIdAndUpdate(
      req.params.id,
      { totalGastado },
      { new: true }
    );

    if (!portafolio) {
      return res.status(404).json({ error: 'Portafolio no encontrado' });
    }

    res.json(portafolio);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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

router.post('/:portafolioId/categorias-inversiones', authMiddleware, async (req, res) => {
  const { nombre, subcategorias } = req.body;

  if (!nombre) {
    return res.status(400).json({ error: 'El nombre de la categoría es requerido' });
  }

  try {
    const portafolio = await Portafolio.findById(req.params.portafolioId);
    if (!portafolio) {
      return res.status(404).json({ error: 'Portafolio no encontrado' });
    }

    const nuevaCategoria = { 
      nombre, 
      subcategorias: subcategorias || [], 
      porcentaje: 0, 
      monto: 0 
    };
    
    portafolio.categoriasInversiones.push(nuevaCategoria);
    await portafolio.save();

    res.status(201).json({ 
      message: 'Categoría creada exitosamente', 
      categoria: portafolio.categoriasInversiones[portafolio.categoriasInversiones.length - 1] 
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear la categoría' });
  }
});

router.post('/:portafolioId/categorias-inversiones/:categoriaId/subcategorias', authMiddleware, async (req, res) => {
  const { nombre } = req.body;

  if (!nombre) {
    return res.status(400).json({ error: 'El nombre de la subcategoría es requerido' });
  }

  try {
    const portafolio = await Portafolio.findById(req.params.portafolioId);
    if (!portafolio) {
      return res.status(404).json({ error: 'Portafolio no encontrado' });
    }

    const categoria = portafolio.categoriasInversiones.id(req.params.categoriaId);
    if (!categoria) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    if (!categoria.subcategorias) {
      categoria.subcategorias = [];
    }

    if (categoria.subcategorias.includes(nombre)) {
      return res.status(400).json({ error: 'La subcategoría ya existe' });
    }

    categoria.subcategorias.push(nombre);
    await portafolio.save();

    res.status(201).json({ 
      message: 'Subcategoría agregada exitosamente', 
      subcategorias: categoria.subcategorias 
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al agregar subcategoría' });
  }
});

router.get('/:portafolioId/categorias-inversiones', authMiddleware, async (req, res) => {
  try {
    const portafolio = await Portafolio.findById(req.params.portafolioId);
    if (!portafolio) {
      return res.status(404).json({ error: 'Portafolio no encontrado' });
    }
    res.json(portafolio.categoriasInversiones);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener las categorías' });
  }
});

router.delete('/:portafolioId/categorias-inversiones/:categoriaId/subcategorias/:subcategoria', authMiddleware, async (req, res) => {
  try {
    const portafolio = await Portafolio.findById(req.params.portafolioId);
    if (!portafolio) {
      return res.status(404).json({ error: 'Portafolio no encontrado' });
    }

    const categoria = portafolio.categoriasInversiones.id(req.params.categoriaId);
    if (!categoria) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    categoria.subcategorias = categoria.subcategorias.filter(
      sub => sub !== req.params.subcategoria
    );
    
    await portafolio.save();
    res.status(200).json({ message: 'Subcategoría eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la subcategoría' });
  }
});
module.exports = router;