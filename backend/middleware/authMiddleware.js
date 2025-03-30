const jwt = require('jsonwebtoken');
require('dotenv').config();

const authMiddleware = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next();
  }

  const token = req.header("Authorization")?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ msg: "No hay token, autorización denegada" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ msg: "Token no válido" });
  }
};

module.exports = authMiddleware;