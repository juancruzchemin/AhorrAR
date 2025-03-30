const express = require('express');
const router = express.Router();
const Usuario = require('../models/Usuario');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const authMiddleware = require('../middleware/authMiddleware.js');

// Registrar usuario
router.post('/registrar', async (req, res) => {
  const { nombre, apellido, nombreUsuario, email, contrasena } = req.body;

  if (!nombre || !apellido || !nombreUsuario || !email || !contrasena) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }

  try {
    const existingEmail = await Usuario.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
    }

    const existingUsername = await Usuario.findOne({ nombreUsuario });
    if (existingUsername) {
      return res.status(400).json({ error: 'El nombre de usuario ya está registrado' });
    }

    const nuevoUsuario = new Usuario({ nombre, apellido, nombreUsuario, email, contrasena });
    await nuevoUsuario.save();
    res.status(201).json({ message: 'Usuario creado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el usuario' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, contrasena } = req.body;

  if (!email || !contrasena) {
    return res.status(400).json({ error: 'El correo y la contraseña son requeridos' });
  }

  try {
    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const esValido = await usuario.comparePassword(contrasena);
    if (!esValido) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    const token = jwt.sign({ id: usuario._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ message: 'Inicio de sesión exitoso', token, usuario });
  } catch (error) {
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// Obtener información del usuario autenticado
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.user.id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el usuario' });
  }
});

// Actualizar información del usuario
router.put('/me', authMiddleware, async (req, res) => {
  const { nombre, apellido, nombreUsuario, email, contrasena } = req.body;

  if (!nombre || !apellido || !nombreUsuario || !email) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }

  try {
    const usuario = await Usuario.findById(req.user.id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    usuario.nombre = nombre;
    usuario.apellido = apellido;
    usuario.nombreUsuario = nombreUsuario;
    usuario.email = email;
    if (contrasena) {
      usuario.contrasena = contrasena;
    }

    await usuario.save();
    res.json({ message: 'Usuario actualizado exitosamente', usuario });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el usuario' });
  }
});

// Buscar usuarios
router.get('/buscar', authMiddleware, async (req, res) => {
  try {
    const query = req.query.q;
    if (!query || query.length < 3) {
      return res.status(400).json({ error: 'La búsqueda debe tener al menos 3 caracteres' });
    }

    const usuarios = await Usuario.find({
      $or: [
        { nombre: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ],
      _id: { $ne: req.user.id }
    }).limit(10);

    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar usuarios' });
  }
});

// Obtener todos los usuarios
router.get('/', authMiddleware, async (req, res) => {
  try {
    const usuarios = await Usuario.find();
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

module.exports = router;