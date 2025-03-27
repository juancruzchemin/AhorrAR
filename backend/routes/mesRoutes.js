const express = require("express");
const router = express.Router();
const mesController = require("../controllers/mesController");

// Definir rutas para Mes
router.post("/", mesController.crearMesAutomatico); // Cambiado a crearMesAutomatico
router.get("/", mesController.obtenerMeses);
router.get("/:id", mesController.obtenerMesPorId); // Corregido
router.put("/:id", mesController.actualizarMes); // Corregido
router.delete("/:id", mesController.eliminarMes); // Corregido

module.exports = router;
