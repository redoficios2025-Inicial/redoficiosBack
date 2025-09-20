const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
  cloud_name: 'dvffvwic1',
  api_key: '189929491148769',
  api_secret: 'kD1v2QyyVYBj17sAAwWlBFkm3ok',
});


cloudinary.api.ping()
  .then(() => console.log("✅ Cloudinary configurado correctamente"))
  .catch(err => console.error("❌ Error en Cloudinary:", err.message));
  
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: file.fieldname, // se crea carpeta por tipo: avatar, cv
    resource_type: file.mimetype.includes("pdf") ? "raw" : "image",
    public_id: `${Date.now()}-${file.originalname}`,
  }),
});

module.exports = multer({ storage });
