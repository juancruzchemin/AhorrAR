const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT;

// Middleware de CORS primero
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

// Middleware para JSON
app.use(express.json());

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch(err => console.error('❌ Error al conectar a MongoDB:', err));

// Modelo de Usuario
const Usuario = require('./models/Usuario'); // Asegúrate de que esta línea esté correcta

const authMiddleware = (req, res, next) => {
  // Permitir peticiones OPTIONS sin autenticación
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

app.get('/api/healthcheck', (req, res) => {
  res.json({
    status: 'OK',
    lastUpdated: new Date().toISOString(),
    message: 'El backend está funcionando correctamente'
  });
});

// Ruta para registrar un nuevo usuario
app.post('/api/usuarios/registrar', async (req, res) => {
  const { nombre, apellido, nombreUsuario, email, contrasena } = req.body;

  console.log('Datos recibidos para registro:', req.body); // Log de los datos recibidos

  // Validar que todos los campos estén completos
  if (!nombre || !apellido || !nombreUsuario || !email || !contrasena) {
    console.log('Error: Todos los campos son requeridos');
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }

  try {
    // Verificar si el correo ya está registrado
    const existingEmail = await Usuario.findOne({ email });
    console.log('Verificando si el correo ya está registrado:', email);
    if (existingEmail) {
      console.log('Error: El correo electrónico ya está registrado');
      return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
    }

    // Verificar si el nombre de usuario ya está registrado
    const existingUsername = await Usuario.findOne({ nombreUsuario });
    console.log('Verificando si el nombre de usuario ya está registrado:', nombreUsuario);
    if (existingUsername) {
      console.log('Error: El nombre de usuario ya está registrado');
      return res.status(400).json({ error: 'El nombre de usuario ya está registrado' });
    }

    // Crear un nuevo usuario
    const nuevoUsuario = new Usuario({ nombre, apellido, nombreUsuario, email, contrasena });
    console.log('Creando nuevo usuario:', nuevoUsuario);
    await nuevoUsuario.save();
    console.log('Usuario creado exitosamente');

    // Responder con éxito
    res.status(201).json({ message: 'Usuario creado exitosamente' });
  } catch (error) {
    console.error('Error al crear el usuario:', error); // Log del error
    res.status(500).json({ error: 'Error al crear el usuario' });
  }
});

// Ruta para obtener la información del usuario autenticado
app.get('/api/usuarios/me', authMiddleware, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.user.id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(usuario);
  } catch (error) {
    console.error('Error al obtener el usuario:', error);
    res.status(500).json({ error: 'Error al obtener el usuario' });
  }
});

// Ruta para actualizar la información del usuario autenticado
app.put('/api/usuarios/me', authMiddleware, async (req, res) => {
  const { nombre, apellido, nombreUsuario, email, contrasena } = req.body;

  // Validar que todos los campos estén completos
  if (!nombre || !apellido || !nombreUsuario || !email) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }

  try {
    const usuario = await Usuario.findById(req.user.id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Actualizar los campos del usuario
    usuario.nombre = nombre;
    usuario.apellido = apellido;
    usuario.nombreUsuario = nombreUsuario;
    usuario.email = email;
    if (contrasena) {
      usuario.contrasena = contrasena; // Actualizar la contraseña solo si se proporciona
    }

    await usuario.save();
    res.json({ message: 'Usuario actualizado exitosamente', usuario });
  } catch (error) {
    console.error('Error al actualizar el usuario:', error);
    res.status(500).json({ error: 'Error al actualizar el usuario' });
  }
});

