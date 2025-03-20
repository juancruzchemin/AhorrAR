import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/ListaMovimientos.css";

const ListaMovimientos = ({ portafolioId }) => {
  const [movimientos, setMovimientos] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [editandoId, setEditandoId] = useState(null); // Estado para saber qué movimiento se está editando
  const [categoriasDisponibles, setCategoriasDisponibles] = useState([]); // Estado para las categorías disponibles
  const [usuariosDisponibles, setUsuariosDisponibles] = useState([]); // Estado para los usuarios disponibles
  const [usuarioActual, setUsuarioActual] = useState(''); // Estado para el usuario actual
  const [nuevoMovimiento, setNuevoMovimiento] = useState({ // Estado para el nuevo movimiento
    nombre: '',
    categoria: '',
    monto: '',
    fecha: new Date().toISOString().split('T')[0], // Establecer la fecha por defecto como hoy
    tipo: 'gasto', // Valor por defecto
    fijo: false,
    usuario: '' // Añadir el campo de usuario
  });
  const [nuevaCategoria, setNuevaCategoria] = useState("");
  const [mostrarInputNuevaCategoria, setMostrarInputNuevaCategoria] = useState(false);
  const [ordenAscendente, setOrdenAscendente] = useState(true); // Estado para controlar el orden de la tabla
  const [esCompartido, setEsCompartido] = useState(false); // Estado para determinar si el portafolio es compartido

  const fetchMovimientos = async () => {
    const token = localStorage.getItem("token"); // Obtén el token de autenticación
    if (!token) {
      setMensaje('No hay sesión activa. Por favor, inicia sesión.');
      return;
    }

    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/movimientos/${portafolioId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMovimientos(response.data);
    } catch (error) {
      console.error("Error al obtener los movimientos:", error);
      setMensaje('Error al obtener los movimientos: ' + (error.response?.data.error || 'Error desconocido'));
    }
  };

  const fetchCategorias = async () => {
    const token = localStorage.getItem("token"); // Obtén el token de autenticación
    if (!token) {
      setMensaje('No hay sesión activa. Por favor, inicia sesión.');
      return;
    }

    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/portafolios/${portafolioId}/categorias`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategoriasDisponibles(response.data); // Guardar las categorías disponibles
    } catch (error) {
      console.error("Error al obtener las categorías:", error);
      setMensaje('Error al obtener las categorías: ' + (error.response?.data.error || 'Error desconocido'));
    }
  };

  const fetchPortafolio = async () => {
    const token = localStorage.getItem("token"); // Obtén el token de autenticación
    if (!token) {
      setMensaje('No hay sesión activa. Por favor, inicia sesión.');
      return;
    }

    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/portafolios/${portafolioId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEsCompartido(response.data.tipo.includes("Compartido")); // Verificar si el portafolio es compartido
      setUsuariosDisponibles(response.data.usuarios); // Guardar los usuarios disponibles
      if (response.data.usuarios && response.data.usuarioActual) {
        const usuarioActual = response.data.usuarios.find(u => u._id === response.data.usuarioActual);
        if (usuarioActual) {
          setUsuarioActual(usuarioActual._id);
          setNuevoMovimiento(prev => ({
            ...prev,
            usuario: usuarioActual._id // Establecer el usuario actual por defecto
          }));
        }
      }
    } catch (error) {
      console.error("Error al obtener el portafolio:", error);
      setMensaje('Error al obtener el portafolio: ' + (error.response?.data.error || 'Error desconocido'));
    }
  };

  useEffect(() => {
    fetchMovimientos();
    fetchCategorias(); // Llamar a la función para obtener las categorías
    fetchPortafolio(); // Llamar a la función para obtener los detalles del portafolio
  }, [portafolioId]);

  const iniciarEdicion = (movimiento) => {
    setEditandoId(movimiento._id); // Establecer el ID del movimiento que se está editando
  };

  const manejarCambio = (e, movimiento) => {
    const { name, value } = e.target;
    setMovimientos(movimientos.map(mov =>
      mov._id === movimiento._id ? { ...mov, [name]: value } : mov
    ));
  };

  const guardarMovimiento = async (movimiento) => {
    const token = localStorage.getItem('token'); // Obtener el token del localStorage
    if (!token) {
      setMensaje('No hay sesión activa. Por favor, inicia sesión.');
      return;
    }

    try {
      const response = await axios.put(`${process.env.REACT_APP_BACKEND_URL}/api/movimientos/${movimiento._id}`, movimiento, {
        headers: {
          Authorization: `Bearer ${token}` // Enviar el token en el encabezado
        }
      });
      setMensaje('Movimiento actualizado exitosamente');
      setEditandoId(null); // Limpiar el estado de edición
      fetchMovimientos(); // Recargar los movimientos
    } catch (error) {
      console.error('Error al actualizar el movimiento:', error);
      setMensaje('Error al actualizar el movimiento: ' + (error.response?.data.error || 'Error desconocido'));
    }
  };

  const eliminarMovimiento = async (id) => {
    const token = localStorage.getItem('token'); // Obtener el token del localStorage
    if (!token) {
      setMensaje('No hay sesión activa. Por favor, inicia sesión.');
      return;
    }

    try {
      await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/api/movimientos/${id}`, {
        headers: {
          Authorization: `Bearer ${token}` // Enviar el token en el encabezado
        }
      });
      setMensaje('Movimiento eliminado exitosamente');
      fetchMovimientos(); // Recargar los movimientos
    } catch (error) {
      console.error('Error al eliminar el movimiento:', error);
      setMensaje('Error al eliminar el movimiento: ' + (error.response?.data.error || 'Error desconocido'));
    }
  };

  const agregarNuevoMovimiento = async () => {
    const token = localStorage.getItem('token'); // Obtener el token del localStorage
    if (!token) {
      setMensaje('No hay sesión activa. Por favor, inicia sesión.');
      return;
    }

    // Asegúrate de que la categoría se establezca como "Ingreso" si el tipo es "ingreso"
    const categoria = nuevoMovimiento.tipo === 'ingreso' ? 'Ingreso' : nuevoMovimiento.categoria;

    // Asegúrate de que el nuevo movimiento tenga todos los campos requeridos
    const movimientoData = {
      nombre: nuevoMovimiento.nombre,
      categoria: categoria,
      monto: parseFloat(nuevoMovimiento.monto), // Asegúrate de convertir el monto a número
      fecha: nuevoMovimiento.fecha,
      tipo: nuevoMovimiento.tipo, // Agregar el tipo de movimiento
      fijo: nuevoMovimiento.fijo,
      usuario: nuevoMovimiento.usuario, // Añadir el campo de usuario
      portafolio: portafolioId // Asegúrate de que este campo esté presente
    };

    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/movimientos`, movimientoData, {
        headers: {
          Authorization: `Bearer ${token}` // Enviar el token en el encabezado
        }
      });
      setMensaje('Movimiento agregado exitosamente');
      setNuevoMovimiento({ // Limpiar el estado del nuevo movimiento
        nombre: '',
        categoria: '',
        monto: '',
        fecha: new Date().toISOString().split('T')[0], // Establecer la fecha por defecto como hoy
        tipo: 'gasto', // Valor por defecto
        fijo: false,
        usuario: usuarioActual // Establecer el usuario actual por defecto
      });
      fetchMovimientos(); // Recargar los movimientos
    } catch (error) {
      console.error('Error al agregar el movimiento:', error);
      setMensaje('Error al agregar el movimiento: ' + (error.response?.data.error || 'Error desconocido'));
    }
  };

  const agregarNuevaCategoria = async () => {
    if (!nuevaCategoria.trim()) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('No hay sesión activa. Por favor, inicia sesión.');
        return;
      }

      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/portafolios/${portafolioId}/categorias`,
        { nombre: nuevaCategoria },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data && response.data.categoria) {
        const nuevaCategoriaData = response.data.categoria;

        setCategoriasDisponibles(prev => [...prev, nuevaCategoriaData]);
        setNuevoMovimiento(prev => ({
          ...prev,
          categoria: nuevaCategoriaData.nombre,
        }));

        setNuevaCategoria("");
        setMostrarInputNuevaCategoria(false);
      } else {
        alert('Error al agregar la nueva categoría.');
      }
    } catch (error) {
      console.error('Error al agregar la nueva categoría:', error);
      alert('Error al agregar la nueva categoría.');
    }
  };

  const ordenarMovimientos = (campo) => {
    const orden = ordenAscendente ? 1 : -1; // Determinar el orden
    const movimientosOrdenados = [...movimientos].sort((a, b) => {
      if (a[campo] < b[campo]) return -1 * orden;
      if (a[campo] > b[campo]) return 1 * orden;
      return 0;
    });
    setMovimientos(movimientosOrdenados);
    setOrdenAscendente(!ordenAscendente); // Cambiar el estado de orden
  };

  return (
    <div className="lista-movimientos-container">
      <h3>Movimientos del Portafolio</h3>
      {mensaje && <p className="mensaje">{mensaje}</p>} {/* Mostrar mensaje de error si existe */}
      <table className="table">
        <thead>
          <tr>
            <th onClick={() => ordenarMovimientos('nombre')}>Nombre</th>
            <th onClick={() => ordenarMovimientos('tipo')}>Tipo</th>
            <th onClick={() => ordenarMovimientos('categoria')}>Categoría</th>
            <th onClick={() => ordenarMovimientos('monto')}>Monto</th>
            <th onClick={() => ordenarMovimientos('fecha')}>Fecha</th>
            <th onClick={() => ordenarMovimientos('fijo')}>Gasto Fijo</th>
            {esCompartido && (
              <th onClick={() => ordenarMovimientos('usuario')}>Usuario</th>
            )}
            <th>Acciones</th> {/* Columna para acciones */}
          </tr>
        </thead>
        <tbody>
          {/* Fila para agregar un nuevo movimiento */}
          <tr>
            <td>
              <input
                type="text"
                name="nombre"
                value={nuevoMovimiento.nombre}
                onChange={(e) => setNuevoMovimiento({ ...nuevoMovimiento, nombre: e.target.value })}
                placeholder="Nombre"
              />
            </td>
            <td>
              <select
                name="tipo"
                value={nuevoMovimiento.tipo}
                onChange={(e) => setNuevoMovimiento({ ...nuevoMovimiento, tipo: e.target.value, categoria: "" })}
              >
                <option value="gasto">Gasto</option>
                <option value="ingreso">Ingreso</option>
              </select>
            </td>
            <td>
              {nuevoMovimiento.tipo === "gasto" ? (
                <>
                  <select
                    name="categoria"
                    value={nuevoMovimiento.categoria}
                    onChange={(e) => setNuevoMovimiento({ ...nuevoMovimiento, categoria: e.target.value })}
                  >
                    <option value="">Seleccionar categoría</option>
                    {categoriasDisponibles.map((cat, index) => (
                      <option key={index} value={cat.nombre}>{cat.nombre}</option>
                    ))}
                    <option value="nueva">+ Crear nueva categoría</option>
                  </select>
                  {nuevoMovimiento.categoria === "nueva" && (
                    <input
                      type="text"
                      placeholder="Nueva categoría"
                      value={nuevaCategoria}
                      onChange={(e) => setNuevaCategoria(e.target.value)}
                      onBlur={agregarNuevaCategoria} // Agregar la nueva categoría al salir del input
                    />
                  )}
                </>
              ) : (
                <input type="text" name="categoria" value="Ingreso" readOnly />
              )}
            </td>
            <td>
              <input
                type="number"
                name="monto"
                value={nuevoMovimiento.monto}
                onChange={(e) => setNuevoMovimiento({ ...nuevoMovimiento, monto: e.target.value })}
                placeholder="Monto"
              />
            </td>
            <td>
              <input
                type="date"
                name="fecha"
                value={nuevoMovimiento.fecha}
                onChange={(e) => setNuevoMovimiento({ ...nuevoMovimiento, fecha: e.target.value })}
              />
            </td>
            <td>
              <input
                type="checkbox"
                checked={nuevoMovimiento.fijo}
                onChange={(e) => setNuevoMovimiento({ ...nuevoMovimiento, fijo: e.target.checked })}
              />
            </td>
            {esCompartido && (
              <td>
                <select
                  name="usuario"
                  value={nuevoMovimiento.usuario}
                  onChange={(e) => setNuevoMovimiento({ ...nuevoMovimiento, usuario: e.target.value })}
                >
                  <option value="">Seleccionar usuario</option>
                  {usuariosDisponibles.map((usuario) => (
                    <option key={usuario._id} value={usuario._id}>{usuario.nombreUsuario}</option>
                  ))}
                </select>
              </td>
            )}
            <td>
              <button className="agregar" onClick={agregarNuevoMovimiento}>Agregar</button>
            </td>
          </tr>
          {movimientos.length === 0 ? (
            <tr>
              <td colSpan={esCompartido ? "8" : "7"}>No hay movimientos registrados.</td>
            </tr>
          ) : (
            movimientos.map((movimiento) => (
              <tr key={movimiento._id}>
                <td onDoubleClick={() => iniciarEdicion(movimiento)}>
                  {editandoId === movimiento._id ? (
                    <input
                      type="text"
                      name="nombre"
                      value={movimiento.nombre}
                      onChange={(e) => manejarCambio(e, movimiento)}
                    />
                  ) : (
                    movimiento.nombre
                  )}
                </td>
                <td onDoubleClick={() => iniciarEdicion(movimiento)}>
                  {editandoId === movimiento._id ? (
                    <select
                      name="tipo"
                      value={movimiento.tipo}
                      onChange={(e) => manejarCambio(e, movimiento)}
                    >
                      <option value="gasto">Gasto</option>
                      <option value="ingreso">Ingreso</option>
                    </select>
                  ) : (
                    movimiento.tipo
                  )}
                </td>
                <td onDoubleClick={() => iniciarEdicion(movimiento)}>
                  {editandoId === movimiento._id ? (
                    <select
                      name="categoria"
                      value={movimiento.categoria.nombre} // Asegúrate de que esto sea un solo valor
                      onChange={(e) => manejarCambio(e, movimiento)}
                    >
                      {categoriasDisponibles.map((cat, index) => (
                        <option key={index} value={cat.nombre}>{cat.nombre}</option>
                      ))}
                    </select>
                  ) : (
                    movimiento.categoria // Asegúrate de acceder a la propiedad correcta
                  )}
                </td>
                <td onDoubleClick={() => iniciarEdicion(movimiento)}>
                  {editandoId === movimiento._id ? (
                    <input
                      type="number"
                      name="monto"
                      value={movimiento.monto}
                      onChange={(e) => manejarCambio(e, movimiento)}
                    />
                  ) : (
                    `$${movimiento.monto}`
                  )}
                </td>
                <td onDoubleClick={() => iniciarEdicion(movimiento)}>
                  {editandoId === movimiento._id ? (
                    <input
                      type="date"
                      name="fecha"
                      value={movimiento.fecha}
                      onChange={(e) => manejarCambio(e, movimiento)}
                    />
                  ) : (
                    new Date(movimiento.fecha).toLocaleDateString()
                  )}
                </td>
                <td onDoubleClick={() => iniciarEdicion(movimiento)}>
                  {movimiento.fijo ? "Sí" : "No"}
                </td>
                {esCompartido && (
                  <td onDoubleClick={() => iniciarEdicion(movimiento)}>
                    {editandoId === movimiento._id ? (
                      <select
                        name="usuario"
                        value={movimiento.usuario ? movimiento.usuario._id : ''}
                        onChange={(e) => manejarCambio(e, movimiento)}
                      >
                        <option value="">Seleccionar usuario</option>
                        {usuariosDisponibles.map((usuario) => (
                          <option key={usuario._id} value={usuario._id}>{usuario.nombreUsuario}</option>
                        ))}
                      </select>
                    ) : (
                      movimiento.usuario ? movimiento.usuario.nombreUsuario : ''
                    )}
                  </td>
                )}
                <td>
                  {editandoId === movimiento._id ? (
                    <button className="editar" onClick={() => guardarMovimiento(movimiento)}>Guardar</button>
                  ) : (
                    <button className="editar" onClick={() => iniciarEdicion(movimiento)}>Editar</button>
                  )}
                  <button className="eliminar" onClick={() => eliminarMovimiento(movimiento._id)}>Eliminar</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ListaMovimientos;