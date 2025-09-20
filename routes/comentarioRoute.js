const express = require("express");
const router = express.Router();
const Calificacion = require("../models/calificacion");
const Perfil = require("../models/perfil"); // Importamos Perfil

// GET /api/comentarios/:id?pagina=1&limite=10
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params; // id enviado desde el frontend (empleadoId / perfilId)
    const pagina = Number(req.query.pagina) || 1;
    const limite = Number(req.query.limite) || 10;
    const ordenar = req.query.ordenar ? Number(req.query.ordenar) : -1;

    // Buscamos todas las calificaciones donde empleadoId coincide con el id
    const query = { empleadoId: id };
    const total = await Calificacion.countDocuments(query);

    // Traemos las calificaciones con paginación
    const calificaciones = await Calificacion.find(query)
      .sort({ fecha: ordenar })
      .skip((pagina - 1) * limite)
      .limit(limite)
      .populate("calificadorId", "perfil.nombre perfil.avatar rol") // info del autor
      .lean();

    // Traemos los datos del perfil del empleado
    const perfil = await Perfil.findOne({ _id: id }).lean();

    // Logueamos lo que llega del Perfil para debug
    console.log("Perfil encontrado:", perfil);

    // Adaptamos los datos para el frontend
    const comentarios = calificaciones.map((c) => ({
      _id: c._id,
      comentario: c.comentario,
      calificacion: c.puntaje,
      fechaCreacion: c.fecha,
      autorNombre: c.calificadorId?.perfil?.nombre || perfil?.perfil?.nombre || "Usuario",
      autorAvatar: c.calificadorId?.perfil?.avatar || perfil?.perfil?.avatar || null,
      perfilId: perfil?._id || null,
      rol: perfil?.rol || c.calificadorId?.rol || "Desconocido",
      profesion: perfil?.perfil?.profesion || "Desconocida",
    }));

    // Logueamos lo que se enviará al frontend
    console.log("Comentarios adaptados:", comentarios);

    res.json({
      comentarios,
      total,
      pagina,
      totalPaginas: Math.ceil(total / limite),
      message: "✅ Datos obtenidos correctamente desde backend",
    });
  } catch (error) {
    console.error("Error al traer calificaciones:", error);
    res.status(500).json({ message: "Error al traer calificaciones" });
  }
});

module.exports = router;
