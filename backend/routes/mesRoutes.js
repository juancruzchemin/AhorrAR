const express = require("express");
const router = express.Router();
const mesController = require("../controllers/mesController");

// Definir rutas para Mes
router.post("api/mes", mesController.crearMesAutomatico); // Cambiado a crearMesAutomatico
router.get("api/mes", mesController.obtenerMeses);
router.get("api/mes/:id", mesController.obtenerMesPorId); // Corregido
router.put("api/mes/:id", mesController.actualizarMes); // Corregido
router.delete("api/mes/:id", mesController.eliminarMes); // Corregido

module.exports = router;
