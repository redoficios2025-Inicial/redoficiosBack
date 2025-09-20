const express = require("express");
const { verificarToken } = require("../middleware/authMiddleware");
const {
  crearPerfil,
  editarPerfil,
  obtenerPerfil,
  obtenerPerfiles,
} = require("../controllers/perfilController");
const upload = require("../middleware/cloudinary"); // middleware que sube a Cloudinary

module.exports = () => {
  const router = express.Router();

  router.put("/crear", verificarToken, upload.fields([{ name: "avatar" }, { name: "cv" }]), crearPerfil);

  router.put("/editar/:id", verificarToken, upload.fields([{ name: "avatar" }, { name: "cv" }]), editarPerfil);

  router.get("/obtener/todos", verificarToken, obtenerPerfiles);
  router.get("/obtener/todos/sin-rol", obtenerPerfiles);
  router.get("/obtener/:id", verificarToken, obtenerPerfil);

  return router;
};
