const express = require("express");
const { contratarUsuario, obtenerNotificaciones,estadoNotificaciones,borrarNotificaciones } = require("../controllers/contratacionController");

const router = express.Router();

// Crear contratación
router.post("/:id", contratarUsuario);

// Obtener contrataciones de un empleado específico
router.get("/notificaciones/", obtenerNotificaciones);
router.delete("/notificaciones/:id",borrarNotificaciones);
router.put("/notificaciones/estado/:id",estadoNotificaciones);
module.exports = router;
