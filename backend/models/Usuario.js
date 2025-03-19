// models/Usuario.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UsuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  apellido: { type: String, required: true },
  nombreUsuario: { type: String, required: true, unique: true }, // Nombre de usuario único
  email: { type: String, required: true, unique: true }, // Email único
  contrasena: { type: String, required: true } // Almacenar la contraseña hasheada
});

// Middleware para hashear la contraseña antes de guardar el usuario
UsuarioSchema.pre('save', async function(next) {
  if (!this.isModified('contrasena')) return next(); // Solo hashear si la contraseña ha sido modificada

  try {
    const salt = await bcrypt.genSalt(10); // Generar un salt
    this.contrasena = await bcrypt.hash(this.contrasena, salt); // Hashear la contraseña
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar la contraseña ingresada con la hasheada
UsuarioSchema.methods.comparePassword = async function(contrasena) {
  return await bcrypt.compare(contrasena, this.contrasena);
};

module.exports = mongoose.model('Usuario', UsuarioSchema);
