const Usuario = require("../models/usuario");
const Perfil = require("../models/perfil");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");

dotenv.config();

// Genera código de verificación de 6 dígitos
const generarCodigo = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// Genera contraseña temporal de 8 caracteres
const generarPasswordTemp = () => Math.random().toString(36).slice(-8);

const register = async (req, res) => {
  try {
    const { nombre, correo } = req.body;

    // Verificar si existe usuario
    const existeUsuario = await Usuario.findOne({ correo });
    if (existeUsuario)
      return res.status(400).json({ msg: "El usuario ya existe" });

    // Crear un nuevo UserId
    const userId = new mongoose.Types.ObjectId();

    // Generar contraseña temporal y hash
    const passwordTemp = generarPasswordTemp();
    const salt = await bcrypt.genSalt(10);
    const hashPass = await bcrypt.hash(passwordTemp, salt);

    // Generar código de verificación
    const codigo = generarCodigo();

    // Crear usuario en la colección Usuario
    const nuevoUsuario = new Usuario({
      UserId: userId,
      correo,
      contraseña: hashPass,
      codigoVerificacion: codigo,
      codigoExpira: Date.now() + 10 * 60 * 1000, // 10 minutos
    });

    await nuevoUsuario.save();

    // Crear perfil con perfilId = UserId
    const nuevoPerfil = new Perfil({
      perfilId: userId,
      rol: "visitante",
      perfil: {
        nombre: nombre || "Usuario",
        aceptaTerminos: true,
        calificacion: 0,
        activo: true,
        precio: 0,
        telefono: "",
        profesion: "",
        avatar: "",
        cv: "",
        etiquetas: [],
      },
    });

    await nuevoPerfil.save();

    // Enviar correo con código y contraseña temporal
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: 'redoficios2025@gmail.com',
        pass: 'flwg fmxy jygh liep',
      },
    });

    await transporter.sendMail({
      from: `"RedOficios" <redoficios2025@gmail.com>`,
      to: correo,
      subject: "Código de verificación - RedOficios",
      html: `
  <div style="font-family: Arial, sans-serif; background-color: #f3f6f8; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
      <div style="background-color: #4ade80; padding: 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0;">RedOficios</h1>
      </div>
      <div style="padding: 30px; text-align: center;">
        <h3 style="color: #333333;">Hola ${nombre},</h3>
        <p style="color: #555555; font-size: 16px;">Tu código de verificación es:</p>
        <div style="font-size: 32px; font-weight: bold; color: #ef4444; margin: 20px 0; letter-spacing: 5px;">
          ${codigo}
        </div>
        <p style="color: #555555; font-size: 14px;">Contraseña temporal: <strong>${passwordTemp}</strong></p>
        <p style="color: #999999; font-size: 12px; margin-top: 20px;">Este código es válido por 10 minutos.</p>
        <a href="https://tu-sitio.com/login" style="display: inline-block; margin-top: 20px; background-color: #4ade80; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 5px;">Iniciar sesión</a>
      </div>
    </div>
  </div>
  `,
    });

    res.json({
      msg: "Código de verificación enviado al correo",
      userId,
      perfilId: userId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error en el servidor", error });
  }
};

const login = async (req, res) => {
  try {
    const { correo, contraseña } = req.body;

    // Buscar usuario por correo
    const usuario = await Usuario.findOne({ correo });
    if (!usuario) return res.status(400).json({ msg: "Usuario no encontrado" });

    // Validar contraseña
    const esValido = await bcrypt.compare(contraseña, usuario.contraseña);
    if (!esValido)
      return res.status(400).json({ msg: "Contraseña incorrecta" });

    // Generar token con UserId
    const token = jwt.sign({ id: usuario.UserId },'miSuperClaveSecretaMuyLargaYLlenaDeCaracteres123!@#', {
      expiresIn: "7d",
    });

    // Buscar perfil asociado usando perfilId = UserId
    let perfil = await Perfil.findOne({ perfilId: usuario.UserId });
    let perfilTemporal = false;

    if (!perfil) {
      // Crear perfil temporal si no existe
      perfilTemporal = true;
      perfil = {
        perfilId: usuario.UserId,
        rol: "visitante",
        perfil: {
          nombre: usuario.nombre || "Usuario Temporal",
          aceptaTerminos: false,
          calificacion: 0,
          activo: true,
          telefono: "",
          profesion: "",
          avatar: "",
          cv: "",
          etiquetas: [],
          precio: 0,
        },
      };
    }

    // Armar la respuesta
    const usuarioResponse = {
      userId: usuario.UserId,
      perfilId: perfil.perfilId || usuario.UserId,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: perfil.rol || "visitante",
      perfil: perfil.perfil || perfil,
    };

    // Verificar si es primer login
    if (usuario.primerLogin) {
      return res.json({
        msg: "Primer login: se requiere cambiar contraseña",
        primerLogin: true,
        token,
        usuario: usuarioResponse,
        temporal: perfilTemporal,
      });
    }

    res.json({
      msg: "Login exitoso",
      token,
      usuario: usuarioResponse,
      temporal: perfilTemporal,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error en el servidor", error: error.message });
  }
};

// Verificación del código
const verificarCodigo = async (req, res) => {
  try {
    const { correo, codigo } = req.body;
    const usuario = await Usuario.findOne({ correo });
    if (!usuario) return res.status(400).json({ msg: "Usuario no encontrado" });

    if (usuario.verificado)
      return res.status(400).json({ msg: "Usuario ya verificado" });
    if (usuario.codigoVerificacion !== codigo)
      return res.status(400).json({ msg: "El código es incorrecto" });
    if (Date.now() > usuario.codigoExpira)
      return res.status(400).json({ msg: "Código expirado" });

    usuario.verificado = true;
    usuario.codigoVerificacion = null;
    usuario.codigoExpira = null;
    await usuario.save();

    res.json({ msg: "Usuario verificado correctamente" });
  } catch (error) {
    res.status(500).json({ msg: "Error en el servidor", error });
  }
};

const cambiarPassword = async (req, res) => {
  try {
    const { correo, nuevaContraseña } = req.body;
    const usuario = await Usuario.findOne({ correo });
    if (!usuario) return res.status(400).json({ msg: "Usuario no encontrado" });

    const salt = await bcrypt.genSalt(10);
    usuario.contraseña = await bcrypt.hash(nuevaContraseña, salt);
    usuario.primerLogin = false;
    await usuario.save();

    res.json({ msg: "Contraseña actualizada correctamente" });
  } catch (error) {
    res.status(500).json({ msg: "Error en el servidor", error });
  }
};

module.exports = { register, login, verificarCodigo, cambiarPassword };