// Ruta para iniciar sesión
app.post('/api/usuarios/login', async (req, res) => {
  const { email, contrasena } = req.body;

  console.log('Datos recibidos para inicio de sesión:', req.body);

  if (!email || !contrasena) {
    console.log('Error: El correo y la contraseña son requeridos');
    return res.status(400).json({ error: 'El correo y la contraseña son requeridos' });
  }

  try {
    const usuario = await Usuario.findOne({ email });
    console.log('Buscando usuario con correo:', email);
    if (!usuario) {
      console.log('Error: Usuario no encontrado');
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar la contraseña
    const esValido = await usuario.comparePassword(contrasena);
    console.log('Verificando contraseña para el usuario:', email);
    if (!esValido) {
      console.log('Error: Contraseña incorrecta');
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    // Generar un token
    const token = jwt.sign({ id: usuario._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log('Token generado para el usuario:', usuario._id);
    res.status(200).json({ message: 'Inicio de sesión exitoso', token, usuario });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// Ruta para obtener todos los usuarios
app.get('/api/usuarios', authMiddleware, async (req, res) => {
  try {
    const usuarios = await Usuario.find(); // Obtiene todos los usuarios
    res.json(usuarios);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

const Portafolio = require('./models/Portafolio'); // Asegúrate de que la ruta sea correcta

// Obtener todos los portafolios del usuario autenticado
app.get("/api/portafolios", authMiddleware, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id); // Convertimos el ID en ObjectId
    const portafolios = await Portafolio.find({ usuarios: userId });
    console.log("Portafolios encontrados:", portafolios); // Log de los portafolios encontrados
    res.json(portafolios);
  } catch (error) {
    console.error("Error al obtener portafolios:", error);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

// Obtener portafolios con autenticación por email/password
app.get("/api/portafolios/auth", async (req, res) => {
  try {
    const { email, password } = req.query; // O req.body si prefieres POST

    // Buscar y autenticar usuario
    const usuario = await Usuario.findOne({ email });
    if (!usuario) return res.status(400).json({ msg: "Usuario no encontrado" });

    const isMatch = await usuario.comparePassword(password);
    if (!isMatch) return res.status(400).json({ msg: "Credenciales incorrectas" });

    // Obtener portafolios
    const portafolios = await Portafolio.find({ usuarios: usuario._id });
    res.json(portafolios);

  } catch (error) {
    console.error("Error al obtener portafolios:", error);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

// Obtener un portafolio por ID
app.get("/api/portafolios/:id", authMiddleware, async (req, res) => {
  try {
    const portafolio = await Portafolio.findById(req.params.id).populate('usuarios', 'nombreUsuario'); // Usa populate para obtener nombreUsuario
    if (!portafolio) {
      return res.status(404).json({ error: 'Portafolio no encontrado' });
    }
    res.json(portafolio);
  } catch (error) {
    console.error("Error al obtener el portafolio:", error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Crear un nuevo portafolio
app.post("/api/portafolios", authMiddleware, async (req, res) => {
  try {
    const { nombre, tipo, mes, inicio, fin, usuarios, admins, portafolioId } = req.body;

    console.log('Datos recibidos para crear portafolio:', req.body); // Log de los datos recibidos

    // Validar que todos los usuarios sean ObjectId válidos
    const usuariosIds = usuarios.filter(userId => userId).map((userId) => {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error(`Invalid ObjectId: ${userId}`);
      }
      return new mongoose.Types.ObjectId(userId);
    });

    // Validar que todos los admins sean ObjectId válidos
    const adminsIds = admins.filter(adminId => adminId).map((adminId) => {
      if (!mongoose.Types.ObjectId.isValid(adminId)) {
        throw new Error(`Invalid ObjectId: ${adminId}`);
      }
      return new mongoose.Types.ObjectId(adminId);
    });

    // Crear el nuevo portafolio
    const nuevoPortafolio = new Portafolio({
      nombre,
      tipo,
      mes,
      inicio,
      fin,
      usuarios: usuariosIds, // Usar los IDs convertidos a ObjectId
      admins: adminsIds, // Usar los IDs convertidos a ObjectId
    });

    // Guardar el nuevo portafolio
    await nuevoPortafolio.save();

    // Obtener el portafolio actual para copiar categorías y movimientos
    const portafolioActual = await Portafolio.findById(portafolioId);
    if (!portafolioActual) {
      throw new Error('Portafolio actual no encontrado');
    }

    // Duplicar las categorías del portafolio actual
    nuevoPortafolio.categorias = portafolioActual.categorias.map((categoria) => ({
      nombre: categoria.nombre,
      porcentaje: categoria.porcentaje,
      monto: categoria.monto,
    }));

    // Guardar las categorías duplicadas
    await nuevoPortafolio.save();

    // Obtener los movimientos con "gasto fijo" del portafolio actual
    const movimientosFijos = await Movimiento.find({ portafolio: portafolioId, fijo: true });

    // Duplicar los movimientos y asignar el nuevo portafolioId
    for (const movimiento of movimientosFijos) {
      const nuevoMovimiento = new Movimiento({
        nombre: movimiento.nombre,
        categoria: movimiento.categoria,
        monto: movimiento.monto,
        fecha: movimiento.fecha,
        fijo: movimiento.fijo,
        tipo: movimiento.tipo,
        usuario: movimiento.usuario, // Mantener el mismo usuario
        portafolio: nuevoPortafolio._id, // Asignar el nuevo portafolioId
      });

      await nuevoMovimiento.save();
    }

    res.status(201).json(nuevoPortafolio);
  } catch (error) {
    console.error("Error al crear el portafolio:", error);
    res.status(500).json({ error: 'Error al crear el portafolio' });
  }
});

// Actualizar un portafolio por ID
app.put("/api/portafolios/:id", authMiddleware, async (req, res) => {
  try {
    const { nombre, tipo, mes, inicio, fin, usuarios } = req.body;
    const userId = req.user.id;

    // Asegurarse de que el usuario autenticado esté en la lista de usuarios
    const usuariosIds = [...new Set([...usuarios, userId])].map((user) => {
      if (!mongoose.Types.ObjectId.isValid(user)) {
        throw new Error(`Invalid ObjectId: ${user}`);
      }
      return new mongoose.Types.ObjectId(user);
    });

    // Actualizar el portafolio
    const portafolioActualizado = await Portafolio.findByIdAndUpdate(
      req.params.id,
      { nombre, tipo, mes, inicio, fin, usuarios: usuariosIds },
      { new: true }
    );

    if (!portafolioActualizado) {
      return res.status(404).json({ error: "Portafolio no encontrado" });
    }

    res.json(portafolioActualizado);
  } catch (error) {
    console.log("Body: ", req.body);
    console.error("Error al actualizar el portafolio:", error);
    res.status(500).json({ error: 'Error al actualizar el portafolio' });
  }
});

// Ruta para eliminar un portafolio por ID
app.delete("/api/portafolios/:id", authMiddleware, async (req, res) => {
  try {
    const portafolioId = req.params.id;

    // Verificar si el portafolio existe
    const portafolio = await Portafolio.findById(portafolioId);
    if (!portafolio) {
      return res.status(404).json({ error: "Portafolio no encontrado" });
    }

    // Eliminar todos los movimientos asociados al portafolio
    await Movimiento.deleteMany({ portafolio: portafolioId });

    // Eliminar el portafolio
    await Portafolio.findByIdAndDelete(portafolioId);

    res.json({ message: "Portafolio eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar el portafolio:", error);
    res.status(500).json({ error: "Error al eliminar el portafolio" });
  }
});


// Rutas para gestionar categorías
// Ruta para agregar una nueva categoría a un portafolio
app.post('/api/portafolios/:portafolioId/categorias', authMiddleware, async (req, res) => {
  const { nombre } = req.body; // Obtener el nombre de la categoría

  if (!nombre) {
    return res.status(400).json({ error: 'El nombre de la categoría es requerido' });
  }

  try {
    const portafolio = await Portafolio.findById(req.params.portafolioId);
    if (!portafolio) {
      return res.status(404).json({ error: 'Portafolio no encontrado' });
    }

    // Agregar la nueva categoría al portafolio
    const nuevaCategoria = { nombre, porcentaje: 0, monto: 0 };
    portafolio.categorias.push(nuevaCategoria);
    await portafolio.save();

    // Devolver la nueva categoría con su ID
    res.status(201).json({ message: 'Categoría creada exitosamente', categoria: { ...nuevaCategoria, _id: portafolio.categorias[portafolio.categorias.length - 1]._id } });
  } catch (error) {
    console.error('Error al crear la categoría:', error);
    res.status(500).json({ error: 'Error al crear la categoría' });
  }
});

// Obtener todas las categorías de un portafolio
app.get('/api/portafolios/:portafolioId/categorias', authMiddleware, async (req, res) => {
  try {
    const portafolio = await Portafolio.findById(req.params.portafolioId);
    if (!portafolio) {
      return res.status(404).json({ error: 'Portafolio no encontrado' });
    }

    res.json(portafolio.categorias);
  } catch (error) {
    console.error('Error al obtener las categorías:', error);
    res.status(500).json({ error: 'Error al obtener las categorías' });
  }
});

// Obtener categorías con autenticación por email/password
app.get("/api/portafolios/:portafolioId/categorias/auth", async (req, res) => {
  try {
    const { email, password } = req.query;
    const { portafolioId } = req.params;

    // Autenticar usuario
    const usuario = await Usuario.findOne({ email });
    if (!usuario) return res.status(400).json({ msg: "Usuario no encontrado" });

    const isMatch = await usuario.comparePassword(password);
    if (!isMatch) return res.status(400).json({ msg: "Credenciales incorrectas" });

    // Verificar que el usuario tenga acceso al portafolio
    const portafolio = await Portafolio.findOne({
      _id: portafolioId,
      usuarios: usuario._id
    });

    if (!portafolio) return res.status(404).json({ error: 'Portafolio no encontrado' });
    res.json(portafolio.categorias);

  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Actualizar una categoría en un portafolio
app.put('/api/portafolios/:portafolioId/categorias/:categoriaId', authMiddleware, async (req, res) => {
  const { nombre } = req.body; // Obtener el nuevo nombre de la categoría

  if (!nombre) {
    return res.status(400).json({ error: 'El nombre es requerido' });
  }

  try {
    const portafolio = await Portafolio.findById(req.params.portafolioId);
    if (!portafolio) {
      return res.status(404).json({ error: 'Portafolio no encontrado' });
    }

    const categoria = portafolio.categorias.id(req.params.categoriaId);
    if (!categoria) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    // Actualizar el nombre de la categoría
    categoria.nombre = nombre;
    await portafolio.save();

    res.status(200).json({ message: 'Categoría actualizada exitosamente', categoria });
  } catch (error) {
    console.error('Error al actualizar la categoría:', error);
    res.status(500).json({ error: 'Error al actualizar la categoría' });
  }
});

// Eliminar una categoría de un portafolio
app.delete('/api/portafolios/:portafolioId/categorias/:categoriaId', authMiddleware, async (req, res) => {
  try {
    const portafolio = await Portafolio.findById(req.params.portafolioId);
    if (!portafolio) {
      return res.status(404).json({ error: 'Portafolio no encontrado' });
    }

    // Usar el método pull para eliminar la categoría del array
    const categoriaId = req.params.categoriaId;
    portafolio.categorias.pull(categoriaId); // Eliminar la categoría por ID
    await portafolio.save(); // Guardar los cambios en el portafolio

    res.status(200).json({ message: 'Categoría eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar la categoría:', error);
    res.status(500).json({ error: 'Error al eliminar la categoría' });
  }
});

const Movimiento = require('./models/Movimiento'); // Asegúrate de que la ruta sea correcta

// Ruta para crear un nuevo movimiento
app.post("/api/movimientos", authMiddleware, async (req, res) => {
  try {
    const { nombre, categoria, monto, fecha, fijo, tipo, portafolio, usuario } = req.body; // Asegúrate de recibir los campos correctos
    const usuarioId = usuario || req.user.id; // Usar el usuario proporcionado o el usuario autenticado

    const nuevoMovimiento = new Movimiento({
      nombre,
      categoria,
      monto,
      fecha,
      fijo,
      tipo,
      usuario: usuarioId, // Asignar el usuario proporcionado o el usuario autenticado
      portafolio: portafolio // ID del portafolio al que pertenece el movimiento
    });

    await nuevoMovimiento.save();
    res.status(201).json(nuevoMovimiento); // Responder con el movimiento creado
  } catch (error) {
    console.error("Error al crear el movimiento:", error);
    res.status(500).json({ error: 'Error al crear el movimiento' });
  }
});

// Ruta para crear un nuevo movimiento con email y contraseña
app.post("/api/movimientos/auth", async (req, res) => {
  try {
    const { email, password, nombre, categoria, monto, fecha, fijo, tipo, portafolio } = req.body;

    // Buscar usuario por email
    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(400).json({ msg: "Usuario no encontrado" });
    }

    // Comparar contraseñas correctamente
    const isMatch = await usuario.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Credenciales incorrectas" });
    }

    // Crear el movimiento si la autenticación es correcta
    const nuevoMovimiento = new Movimiento({
      nombre,
      categoria,
      monto,
      fecha,
      fijo,
      tipo,
      usuario: usuario._id, // Asignar el ID del usuario autenticado
      portafolio
    });

    await nuevoMovimiento.save();
    res.status(201).json(nuevoMovimiento);

  } catch (error) {
    console.error("Error en autenticación y creación del movimiento:", error);
    res.status(500).json({ error: "Error al procesar la solicitud" });
  }
});

// Ruta para obtener todos los movimientos de un portafolio
app.get("/api/movimientos/:portafolioId", authMiddleware, async (req, res) => {
  try {
    const movimientos = await Movimiento.find({ portafolio: req.params.portafolioId }).populate('usuario', 'nombreUsuario'); // Poblamos el usuario
    res.json(movimientos);
  } catch (error) {
    console.error("Error al obtener movimientos:", error);
    res.status(500).json({ error: 'Error al obtener movimientos' });
  }
});

// Ruta para obtener un movimiento por ID
app.get("/api/movimientos/:id", authMiddleware, async (req, res) => {
  try {
    const movimiento = await Movimiento.findById(req.params.id).populate('usuario', 'nombreUsuario'); // Poblamos el usuario
    if (!movimiento) {
      return res.status(404).json({ error: 'Movimiento no encontrado' });
    }
    res.json(movimiento);
  } catch (error) {
    console.error("Error al obtener el movimiento:", error);
    res.status(500).json({ error: 'Error al obtener el movimiento' });
  }
});

// Ruta para actualizar un movimiento
app.put("/api/movimientos/:id", authMiddleware, async (req, res) => {
  try {
    const { nombre, categoria, monto, fecha, fijo, tipo } = req.body; // Asegúrate de recibir los campos correctos
    const movimiento = await Movimiento.findByIdAndUpdate(req.params.id, {
      nombre,
      categoria,
      monto,
      fecha,
      fijo,
      tipo
    }, { new: true }); // Devuelve el movimiento actualizado

    if (!movimiento) {
      return res.status(404).json({ error: 'Movimiento no encontrado' });
    }

    res.json(movimiento);
  } catch (error) {
    console.error("Error al actualizar el movimiento:", error);
    res.status(500).json({ error: 'Error al actualizar el movimiento' });
  }
});

// Ruta para eliminar un movimiento
app.delete("/api/movimientos/:id", authMiddleware, async (req, res) => {
  try {
    const movimiento = await Movimiento.findByIdAndDelete(req.params.id);
    if (!movimiento) {
      return res.status(404).json({ error: 'Movimiento no encontrado' });
    }
    res.json({ message: 'Movimiento eliminado exitosamente' });
  } catch (error) {
    console.error("Error al eliminar el movimiento:", error);
    res.status(500).json({ error: 'Error al eliminar el movimiento' });
  }
});

const Inversion = require("./models/Inversion"); // Importar el modelo
// Ruta para Inversiones ** //
// Crear una inversión (POST)
app.post("/api/inversiones", async (req, res) => {
  try {
    const usuarioId = req.userId; // Extraer el ID del usuario desde el token (ver más abajo)
    const nuevaInversion = new Inversion({ ...req.body, usuario: usuarioId });
    await nuevaInversion.save();
    res.status(201).json(nuevaInversion);
  } catch (error) {
    res.status(500).json({ error: "Error al crear la inversión" });
  }
});

// Obtener todas las inversiones (GET)
app.get("/api/inversiones", async (req, res) => {
  try {
    const usuarioId = req.userId; // Extraer el ID del usuario desde el token
    const inversiones = await Inversion.find({ usuario: usuarioId });
    res.status(200).json(inversiones);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener las inversiones" });
  }
});

// Obtener una inversión por ID (GET)
app.get("/api/inversiones/:id", async (req, res) => {
  try {
    const inversion = await Inversion.findById(req.params.id);
    if (!inversion) return res.status(404).json({ error: "Inversión no encontrada" });
    res.status(200).json(inversion);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener la inversión" });
  }
});

// Actualizar una inversión (PUT)
app.put("/api/inversiones/:id", async (req, res) => {
  try {
    const inversionActualizada = await Inversion.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!inversionActualizada) return res.status(404).json({ error: "Inversión no encontrada" });
    res.status(200).json(inversionActualizada);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar la inversión" });
  }
});

// Eliminar una inversión (DELETE)
app.delete("/api/inversiones/:id", async (req, res) => {
  try {
    const inversionEliminada = await Inversion.findByIdAndDelete(req.params.id);
    if (!inversionEliminada) return res.status(404).json({ error: "Inversión no encontrada" });
    res.status(200).json({ message: "Inversión eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar la inversión" });
  }
});

const Mes = require("./models/Mes"); // Importar el modelo
//Meses
// Obtener todos los meses del usuario autenticado
app.get("/api/mes", authMiddleware, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const meses = await Mes.find({ usuario: userId })
      .sort({ anio: -1, fechaInicio: -1 });

    console.log("Meses encontrados:", meses.length);
    res.json(meses);
  } catch (error) {
    console.error("Error al obtener meses:", error);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

// Obtener meses con autenticación por email/password
app.get("/api/mes/auth", async (req, res) => {
  try {
    const { email, password } = req.query;

    // Buscar y autenticar usuario
    const usuario = await Usuario.findOne({ email });
    if (!usuario) return res.status(400).json({ msg: "Usuario no encontrado" });

    const isMatch = await usuario.comparePassword(password);
    if (!isMatch) return res.status(400).json({ msg: "Credenciales incorrectas" });

    // Obtener meses
    const meses = await Mes.find({ usuario: usuario._id })
      .sort({ anio: -1, fechaInicio: -1 });

    res.json(meses);

  } catch (error) {
    console.error("Error al obtener meses:", error);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

// Obtener un mes por ID
app.get("/api/mes/:id", authMiddleware, async (req, res) => {
  try {
    const mes = await Mes.findById(req.params.id);

    if (!mes) {
      return res.status(404).json({ error: 'Mes no encontrado' });
    }

    // Verificar que el usuario tenga acceso a este mes
    if (mes.usuario.toString() !== req.user.id) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    res.json(mes);
  } catch (error) {
    console.error("Error al obtener el mes:", error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Crear un nuevo mes
app.post("/api/mes", authMiddleware, async (req, res) => {
  try {
    const { nombre, fechaInicio, fechaFin, ingreso, anio } = req.body;
    const usuarioId = req.user.id;

    console.log('Datos recibidos para crear mes:', req.body);

    // Validar datos requeridos
    if (!nombre || !fechaInicio || !fechaFin || !anio) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    // Crear el nuevo mes
    const nuevoMes = new Mes({
      nombre,
      fechaInicio: new Date(fechaInicio),
      fechaFin: new Date(fechaFin),
      ingreso: ingreso || 0,
      anio,
      usuario: usuarioId,
      portafolios: [] // Inicializar array vacío
    });

    // Guardar el nuevo mes
    await nuevoMes.save();

    res.status(201).json(nuevoMes);
  } catch (error) {
    console.error("Error al crear el mes:", error);
    res.status(500).json({ error: 'Error al crear el mes' });
  }
});

// Actualizar un mes por ID
app.put("/api/mes/:id", authMiddleware, async (req, res) => {
  try {
    const { nombre, fechaInicio, fechaFin, ingresos, anio } = req.body;
    const usuarioId = req.user.id;

    // Verificar que el mes exista y pertenezca al usuario
    const mesExistente = await Mes.findOne({
      _id: req.params.id,
      usuario: usuarioId
    });

    if (!mesExistente) {
      return res.status(404).json({ error: "Mes no encontrado o no autorizado" });
    }

    // Calcular el ingreso total si se envían ingresos
    let ingresoTotal = mesExistente.ingreso;
    if (ingresos) {
      ingresoTotal = ingresos.reduce((total, ingreso) => total + ingreso.monto, 0);
    }

    // Actualizar el mes
    const mesActualizado = await Mes.findByIdAndUpdate(
      req.params.id,
      {
        nombre,
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(fechaFin),
        ingresos: ingresos || mesExistente.ingresos,
        ingreso: ingresoTotal,
        anio
      },
      { new: true }
    );

    res.json(mesActualizado);
  } catch (error) {
    console.error("Error al actualizar el mes:", error);
    res.status(500).json({ error: 'Error al actualizar el mes' });
  }
});

// Eliminar un mes por ID
app.delete("/api/mes/:id", authMiddleware, async (req, res) => {
  try {
    const usuarioId = req.user.id;

    // Verificar que el mes exista y pertenezca al usuario
    const mes = await Mes.findOne({
      _id: req.params.id,
      usuario: usuarioId
    });

    if (!mes) {
      return res.status(404).json({ error: "Mes no encontrado o no autorizado" });
    }

    // Eliminar el mes
    await Mes.findByIdAndDelete(req.params.id);

    res.json({ message: "Mes eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar el mes:", error);
    res.status(500).json({ error: 'Error al eliminar el mes' });
  }
});

// Crear mes automático si no existe
app.post("/api/mes/auto", authMiddleware, async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const fechaActual = new Date();
    const nombreMes = fechaActual.toLocaleString("es-ES", { month: "long" });

    // Formatear fechas correctamente
    const primerDia = new Date(
      fechaActual.getFullYear(),
      fechaActual.getMonth(),
      1
    );
    const ultimoDia = new Date(
      fechaActual.getFullYear(),
      fechaActual.getMonth() + 1,
      0
    );

    // Verificar si ya existe el mes
    const mesExistente = await Mes.findOne({
      usuario: usuarioId,
      anio: fechaActual.getFullYear(),
      nombre: nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)
    });

    if (mesExistente) {
      return res.json({
        message: "El mes actual ya existe",
        mes: mesExistente
      });
    }

    // Crear nuevo mes
    const nuevoMes = new Mes({
      nombre: nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1),
      fechaInicio: primerDia,
      fechaFin: ultimoDia,
      ingreso: 0,
      anio: fechaActual.getFullYear(),
      usuario: usuarioId,
      portafolios: []
    });

    await nuevoMes.save();

    res.status(201).json({
      message: "Mes creado automáticamente",
      mes: nuevoMes
    });
  } catch (error) {
    console.error("Error detallado al crear mes automático:", error);
    res.status(500).json({
      error: "Error al crear mes automático",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Crear ingreso al mes
app.put('/:mesId/ingresos/:ingresoId', authMiddleware, async (req, res) => {
  try {
    const { mesId, ingresoId } = req.params;
    const { concepto, monto, fecha } = req.body;

    // Validaciones mejoradas
    const errors = {};
    if (!concepto) errors.concepto = 'El concepto es requerido';
    if (!monto || isNaN(monto)) errors.monto = 'Monto inválido';

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    const mes = await Mes.findById(mesId);
    if (!mes) return res.status(404).json({ error: 'Mes no encontrado' });

    const ingresoIndex = mes.ingresos.findIndex(i => i._id.toString() === ingresoId);
    if (ingresoIndex === -1) return res.status(404).json({ error: 'Ingreso no encontrado' });

    // Actualizar el ingreso conservando el _id original
    const ingresoActualizado = {
      _id: mes.ingresos[ingresoIndex]._id, // Mantener el mismo ID
      concepto,
      monto: parseFloat(monto),
      fecha: fecha ? new Date(fecha) : mes.ingresos[ingresoIndex].fecha
    };

    // Reemplazar el ingreso en el array
    mes.ingresos[ingresoIndex] = ingresoActualizado;

    await mes.save();
    res.json({
      message: 'Ingreso actualizado correctamente',
      ingreso: ingresoActualizado,
      mesActualizado: mes
    });

  } catch (error) {
    console.error('Error al actualizar ingreso:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

//Eliminar ingreso al mes
app.delete('/:mesId/ingresos/:ingresoId', authMiddleware, async (req, res) => {
  try {
    const { mesId, ingresoId } = req.params;

    const mes = await Mes.findById(mesId);
    if (!mes) {
      return res.status(404).json({ error: 'Mes no encontrado' });
    }

    // Encontrar el índice del ingreso a eliminar
    const ingresoIndex = mes.ingresos.findIndex(i => i._id.toString() === ingresoId);
    if (ingresoIndex === -1) {
      return res.status(404).json({ error: 'Ingreso no encontrado' });
    }

    // Eliminar el ingreso del array
    mes.ingresos.splice(ingresoIndex, 1);

    await mes.save();
    res.json({
      message: 'Ingreso eliminado correctamente',
      mesActualizado: mes
    });

  } catch (error) {
    console.error('Error al eliminar ingreso:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Guardar asignaciones de ingresos a portafolios y actualizar montos asignados
// app.put("/api/mes/:id/asignaciones", authMiddleware, async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { asignacionesIngresos } = req.body;
//     const userId = req.user.id; // ID del usuario autenticado

//     // Validación básica
//     if (!asignacionesIngresos || !Array.isArray(asignacionesIngresos)) {
//       return res.status(400).json({ error: 'Datos de asignación inválidos' });
//     }

//     // 1. Obtener y validar el mes
//     const mes = await Mes.findById(id);

//     if (!mes) {
//       return res.status(404).json({ error: 'Mes no encontrado' });
//     }

//     // Verificar que el usuario tenga acceso a este mes
//     if (mes.usuario.toString() !== userId) {
//       return res.status(403).json({ error: 'No autorizado para modificar este mes' });
//     }

//     // 2. Validar que la suma de asignaciones no supere el ingreso total
//     const totalAsignado = asignacionesIngresos.reduce((sum, a) => sum + (a.monto || 0), 0);
//     if (totalAsignado > mes.ingreso) {
//       return res.status(400).json({
//         error: 'La suma de asignaciones supera el ingreso total',
//         ingresoTotal: mes.ingreso,
//         totalAsignado: totalAsignado
//       });
//     }

//     // 3. Actualizar el mes con las nuevas asignaciones
//     mes.asignacionesIngresos = asignacionesIngresos;
//     await mes.save();

//     // 4. Actualizar los montos asignados en cada portafolio
//     const portafoliosActualizados = [];

//     for (const asignacion of asignacionesIngresos) {
//       // Verificar que el usuario sea admin del portafolio
//       const portafolio = await Portafolio.findOne({
//         _id: asignacion.portafolioId,
//         admins: userId
//       });

//       if (!portafolio) {
//         console.warn(`Usuario no es admin del portafolio ${asignacion.portafolioId}`);
//         continue;
//       }

//       // Actualizar el monto asignado
//       portafolio.montoAsignado = asignacion.monto;
//       await portafolio.save();
//       portafoliosActualizados.push(portafolio._id);
//     }

//     res.json({
//       success: true,
//       message: 'Asignaciones guardadas correctamente',
//       mesActualizado: mes,
//       portafoliosActualizados: portafoliosActualizados.length,
//       portafoliosIds: portafoliosActualizados
//     });

//   } catch (error) {
//     console.error("Error al guardar asignaciones:", error);
//     res.status(500).json({
//       error: 'Error del servidor',
//       details: error.message
//     });
//   }
// });

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
