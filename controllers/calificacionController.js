const Calificacion = require("../models/calificacion");
const Contratacion = require("../models/contratacion");
const Perfil = require("../models/perfil");
const Empleado = require("../models/empleado");
const Empleador = require("../models/empleador");

// ============ FUNCIÓN AUXILIAR: actualizar promedio ============
const actualizarPromedio = async (usuarioId) => {
  const calificaciones = await Calificacion.find({ empleadoId: usuarioId });

  let promedio = 0;
  if (calificaciones.length > 0) {
    const totalPuntos = calificaciones.reduce((acc, c) => acc + c.puntaje, 0);
    promedio = parseFloat((totalPuntos / calificaciones.length).toFixed(2));
  }

  const empleado = await Empleado.findOne({ usuario: usuarioId });
  const empleador = await Empleador.findOne({ usuario: usuarioId });

  // Actualizar Perfil
  await Perfil.findOneAndUpdate(
    { perfilId: usuarioId },
    { "perfil.calificacion": promedio }
  );

  if (empleado) {
    await Empleado.findOneAndUpdate(
      { usuario: usuarioId },
      { "perfil.calificacion": promedio }
    );
  }

  if (empleador) {
    await Empleador.findOneAndUpdate(
      { usuario: usuarioId },
      { "perfil.calificacion": promedio }
    );
  }

  return promedio;
};

// ============ FUNCIÓN puedeCalificar ============
const puedeCalificar = async (req, res) => {
  try {
    const { calificadorId, empleadoId, contratacionId } = req.body;

    if (!calificadorId || !empleadoId || !contratacionId) {
      return res.status(400).json({ message: "Faltan datos" });
    }

    const contratacion = await Contratacion.findById(contratacionId);
    if (!contratacion)
      return res.status(404).json({ message: "Contratación no encontrada" });

    let receptorCalificacionId;

    if (contratacion.empleador.toString() === calificadorId) {
      receptorCalificacionId = contratacion.empleado.toString();
    } else if (contratacion.empleado.toString() === calificadorId) {
      receptorCalificacionId = contratacion.empleador.toString();
    } else {
      return res.status(403).json({
        message: "No tienes permisos para calificar en esta contratación",
      });
    }

    const calificacionExistente = await Calificacion.findOne({
      calificadorId,
      empleadoId: receptorCalificacionId,
      contratacionId: contratacion._id,
    });

    if (calificacionExistente) {
      return res.json({
        yaCalificado: true,
        calificacion: calificacionExistente,
      });
    }

    res.json({ yaCalificado: false });
  } catch (error) {
    console.error("Error en puedeCalificar:", error);
    res.status(500).json({ message: "Error al verificar calificación" });
  }
};

// ============ FUNCIÓN crearCalificacion ============
const crearCalificacion = async (req, res) => {
  try {
    const { calificadorId, empleadoId, puntaje, comentario, contratacionId } =
      req.body;

    if (
      !calificadorId ||
      !empleadoId ||
      !puntaje ||
      !comentario ||
      !contratacionId
    ) {
      return res.status(400).json({ message: "Faltan datos" });
    }

    if (puntaje < 1 || puntaje > 5) {
      return res.status(400).json({ message: "El puntaje debe estar entre 1 y 5" });
    }

    const contratacion = await Contratacion.findById(contratacionId);
    if (!contratacion)
      return res.status(404).json({ message: "No se encontró la contratación" });

    let receptorCalificacionId;

    if (contratacion.empleador.toString() === calificadorId) {
      receptorCalificacionId = contratacion.empleado.toString();
    } else if (contratacion.empleado.toString() === calificadorId) {
      receptorCalificacionId = contratacion.empleador.toString();
    } else {
      return res.status(403).json({
        message: "No tienes permisos para calificar en esta contratación",
      });
    }

    const calificacionExistente = await Calificacion.findOne({
      calificadorId,
      empleadoId: receptorCalificacionId,
      contratacionId: contratacion._id,
    });

    if (calificacionExistente) {
      return res.status(409).json({
        message: "Ya has calificado a este usuario para esta contratación",
      });
    }

    const nuevaCalificacion = await Calificacion.create({
      calificadorId,
      empleadoId: receptorCalificacionId,
      contratacionId: contratacion._id,
      puntaje,
      comentario,
    });

    const promedio = await actualizarPromedio(receptorCalificacionId);

    const empleadoActualizado = await Empleado.findOne({
      usuario: receptorCalificacionId,
    });
    const empleadorActualizado = await Empleador.findOne({
      usuario: receptorCalificacionId,
    });

    res.status(201).json({
      message: "Calificación creada y promedios actualizados",
      calificacion: nuevaCalificacion,
      promedio,
      empleadoActualizado,
      empleadorActualizado,
    });
  } catch (error) {
    console.error("Error en crearCalificacion:", error);
    res.status(500).json({ message: "Error al crear calificación" });
  }
};

