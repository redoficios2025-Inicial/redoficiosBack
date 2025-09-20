const Perfil = require("../models/perfil");
const Empleado = require("../models/empleado"); // 🔹 importar modelo empleado
const Empleador = require("../models/empleador"); // 🔹 importar modelo empleador

// Crear perfil estándar al aceptar T&C
const crearPerfil = async (req, res) => {
  try {
    const userId = req.userId;
    const { nombre, rol } = req.body;

    // Verificar si ya existe perfil con ese ID
    const perfilExistente = await Perfil.findById(userId);
    if (perfilExistente) {
      return res.status(400).json({ msg: "Perfil ya existe" });
    }

    const perfil = new Perfil({
      _id: userId,
      rol: rol || "visitante",
      perfil: {
        localidad: localidad || "No existe",
        nombre: nombre || "Usuario",
        aceptaTerminos: true,
        calificacion: 0,
        experiencia: 0,
        activo: true,
      },
    });

    await perfil.save();
    res
      .status(200)
      .json({ msg: "Perfil creado correctamente", usuario: perfil });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error al crear perfil", error: err.message });
  }
};

// Obtener perfil
const obtenerPerfil = async (req, res) => {
  try {
    const perfilId = req.params.id; // obtenemos el id de la ruta
    if (!perfilId)
      return res.status(400).json({ msg: "Falta el ID del usuario" });

    // Buscar perfil en la base de datos
    const perfil = await Perfil.findOne({ perfilId: perfilId });

    if (!perfil) {
      // Usuario temporal si no existe en DB
      return res.json({
        usuario: {
          _id: perfilId, // usamos el id pasado
          rol: "visitante",
          perfil: {
            localidad: "No existe",
            nombre: "Usuario Temporal",
            correo: "redoficios@gmail.com",
            aceptaTerminos: false,
            experiencia: 0,
            calificacion: 0,
            activo: true,
            telefono: "",
            profesion: "",
            avatar: "",
            cv: "",
            etiquetas: [],
            precio: 0,
          },
        },
        temporal: true,
      });
    }

    // Perfil encontrado
    const usuarioFinal = {
      _id: perfil.perfilId, // el UserId del usuario
      rol: perfil.rol,
      perfil: {
        ...perfil.perfil.toObject(),
        nombre: perfil.perfil.nombre || "Nombre no definido",
      },
    };

    res.json({
      usuario: usuarioFinal,
      temporal: false,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error en el servidor", error: error.message });
  }
};

const obtenerPerfiles = async (req, res) => {
  try {
    // Traer todos los perfiles
    const perfiles = await Perfil.find();
    // Si no hay perfiles, enviar usuario temporal
    if (!perfiles || perfiles.length === 0) {
      return res.json({
        usuarios: [
          {
            _id: "temporal",
            rol: "visitante",
            calificacion: 0,
            perfil: {
              localidad: "No existe",
              nombre: "Usuario Temporal",
              correo: "redoficios@gmail.com",
              aceptaTerminos: false,
              experiencia: 0,
              calificacion: 0,
              activo: true,
              telefono: "",
              profesion: "",
              avatar: "",
              cv: "",
              etiquetas: [],
              precio: 0,
            },
          },
        ],
        temporal: true,
      });
    }

    // Mapear todos los perfiles a formato esperado
    const usuarios = perfiles.map((p) => ({
      _id: p.perfilId,
      rol: p.rol,
      perfil: {
        ...p.perfil.toObject(),
        nombre: p.perfil.nombre || "Nombre no definido",
        localidad: p.perfil.localidad || "", // 🔹 aseguramos que siempre haya string
      },
    }));

    // Enviar todos los usuarios en un array
    res.json({
      usuarios,
      temporal: false,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error en el servidor", error: error.message });
  }
};

// Editar perfil
// Editar perfil
const editarPerfil = async (req, res) => {
  try {
    const { id: perfilId } = req.params; // este id es en realidad perfilId enviado desde frontend

    // Buscar por campo perfilId en la base de datos
    const usuario = await Perfil.findOne({ perfilId });
    if (!usuario) return res.status(404).json({ msg: "Usuario no encontrado" });

    if (!usuario.perfil || !usuario.perfil.aceptaTerminos) {
      return res
        .status(400)
        .json({ msg: "Perfil no creado aún, aceptar términos primero" });
    }

    const {
      nombre,
      telefono,
      profesion,
      etiquetas,
      rol,
      calificacion,
      precio,
      experiencia,
      localidad,
      correo,
    } = req.body;

    if (nombre) usuario.perfil.nombre = nombre;
    if (telefono) usuario.perfil.telefono = telefono;
    if (profesion) usuario.perfil.profesion = profesion;
    if (localidad) usuario.perfil.localidad = localidad;
    if (correo) usuario.perfil.correo = correo;

    if (precio !== undefined) {
      const precioNum = parseFloat(precio);
      usuario.perfil.precio = isNaN(precioNum) ? 0 : precioNum;
    }
    if (experiencia !== undefined) {
      const experienciaNum = parseFloat(experiencia);
      usuario.perfil.experiencia = isNaN(experienciaNum) ? 0 : experienciaNum;
    }

    if (etiquetas) {
      try {
        usuario.perfil.etiquetas = JSON.parse(etiquetas);
      } catch {
        usuario.perfil.etiquetas = Array.isArray(etiquetas) ? etiquetas : [];
      }
    }

    if (calificacion !== undefined) {
      const cal = parseFloat(calificacion);
      usuario.perfil.calificacion = isNaN(cal) ? 0 : cal;
    }

    if (rol) usuario.rol = rol;

    if (req.files?.avatar) usuario.perfil.avatar = req.files.avatar[0].path;
    if (req.files?.cv) usuario.perfil.cv = req.files.cv[0].path;

    await usuario.save();

    // 🔹 Actualizar también Empleado y Empleador
    const updateData = {
      nombre: usuario.perfil.nombre,
      email: usuario.perfil.correo || "redoficios2025@gmail.com",
      perfil: usuario, // guardamos perfil completo
    };

    await Empleado.findOneAndUpdate({ usuario: perfilId }, updateData, {
      new: true,
    });

    await Empleador.findOneAndUpdate({ usuario: perfilId }, updateData, {
      new: true,
    });

    res.json({ msg: "Perfil actualizado", usuario });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error en el servidor", error: error.message });
  }
};

module.exports = { crearPerfil, obtenerPerfil, obtenerPerfiles, editarPerfil };
