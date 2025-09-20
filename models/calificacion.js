const mongoose = require("mongoose");

const calificacionSchema = new mongoose.Schema({
  contratacionId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true,
    ref: 'Contratacion'
  },
  calificadorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true,
    ref: 'Perfil'
  },
  empleadoId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true,
    ref: 'Perfil'
  },
  puntaje: { 
    type: Number, 
    required: true,
    min: 1,
    max: 5
  },
  comentario: { 
    type: String, 
    required: true,
    maxlength: 500,
    trim: true
  },
  fecha: { 
    type: Date, 
    default: Date.now 
  },
  editado: { 
    type: Boolean, 
    default: false 
  },
  fechaEdicion: { 
    type: Date 
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual para calcular si puede editar (3 días)
calificacionSchema.virtual('puedeEditar').get(function() {
  const tresDias = 3 * 24 * 60 * 60 * 1000;
  const fechaLimite = this.fechaEdicion || this.fecha;
  return (Date.now() - fechaLimite.getTime()) <= tresDias;
});

// Middleware para marcar edición
calificacionSchema.pre("findOneAndUpdate", function(next) {
  this.set({ editado: true, fechaEdicion: Date.now() });
  next();
});

// Índices
calificacionSchema.index({ contratacionId: 1 });
calificacionSchema.index({ empleadoId: 1 });
calificacionSchema.index({ calificadorId: 1 });
calificacionSchema.index({ fecha: -1 });
calificacionSchema.index({ contratacionId: 1, calificadorId: 1 }, { unique: true });

module.exports = mongoose.model("Calificacion", calificacionSchema);
