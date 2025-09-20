const bcrypt = require("bcryptjs");
const Contratacion = require("../models/contratacion");
const Usuario = require("../models/usuario");
const Empleado = require("../models/empleado");
const Empleador = require("../models/empleador");
const Perfil = require("../models/perfil");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");

const contratarUsuario = async (req, res) => {
  try {
    const { empleadorId, empleadoId, empleadoDatos, empleadorDatos } = req.body;

    // Validar IDs
    if (!empleadorId || !empleadoId) {
      return res.status(400).json({ message: "Faltan IDs" });
    }

    // Buscar usuario empleador
    const usuario = await Usuario.findOne({ UserId: empleadorId });
    if (!usuario) {
      return res
        .status(404)
        .json({ message: "Usuario empleador no encontrado" });
    }

    // Buscar perfil empleador
    const perfilEmpleador = await Perfil.findOne({ perfilId: empleadorId });
    const nombreEmpleador = perfilEmpleador?.perfil?.nombre || usuario.correo;

    // Generar código único
    const codigoPlano = Math.floor(100000 + Math.random() * 900000).toString();
    const codigoHash = await bcrypt.hash(codigoPlano, 10);

    // Crear contratación
    const contratacion = new Contratacion({
      empleado: empleadoId,
      empleador: empleadorId,
      codigo: codigoHash,
      estado: "pendiente",
    });
    await contratacion.save();

    // Incrementar notificaciones
await Usuario.findOneAndUpdate(
  { UserId: empleadorId },
  { $inc: { notificacionEmpleador: 1 } },
  { new: true, upsert: true }
);

await Usuario.findOneAndUpdate(
  { UserId: empleadoId },
  { $inc: { notificacionEmpleado: 1 } },
  { new: true, upsert: true }
);

    // Guardar datos completos en Empleado
    const correoEmpleado =
      empleadoDatos?.perfil?.correo ||
      empleadoDatos?.correo ||
      "redoficios2025@gmail.com";

    let existeEmpleado = await Empleado.findOne({ usuario: empleadoId });
    if (!existeEmpleado) {
      const nuevoEmpleado = new Empleado({
        usuario: empleadoId,
        nombre: empleadoDatos?.perfil?.nombre || "Empleado",
        email: correoEmpleado,
        perfil: empleadoDatos,
        contrataciones: [contratacion._id],
      });
      await nuevoEmpleado.save();
    } else {
      existeEmpleado.contrataciones = [
        ...(existeEmpleado.contrataciones || []),
        contratacion._id,
      ];
      await existeEmpleado.save();
    }

    // Guardar datos completos en Empleador
    const correoEmpleador = usuario?.correo || "redoficios2025@gmail.com";

    let existeEmpleador = await Empleador.findOne({ usuario: empleadorId });
    if (!existeEmpleador) {
      const nuevoEmpleador = new Empleador({
        usuario: empleadorId,
        nombre: nombreEmpleador,
        email: correoEmpleador,
        perfil: perfilEmpleador || {},
        contrataciones: [contratacion._id],
      });
      await nuevoEmpleador.save();
    } else {
      existeEmpleador.contrataciones = [
        ...(existeEmpleador.contrataciones || []),
        contratacion._id,
      ];
      await existeEmpleador.save();
    }

    // Enviar emails
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const emailStyle = `
        font-family: Arial, sans-serif;
        color: #333;
        max-width: 600px;
        margin: auto;
        padding: 20px;
        border: 1px solid #ddd;
        border-radius: 8px;
        background: #f9f9f9;
      `;
      const buttonStyle = `
        display: inline-block;
        background: #007bff;
        color: white;
        text-decoration: none;
        padding: 12px 24px;
        border-radius: 5px;
        font-weight: bold;
      `;

      // Email para empleador
      await transporter.sendMail({
        from: `"RedOficios" <${process.env.EMAIL_USER}>`,
        to: correoEmpleador,
        subject: "Nueva contratación registrada en RedOficios",
        html: `
          <div style="${emailStyle}">
            <h2 style="color:#007bff;">Hola ${nombreEmpleador},</h2>
            <p>Se ha creado una nueva contratación donde figurás como <b>empleador</b>.</p>
            <p>Este es tu <b>código de seguimiento</b>:</p>
            <h1 style="text-align:center; color:#333;">${codigoPlano}</h1><br/>
            -------------------------------------------------------------------
            <h1 style="text-align:center; color:red;">IMPORTANTE</h1>
            <p>Por favor guardalo asi cuando contactes por whatsapp puedes pedir este codigo para asegurarte de que estas con la persona que elegiste.</p>
            <p>Accedé a la plataforma para gestionar la contratación.</p>
            <a href="https://tu-sitio.com/notificaciones" style="${buttonStyle}">Ver Contratación</a>
            <hr style="margin:20px 0;">
            <p style="font-size:12px; color:#777;">Gracias por usar RedOficios.</p>
          </div>
        `,
      });

      // Email para empleado
      await transporter.sendMail({
        from: `"RedOficios" <${process.env.EMAIL_USER}>`,
        to: correoEmpleado,
        subject: "Has sido contratado en RedOficios",
        html: `
          <div style="${emailStyle}">
            <h2 style="color:#28a745;">Hola ${
              empleadoDatos?.perfil?.nombre || "Trabajador"
            },</h2>
            <p>Un nuevo empleador te ha contratado en <b>RedOficios</b>.</p>
            <p>Este es tu <b>código de seguimiento</b> (compartido con tu empleador):</p>
            <h1 style="text-align:center; color:#333;">${codigoPlano}</h1>
            <p>Ingresá a la plataforma para ver los detalles de tu contratación.</p>
            <a href="https://tu-sitio.com/notificaciones" style="${buttonStyle}">Ver Contratación</a>
            <hr style="margin:20px 0;">
            <p style="font-size:12px; color:#777;">Gracias por usar RedOficios.</p>
          </div>
        `,
      });
    }

    // Respuesta al frontend
    res.status(201).json({
      message: "Contratación creada",
      contratacionId: contratacion._id,
      empleadoId,
      empleadorId,
      codigoCifrado: codigoHash,
      estado: "pendiente",
      codigoPlano,
    });
  } catch (error) {
    console.error("Error en contratarUsuario:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

const obtenerNotificaciones = async (req, res) => {
  try {
    // Buscar todas las contrataciones
    const contrataciones = await Contratacion.find()
      .sort({ createdAt: -1 }) // opcional: ordenar por fecha
      .lean();

    if (!contrataciones || contrataciones.length === 0) {
      return res
        .status(200)
        .json({ message: "No hay notificaciones", data: [] });
    }

    // Obtener IDs únicos de empleados y empleadores
    const empleadoIds = [...new Set(contrataciones.map(c => c.empleado.toString()))];
    const empleadorIds = [...new Set(contrataciones.map(c => c.empleador.toString()))];

    // Traer datos de Empleados desde el modelo Empleado
    const empleadosData = await Empleado.find({
      usuario: { $in: empleadoIds },
    }).lean();

    // Traer datos de Empleadores desde el modelo Empleador
    const empleadoresData = await Empleador.find({
      usuario: { $in: empleadorIds },
    }).lean();

    // Mapear las contrataciones a formato Notificacion
    const notificaciones = contrataciones.map((c) => {
      const empleadoData = empleadosData.find(
        (u) => u.usuario.toString() === c.empleado.toString()
      );
      const empleadorData = empleadoresData.find(
        (u) => u.usuario.toString() === c.empleador.toString()
      );

      return {
        _id: c._id,
        estado: c.estado,
        fecha: c.createdAt,
        empleado: {
          _id: empleadoData?.usuario || null, // 👈 Cambiado a _id para consistencia
          nombre: empleadoData?.nombre || "Sin nombre",
          estado: empleadoData?.estado || "inactivo",
          notificaciones: empleadoData?.notificaciones || 0,
          telefono: empleadoData?.perfil?.perfil?.telefono || "No hay",
          calificacion:
            empleadoData?.perfil?.perfil?.calificacion ||
            "No calificado",
          avatar: empleadoData?.perfil?.perfil?.avatar || null,
          rol: "empleado", // 👈 Añadido para consistencia con el frontend
        },
        empleador: {
          _id: empleadorData?.usuario || null, // 👈 Cambiado a _id para consistencia
          nombre: empleadorData?.nombre || "Sin nombre",
          estado: empleadorData?.estado || "inactivo",
          notificaciones: empleadorData?.notificaciones || 0,
          telefono: empleadorData?.perfil?.perfil?.telefono || "No hay",
          calificacion:
            empleadorData?.perfil?.calificacion ||
            "No calificado",
          avatar: empleadorData?.perfil?.perfil?.avatar || null,
          rol: "empleador", // 👈 Añadido para consistencia con el frontend
        },
      };
    });

    res.json({ data: notificaciones });
  } catch (error) {
    console.error("Error al obtener notificaciones:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// ✅ Cambiar estado de la notificación
const estadoNotificaciones = async (req, res) => {
  try {
    const { id } = req.params; // ID de la contratación
    const { estado } = req.body; // "aceptado" o "rechazado"

    if (!id) {
      return res.status(400).json({ message: "Falta el ID de la notificación" });
    }

    if (!["aceptado", "rechazado"].includes(estado)) {
      return res.status(400).json({ message: "Estado inválido" });
    }

    const notificacion = await Contratacion.findByIdAndUpdate(
      id,
      { estado },
      { new: true } // devuelve el documento actualizado
    );

    if (!notificacion) {
      return res.status(404).json({ message: "Notificación no encontrada" });
    }

    res.status(200).json({
      message: `Notificación marcada como ${estado}`,
      data: notificacion,
    });
  } catch (error) {
    console.error("Error al cambiar estado:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};




const borrarNotificaciones = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id + " de notificaion");
    if (!id) {
      return res
        .status(400)
        .json({ message: "Falta el ID de la notificación" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    const notificacion = await Contratacion.findById(id);
    if (!notificacion) {
      return res
        .status(404)
        .json({ message: "No se encontró la notificación" });
    }

    await Contratacion.findByIdAndDelete(id);

    res
      .status(200)
      .json({ message: "Notificación eliminada correctamente", id });
  } catch (error) {
    console.error("Error al eliminar la notificación:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};





module.exports = {
  contratarUsuario,
  obtenerNotificaciones,
  estadoNotificaciones,
  borrarNotificaciones,
};
