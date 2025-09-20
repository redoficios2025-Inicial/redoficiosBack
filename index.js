const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json()); // Para JSON normal

const authRoute = require('./routes/authRoute');
const perfilRoute = require('./routes/perfilRoute');
const contratacionRoute = require('./routes/contratacionRoute');
const calificacionRoute = require('./routes/calificacionRoute');
const comentarioRoute = require("./routes/comentarioRoute");

// ✅ Importar multer con Cloudinary
const upload = require('./middleware/cloudinary'); 

// Conectar a MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch(err => console.error(err));

// Rutas
app.use('/api/auth', authRoute);
app.use('/api/perfil', perfilRoute(upload)); 
app.use('/api/contratacion', contratacionRoute);
app.use('/api/calificacion', calificacionRoute);

app.use("/api/comentarios", comentarioRoute);

// RUTA TEST ============
app.get('/api/test', (req, res) => {
  res.json({ message: "Este es el backend de RedOficios" });
});
// Puerto
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
