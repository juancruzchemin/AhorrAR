const express = require("express");
const router = express.Router();
const mesController = require("../controllers/mesController");

// Definir rutas para Mes
router.post("/mes", mesController.crearMesAutomatico); // Cambiado a crearMesAutomatico
router.get("/mes", mesController.obtenerMeses);
router.get("/mes/:id", mesController.obtenerMesPorId); // Corregido
router.put("/mes/:id", mesController.actualizarMes); // Corregido
router.delete("/mes/:id", mesController.eliminarMes); // Corregido

module.exports = router;