// ============ FUNCIÓN obtenerCalificacion ============
const obtenerCalificacion = async (req, res) => {
  try {
    const { contratacionId, calificadorId, empleadoId } = req.body;

    if (!contratacionId || !calificadorId || !empleadoId) {
      return res.status(400).json({ message: "Faltan datos requeridos" });
    }

    const contratacion = await Contratacion.findById(contratacionId);
    if (!contratacion)
      return res.status(404).json({ message: "Contratación no encontrada" });

    let receptorCalificacionId;

    if (contratacion.empleador.toString() === calificadorId) {
      receptorCalificacionId = contratacion.empleado.toString();
    } else if (contratacion.empleado.toString() === calificadorId) {
      receptorCalificacionId = contratacion.empleador.toString();
    } else {
      return res
        .status(403)
        .json({ message: "No tienes permisos para esta calificación" });
    }

    const calificacion = await Calificacion.findOne({
      contratacionId,
      calificadorId,
      empleadoId: receptorCalificacionId,
    });

    if (!calificacion)
      return res.status(404).json({ message: "Calificación no encontrada" });

    const fechaCreacion = new Date(calificacion.createdAt);
    const fechaActual = new Date();
    const diferenciaDias =
      (fechaActual - fechaCreacion) / (1000 * 60 * 60 * 24);
    const puedeEditar = diferenciaDias <= 3;

    const calificacionConPermisos = {
      ...calificacion.toObject(),
      puedeEditar,
    };

    res.json({ success: true, calificacion: calificacionConPermisos });
  } catch (error) {
    console.error("Error en obtenerCalificacion:", error);
    res.status(500).json({ message: "Error al obtener calificación" });
  }
};

// ============ FUNCIÓN editarCalificacion ============
const editarCalificacion = async (req, res) => {
  try {
    const { id } = req.params;
    const { puntaje, comentario } = req.body;

    if (!puntaje || !comentario) {
      return res.status(400).json({ message: "Faltan datos requeridos" });
    }

    if (puntaje < 1 || puntaje > 5) {
      return res.status(400).json({ message: "El puntaje debe estar entre 1 y 5" });
    }

    const calificacion = await Calificacion.findById(id);
    if (!calificacion) {
      return res.status(404).json({ message: "Calificación no encontrada" });
    }

    const fechaCreacion = new Date(calificacion.createdAt);
    const fechaActual = new Date();
    const diferenciaDias =
      (fechaActual - fechaCreacion) / (1000 * 60 * 60 * 24);

    if (diferenciaDias > 3) {
      return res.status(403).json({
        message:
          "No puedes editar esta calificación, han pasado más de 3 días",
      });
    }

    const calificacionActualizada = await Calificacion.findByIdAndUpdate(
      id,
      { puntaje, comentario },
      { new: true }
    );

    const promedio = await actualizarPromedio(calificacionActualizada.empleadoId);

    const empleadoActualizado = await Empleado.findOne({
      usuario: calificacionActualizada.empleadoId,
    });
    const empleadorActualizado = await Empleador.findOne({
      usuario: calificacionActualizada.empleadoId,
    });

    res.json({
      message: "Calificación editada y promedios actualizados",
      calificacion: calificacionActualizada,
      promedio,
      empleadoActualizado,
      empleadorActualizado,
    });
  } catch (error) {
    console.error("Error en editarCalificacion:", error);
    res.status(500).json({ message: "Error al editar calificación" });
  }
};

