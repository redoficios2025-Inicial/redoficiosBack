const express = require('express');
const { register, login, cambiarPassword, verificarCodigo } = require('../controllers/authController');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/cambiar-password', cambiarPassword);
router.post('/verificarCodigo', verificarCodigo);

module.exports = router;
