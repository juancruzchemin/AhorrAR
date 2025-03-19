const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario'); // Asegúrate de que la ruta sea correcta

const authMiddleware = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. No se proporcionó token.' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET); // Verifica el token
    req.user = await Usuario.findById(verified.id); // Cambia de `req.usuario` a `req.user`

    if (!req.user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    next(); // Continúa al siguiente middleware o ruta
  } catch (error) {
    console.error('Error en la autenticación:', error);
    res.status(401).json({ error: 'Token no válido.' });
  }
};

module.exports = authMiddleware;
