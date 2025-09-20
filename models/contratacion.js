const mongoose = require("mongoose");

const contratacionSchema = new mongoose.Schema(
  {
    empleado: { type: mongoose.Schema.Types.ObjectId, ref: "Empleado", required: true },
    empleador: { type: mongoose.Schema.Types.ObjectId, ref: "Empleado", required: true },
    codigo: { type: String, required: true }, // código encriptado
    estado: { type: String, enum: ["pendiente", "aceptado", "rechazado"], default: "pendiente" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Contratacion", contratacionSchema);
