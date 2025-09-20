const express = require("express");
const router = express.Router();
const {
  puedeCalificar,
  crearCalificacion,
  editarCalificacion,
  eliminarCalificacion,
  obtenerCalificacionesEmpleado,
  obtenerCalificacion,
  getNotificaciones,
} = require("../controllers/calificacionController");

router.post("/puede-calificar", puedeCalificar);
router.post("/", crearCalificacion);
router.put("/editar/:id", editarCalificacion);
router.delete("/eliminar/:id", eliminarCalificacion);

// Rutas para obtener calificaciones
router.get("/empleado/:empleadoId", obtenerCalificacionesEmpleado);
router.post("/obtenerCalificacion", obtenerCalificacion); // ← Nueva ruta
router.get("/notificaciones", getNotificaciones);


module.exports = router;