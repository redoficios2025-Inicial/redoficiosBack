const mongoose = require("mongoose");

const empleadorSchema = new mongoose.Schema(
  {
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
    },
    nombre: { type: String, required: true },
    email: {
      type: String,
      required: true,
      default: "redoficios2025@gmail.com",
    },
    perfil: { type: Object },
    estado: { type: String, enum: ["activo", "inactivo"], default: "activo" },
    notificacionEmpleador: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Empleador", empleadorSchema);
