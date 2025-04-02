import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/ListaMovimientos.css";

const ListaMovimientos = ({ portafolioId, onActualizacion }) => {
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // En las funciones donde se crean/actualizan/eliminan movimientos, añade:


  const fetchMovimientos = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No hay token disponible');

      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/movimientos/${portafolioId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      setMovimientos(Array.isArray(response.data) ? response.data : []);
      
    } catch (err) {
      console.error('Error al obtener movimientos:', err);
      setError(err.response?.data?.error || err.message);
      
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCategorias = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No hay token disponible');
      return;
    }

    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/portafolios/${portafolioId}/categorias`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      setCategoriasDisponibles(response.data || []);
    } catch (error) {
      console.error("Error al obtener categorías:", error);
      if (error.response?.status === 401) {
        // Manejar token expirado/inválido
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
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
      onActualizacion('movimientos');
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
      onActualizacion('movimientos');
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
      onActualizacion('movimientos');
    } catch (error) {
      console.error('Error al agregar el movimiento:', error);
      setMensaje('Error al agregar el movimiento: ' + (error.response?.data.error || 'Error desconocido'));
    }
  };

  const agregarNuevaCategoria = async () => {
    const nombreCategoria = nuevaCategoria.trim();

    if (!nombreCategoria) {
      setMensaje('El nombre no puede estar vacío');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMensaje('Sesión expirada. Por favor, vuelve a iniciar sesión.');
        return;
      }

      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/portafolios/${portafolioId}/categorias`,
        { nombre: nombreCategoria },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        // Actualizar el estado
        setCategoriasDisponibles(prev => [...prev, response.data.categoria]);
        setNuevoMovimiento(prev => ({
          ...prev,
          categoria: response.data.categoria.nombre
        }));
        setNuevaCategoria('');
        setMostrarInputNuevaCategoria(false);
        setMensaje(response.data.message);
        onActualizacion('categorias');
      }
    } catch (error) {
      let errorMsg = 'Error al crear categoría';

      if (error.response) {
        if (error.response.status === 409) {
          errorMsg = 'Ya existe una categoría con ese nombre';
        } else if (error.response.data?.error) {
          errorMsg = error.response.data.error;
        }
      }

      setMensaje(errorMsg);
      console.error('Error:', error.response?.data || error.message);
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

  if (loading) {
    return <div className="loading-message">Cargando movimientos...</div>;
  }

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }
  
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
                    onChange={(e) => {
                      if (e.target.value === "nueva") {
                        setMostrarInputNuevaCategoria(true);
                      } else {
                        setNuevoMovimiento({ ...nuevoMovimiento, categoria: e.target.value });
                      }
                    }}
                  >
                    <option value="">Seleccionar categoría</option>
                    {categoriasDisponibles.map((cat, index) => (
                      <option key={index} value={cat.nombre}>{cat.nombre}</option>
                    ))}
                    <option value="nueva">+ Crear nueva categoría</option>
                  </select>

                  {mostrarInputNuevaCategoria && (
                    <div className="nueva-categoria-input">
                      <input
                        type="text"
                        placeholder="Nombre de la nueva categoría"
                        value={nuevaCategoria}
                        onChange={(e) => setNuevaCategoria(e.target.value)}
                      />
                      <button onClick={agregarNuevaCategoria}>Crear</button>
                      <button onClick={() => setMostrarInputNuevaCategoria(false)}>Cancelar</button>
                    </div>
                  )}


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