// ============ FUNCIÓN eliminarCalificacion ============
const eliminarCalificacion = async (req, res) => {
  try {
    const { id } = req.params;
    const calificacion = await Calificacion.findById(id);

    if (!calificacion)
      return res.status(404).json({ message: "Calificación no encontrada" });

    const receptorId = calificacion.empleadoId;

    await Calificacion.findByIdAndDelete(id);

    const promedio = await actualizarPromedio(receptorId);

    const empleadoActualizado = await Empleado.findOne({ usuario: receptorId });
    const empleadorActualizado = await Empleador.findOne({ usuario: receptorId });

    res.json({
      message: "Calificación eliminada y promedios actualizados",
      promedio,
      empleadoActualizado,
      empleadorActualizado,
    });
  } catch (error) {
    console.error("Error en eliminarCalificacion:", error);
    res.status(500).json({ message: "Error al eliminar calificación" });
  }
};

// ============ FUNCIÓN obtenerCalificacionesEmpleado ============
const obtenerCalificacionesEmpleado = async (req, res) => {
  try {
    const { empleadoId } = req.params;

    if (!empleadoId) {
      return res.status(400).json({ message: "Falta el empleadoId" });
    }

    const calificaciones = await Calificacion.find({
      $or: [{ empleadoId }, { calificadorId: empleadoId }],
    })
      .populate({
        path: "contratacionId",
        select: "empleador empleado estado",
        populate: [
          {
            path: "empleador",
            model: "Empleador",
            select: "nombre email perfil",
          },
          {
            path: "empleado",
            model: "Empleado",
            select: "nombre email perfil",
          },
        ],
      })
      .sort({ fecha: -1 });

    const filtradas = calificaciones.filter((c) => c.contratacionId);

    const calificacionesEnriquecidas = await Promise.all(
      filtradas.map(async (calificacion) => {
        const calificacionObj = calificacion.toObject();

        const empleadoCalificador = await Empleado.findOne({
          usuario: calificacion.calificadorId,
        }).select("nombre email perfil");
        const empleadorCalificador = await Empleador.findOne({
          usuario: calificacion.calificadorId,
        }).select("nombre email perfil");

        const empleadoReceptor = await Empleado.findOne({
          usuario: calificacion.empleadoId,
        }).select("nombre email perfil");
        const empleadorReceptor = await Empleador.findOne({
          usuario: calificacion.empleadoId,
        }).select("nombre email perfil");

        return {
          ...calificacionObj,
          calificador: empleadoCalificador || empleadorCalificador,
          receptor: empleadoReceptor || empleadorReceptor,
        };
      })
    );

    res.json({
      calificaciones: calificacionesEnriquecidas,
      total: calificacionesEnriquecidas.length,
    });
  } catch (error) {
    console.error("Error en obtenerCalificacionesEmpleado:", error);
    res.status(500).json({ message: "Error al obtener calificaciones" });
  }
};

// ============ FUNCIÓN getNotificaciones ============
const getNotificaciones = async (req, res) => {
  try {
    const { perfilId } = req.params;

    if (!perfilId) {
      return res.status(400).json({ ok: false, msg: "Falta el perfilId" });
    }

    const perfil = await Perfil.findOne({ perfilId });

    if (!perfil) {
      return res.status(404).json({ ok: false, msg: "Perfil no encontrado" });
    }

    // Devolver todo el objeto perfil (incluye calificacion)
    res.json({ ok: true, perfil: perfil.perfil });
  } catch (error) {
    console.error("Error al obtener perfil con calificación:", error);
    res.status(500).json({ ok: false, msg: "Error al obtener perfil" });
  }
};

// ============ EXPORTS ============
module.exports = {
  puedeCalificar,
  getNotificaciones,
  crearCalificacion,
  editarCalificacion,
  eliminarCalificacion,
  obtenerCalificacionesEmpleado,
  obtenerCalificacion,
};
