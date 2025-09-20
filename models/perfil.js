const mongoose = require("mongoose");

const perfilSchema = new mongoose.Schema({
  perfilId: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true }, // nuevo campo
  fechaRegistro: { type: Date, default: Date.now },
  rol: { type: String, enum: ["empleado", "empleador", "visitante"], default: "visitante" },
  perfil: {
    localidad: { type: String, default: "" },
    nombre: { type: String, default: "" },
    correo: { type: String, default: "redoficios2025@gmail.com" },
    aceptaTerminos: { type: Boolean, default: false },
    calificacion: { type: Number, default: 0 },
    experiencia: { type: Number, default: 0 },
    precio: { type: Number, default: 0 },
    activo: { type: Boolean, default: true },
    telefono: { type: String, default: "" },
    profesion: { type: String, default: "" },
    avatar: { type: String, default: "/assets/hero.jpg" },
    cv: { type: String, default: "" },
    etiquetas: { type: [String], default: [] },
  },
});

module.exports = mongoose.model("Perfil", perfilSchema);
