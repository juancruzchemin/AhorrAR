const express = require('express');
const router = express.Router();
const Inversion = require('../models/Inversion');
const Portafolio = require('../models/Portafolio');
const authMiddleware = require('../middleware/authMiddleware');
const mongoose = require('mongoose');

// Crear inversión

router.post('/', authMiddleware, async (req, res) => {
    try {
        const { nombre, categoria, precioCompra, precioActual, cantidad, fechaCompra, notas, portafolioId } = req.body;
        
        // Validaciones básicas
        if (!nombre || !categoria || precioCompra === undefined || 
            precioActual === undefined || cantidad === undefined || !fechaCompra) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }

        const inversionData = {
            nombre,
            categoria,
            precioCompra,
            precioActual,
            cantidad,
            fechaCompra: new Date(fechaCompra),
            usuario: req.user.id,
            portafolio: portafolioId,
            montoActual: precioActual * cantidad // Calculamos aquí por si el pre-hook falla
        };

        const nuevaInversion = new Inversion(inversionData);
        await nuevaInversion.save();
        
        res.status(201).json(nuevaInversion);
    } catch (error) {
        console.error('Error al crear inversión:', error);
        res.status(500).json({ 
            error: 'Error al crear la inversión',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Obtener todas las inversiones del usuario
router.get('/', authMiddleware, async (req, res) => {
  try {
    const inversiones = await Inversion.find({ usuario: req.user.id })
      .populate('portafolio', 'nombre tipo');
    res.status(200).json(inversiones);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener las inversiones" });
  }
});

// Obtener inversiones por portafolio
router.get('/portafolio/:portafolioId', authMiddleware, async (req, res) => {
  try {
    // Verificar que el portafolio existe y pertenece al usuario
    const portafolio = await Portafolio.findOne({
      _id: req.params.portafolioId,
      $or: [
        { usuarios: req.user.id },
        { admins: req.user.id }
      ]
    }).populate('usuarios', 'nombre email');

    if (!portafolio) {
      return res.status(404).json({ 
        error: "Portafolio no encontrado o no tienes acceso" 
      });
    }

    // Obtener las inversiones ordenadas por fecha descendente
    const inversiones = await Inversion.find({ 
      portafolio: req.params.portafolioId 
    }).sort({ fechaCompra: -1 });

    // Calcular resumen
    const totalInvertido = inversiones.reduce((sum, inv) => sum + inv.precioCompra, 0);
    const valorActual = inversiones.reduce((sum, inv) => sum + inv.precioActual, 0);
    const rentabilidad = totalInvertido > 0 ? 
      ((valorActual - totalInvertido) / totalInvertido * 100) : 0;

    res.json({
      portafolio: {
        nombre: portafolio.nombre,
        tipo: portafolio.tipo,
        usuarios: portafolio.usuarios
      },
      inversiones,
      resumen: {
        totalInvertido,
        valorActual,
        rentabilidad: rentabilidad.toFixed(2)
      }
    });
  } catch (error) {
    console.error('Error al obtener inversiones:', error);
    res.status(500).json({ error: "Error al obtener las inversiones" });
  }
});

// Obtener inversión por ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const inversion = await Inversion.findOne({
      _id: req.params.id,
      usuario: req.user.id
    }).populate('portafolio', 'nombre tipo');

    if (!inversion) {
      return res.status(404).json({ error: "Inversión no encontrada o no tienes permisos" });
    }

    res.status(200).json(inversion);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener la inversión" });
  }
});

// Actualizar inversión
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { portafolioId, ...updateData } = req.body;

    const inversionExistente = await Inversion.findOne({
      _id: req.params.id,
      usuario: req.user.id
    });

    if (!inversionExistente) {
      return res.status(404).json({ error: "Inversión no encontrada o no tienes permisos" });
    }

    if (portafolioId && portafolioId !== inversionExistente.portafolio.toString()) {
      const nuevoPortafolio = await Portafolio.findOne({
        _id: portafolioId,
        $or: [
          { usuarios: req.user.id },
          { admins: req.user.id }
        ]
      });

      if (!nuevoPortafolio) {
        return res.status(403).json({ error: "No tienes permisos para mover a este portafolio" });
      }

      await Portafolio.findByIdAndUpdate(
        inversionExistente.portafolio,
        { $pull: { inversiones: req.params.id } }
      );

      await Portafolio.findByIdAndUpdate(
        portafolioId,
        { $push: { inversiones: req.params.id } }
      );

      updateData.portafolio = portafolioId;
    }

    const inversionActualizada = await Inversion.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('portafolio', 'nombre tipo');

    res.status(200).json(inversionActualizada);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar la inversión" });
  }
});

// Eliminar inversión
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const inversion = await Inversion.findOneAndDelete({
      _id: req.params.id,
      usuario: req.user.id
    });

    if (!inversion) {
      return res.status(404).json({ error: "Inversión no encontrada o no tienes permisos" });
    }

    await Portafolio.findByIdAndUpdate(
      inversion.portafolio,
      { $pull: { inversiones: inversion._id } }
    );

    res.status(200).json({ 
      message: "Inversión eliminada correctamente",
      portafolioId: inversion.portafolio 
    });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar la inversión" });
  }
});

// Resumen de inversiones
router.get('/resumen/usuario', authMiddleware, async (req, res) => {
  try {
    const resumen = await Portafolio.aggregate([
      {
        $match: {
          $or: [
            { usuarios: mongoose.Types.ObjectId(req.user.id) },
            { admins: mongoose.Types.ObjectId(req.user.id) }
          ],
          tipo: "inversiones"
        }
      },
      {
        $lookup: {
          from: "inversiones",
          localField: "inversiones",
          foreignField: "_id",
          as: "detalleInversiones"
        }
      },
      {
        $project: {
          nombre: 1,
          totalInvertido: { $sum: "$detalleInversiones.montoActual" },
          cantidadInversiones: { $size: "$detalleInversiones" },
          rentabilidadPromedio: {
            $avg: {
              $divide: [
                { $subtract: ["$detalleInversiones.precioActual", "$detalleInversiones.precioCompra"] },
                "$detalleInversiones.precioCompra"
              ]
            }
          }
        }
      }
    ]);

    res.status(200).json(resumen);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el resumen de inversiones" });
  }
});

module.exports = router;