const mongoose = require("mongoose");

const usuarioSchema = new mongoose.Schema({
  UserId: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true }, 
  correo: { type: String, required: true, unique: true },
  contraseña: { type: String, required: true },
  primerLogin: { type: Boolean, default: true },
  codigoVerificacion: { type: String }, 
  codigoExpira: { type: Date }, 
});

module.exports = mongoose.model("usuario", usuarioSchema);
