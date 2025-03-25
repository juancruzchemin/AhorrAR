const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken'); // Importar jsonwebtoken
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000; // Cambia el puerto a 5000

app.use(cors({
  origin: 'https://ahorr-ar.vercel.app', // Reemplaza con tu dominio de Vercel (sin la barra al final)
  credentials: true
}));
app.use(express.json());

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB conectado'))
  .catch(err => console.log('Error al conectar a MongoDB:', err));

// Modelo de Usuario
const Usuario = require('./models/Usuario'); // Asegúrate de que esta línea esté correcta

app.get("/api/test", (req, res) => {
  res.json({ msg: "Ruta sin autenticación funcionando" });
});


const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization")?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ msg: "No hay token, autorización denegada" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Almacena el usuario decodificado en la solicitud
    next(); // Continúa al siguiente middleware o ruta
  } catch (err) {
    res.status(401).json({ msg: "Token no válido" });
  }
};

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
      console.log('Usuario ID:', userId); // Agregar log para depuración
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error(`Invalid ObjectId: ${userId}`);
      }
      return new mongoose.Types.ObjectId(userId);
    });

    // Validar que todos los admins sean ObjectId válidos
    const adminsIds = admins.filter(adminId => adminId).map((adminId) => {
      console.log('Admin ID:', adminId); // Agregar log para depuración
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

    // Verificar si el usuario existe
    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
    }

    // Comparar la contraseña
    const passwordMatch = await bcrypt.compare(password, usuario.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
    }

    // Crear el movimiento si la autenticación es correcta
    const nuevoMovimiento = new Movimiento({
      nombre,
      categoria,
      monto,
      fecha,
      fijo,
      tipo,
      usuario: usuario._id, // Asignamos el usuario autenticado
      portafolio
    });

    await nuevoMovimiento.save();
    res.status(201).json(nuevoMovimiento);
  } catch (error) {
    console.error("Error al crear el movimiento:", error);
    res.status(500).json({ error: "Error al crear el movimiento" });
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


// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
