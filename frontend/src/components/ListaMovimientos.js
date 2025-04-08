import React, { useEffect, useState } from "react";
import api from "../utlis/api"; // Asegúrate de que la ruta sea correcta
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
  const [ordenAscendente, setOrdenAscendente] = useState(true);
  const [campoOrdenado, setCampoOrdenado] = useState('fecha'); // Campo ordenado por defecto
  const [esCompartido, setEsCompartido] = useState(false); // Estado para determinar si el portafolio es compartido
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mostrarModalNuevaCategoria, setMostrarModalNuevaCategoria] = useState(false);
  const [mostrarModalCategorias, setMostrarModalCategorias] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [categoriaEditando, setCategoriaEditando] = useState(null);
  const [nuevoNombreCategoria, setNuevoNombreCategoria] = useState('');
  const [modalCategorias, setModalCategorias] = useState({
    visible: false,
    mensaje: '',
    confirmacionEliminar: null
  });
  const [movimientoDesplegado, setMovimientoDesplegado] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  // Detectamos el tamaño de pantalla
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);


  const fetchMovimientos = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No hay token disponible');

      const response = await api.get(
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
      const response = await api.get(
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
      const response = await api.get(`${process.env.REACT_APP_BACKEND_URL}/api/portafolios/${portafolioId}`, {
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

  // Cargar categorías al montar el componente
  useEffect(() => {
    const cargarCategorias = async () => {
      try {
        const response = await api.get(`/api/portafolios/${portafolioId}/categorias`);
        setCategorias(response.data);
        setCategoriasDisponibles(response.data);
      } catch (error) {
        console.error('Error al cargar categorías:', error);
      }
    };

    if (portafolioId) cargarCategorias();
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
      const response = await api.put(`${process.env.REACT_APP_BACKEND_URL}/api/movimientos/${movimiento._id}`, movimiento, {
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
      await api.delete(`${process.env.REACT_APP_BACKEND_URL}/api/movimientos/${id}`, {
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
      const response = await api.post(`${process.env.REACT_APP_BACKEND_URL}/api/movimientos`, movimientoData, {
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

      const response = await api.post(
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
    // Si es el mismo campo, cambiamos la dirección
    const esMismoCampo = campo === campoOrdenado;
    const nuevaDireccion = esMismoCampo ? !ordenAscendente : true;

    // Aplicar tu lógica de ordenación
    const orden = nuevaDireccion ? 1 : -1;
    const movimientosOrdenados = [...movimientos].sort((a, b) => {
      if (a[campo] < b[campo]) return -1 * orden;
      if (a[campo] > b[campo]) return 1 * orden;
      return 0;
    });

    // Actualizar estados
    setMovimientos(movimientosOrdenados);
    setOrdenAscendente(nuevaDireccion);
    setCampoOrdenado(campo);
  };

  const cargarCategorias = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await api.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/portafolios/${portafolioId}/categorias`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setCategorias(response.data || []);
      setCategoriasDisponibles(response.data || []);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    // Puedes agregar aquí cualquier otra lógica de limpieza necesaria
  };

  const agregarCategoria = async () => {
    const nombreCategoria = nuevaCategoria.trim();

    if (!nombreCategoria) {
      setModalCategorias({
        ...modalCategorias,
        mensaje: {
          texto: 'El nombre de la categoría no puede estar vacío',
          tipo: 'error'
        }
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No hay token disponible');

      const response = await api.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/portafolios/${portafolioId}/categorias`,
        { nombre: nombreCategoria },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Acceso CORRECTO a los datos de la categoría
      const categoriaAgregada = response.data.categoria;
      const nombreCategoriaAgregada = categoriaAgregada.nombre;

      // Actualizar el estado de categorías
      setCategorias(prev => [...prev, categoriaAgregada]);
      setNuevaCategoria('');

      // Mostrar mensaje de éxito con el nombre correcto
      setModalCategorias({
        ...modalCategorias,
        mensaje: {
          texto: `Categoría "${nombreCategoriaAgregada}" agregada correctamente`,
          tipo: 'exito'
        }
      });

      // Actualizar el selector de categorías en el formulario
      setNuevoMovimiento(prev => ({
        ...prev,
        categoria: nombreCategoriaAgregada
      }));

      // Forzar actualización del header (opcional)
      setCampoOrdenado(prev => prev === 'categoria' ? 'nombre' : 'categoria');
      setTimeout(() => setCampoOrdenado('categoria'), 50);

    } catch (error) {
      let errorMsg = 'Error al agregar categoría';

      if (error.response) {
        if (error.response.status === 409) {
          errorMsg = 'Ya existe una categoría con ese nombre';
        } else if (error.response.data?.error) {
          errorMsg = error.response.data.error;
        }
      }

      setModalCategorias({
        ...modalCategorias,
        mensaje: {
          texto: errorMsg,
          tipo: 'error'
        }
      });
    }
  };

  const guardarEdicionCategoria = async () => {
    try {
      await api.put(`/api/portafolios/${portafolioId}/categorias/${categoriaEditando._id}`, {
        nombre: nuevoNombreCategoria.trim()
      });

      // Actualizar ambos estados
      const nuevasCategorias = categorias.map(cat =>
        cat._id === categoriaEditando._id ? { ...cat, nombre: nuevoNombreCategoria.trim() } : cat
      );

      setCategorias(nuevasCategorias);
      setCategoriasDisponibles(nuevasCategorias);
      setCategoriaEditando(null);

      setModalCategorias({
        ...modalCategorias,
        mensaje: {
          texto: 'Categoría actualizada correctamente',
          tipo: 'exito'
        }
      });

    } catch (error) {
      setModalCategorias({
        ...modalCategorias,
        mensaje: {
          texto: error.response?.data?.error || 'Error al actualizar categoría',
          tipo: 'error'
        }
      });
    }
  };

  const eliminarCategoria = async (id) => {
    try {
      await api.delete(`/api/portafolios/${portafolioId}/categorias/${id}`);

      // Actualizar ambos estados
      const nuevasCategorias = categorias.filter(cat => cat._id !== id);
      setCategorias(nuevasCategorias);
      setCategoriasDisponibles(nuevasCategorias);

      // Cerrar el modal de confirmación y mostrar mensaje
      setModalCategorias({
        visible: true, // Mantener el modal abierto
        mensaje: {
          texto: 'Categoría eliminada correctamente',
          tipo: 'exito'
        },
        confirmacionEliminar: null // Limpiar la confirmación
      });

    } catch (error) {
      setModalCategorias({
        ...modalCategorias,
        mensaje: {
          texto: error.response?.data?.error || 'Error al eliminar categoría',
          tipo: 'error'
        },
        confirmacionEliminar: null // Limpiar la confirmación incluso en caso de error
      });
    }
  };

  // Función para mostrar el modal
  const abrirModalCategorias = (e) => {
    e.stopPropagation();
    setModalCategorias({
      visible: true,
      mensaje: '',
      confirmacionEliminar: null
    });
  };

  // Versión desktop (tabla completa)
  const renderDesktopView = () => (
    <table className="table">
      <thead>
        <tr>
          <th onClick={() => ordenarMovimientos('nombre')}>
            Nombre
            {campoOrdenado === 'nombre' && (
              <span className="icono-orden">
                {ordenAscendente ? '↑' : '↓'}
              </span>
            )}
          </th>
          <th onClick={() => ordenarMovimientos('tipo')}>
            Tipo
            {campoOrdenado === 'tipo' && (
              <span className="icono-orden">
                {ordenAscendente ? '↑' : '↓'}
              </span>
            )}
          </th>
          <th onClick={() => ordenarMovimientos('categoria')}>
            <div className="categoria-header-container">
              <div className="categoria-header-content">
                <span className="categoria-titulo">
                  Categoría
                </span>
                {campoOrdenado === 'categoria' && (
                  <span className="icono-orden">
                    {ordenAscendente ? '↑' : '↓'}
                  </span>
                )}
              </div>
              <button
                className="categoria-menu-button"
                onClick={(e) => {
                  e.stopPropagation();
                  abrirModalCategorias(e);
                }}
                aria-label="Gestionar categorías"
              >
                <span className="puntos-verticales">⋮</span>
              </button>
            </div>
          </th>
          <th onClick={() => ordenarMovimientos('monto')}>
            Monto
            {campoOrdenado === 'monto' && (
              <span className="icono-orden">
                {ordenAscendente ? '↑' : '↓'}
              </span>
            )}
          </th>
          <th onClick={() => ordenarMovimientos('fecha')}>
            Fecha
            {campoOrdenado === 'fecha' && (
              <span className="icono-orden">
                {ordenAscendente ? '↑' : '↓'}
              </span>
            )}
          </th>
          <th onClick={() => ordenarMovimientos('fijo')}>
            Gasto Fijo
            {campoOrdenado === 'fijo' && (
              <span className="icono-orden">
                {ordenAscendente ? '↑' : '↓'}
              </span>
            )}
          </th>
          {esCompartido && (
            <th onClick={() => ordenarMovimientos('usuario')}>
              Usuario
              {campoOrdenado === 'usuario' && (
                <span className="icono-orden">
                  {ordenAscendente ? '↑' : '↓'}
                </span>
              )}
            </th>
          )}
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {/* Fila para agregar un nuevo movimiento */}
        <tr>
          <td data-label="Nombre">
            <input
              type="text"
              name="nombre"
              value={nuevoMovimiento.nombre}
              onChange={(e) => setNuevoMovimiento({ ...nuevoMovimiento, nombre: e.target.value })}
              placeholder="Nombre"
            />
          </td>
          <td data-label="Tipo">
            <select
              name="tipo"
              value={nuevoMovimiento.tipo}
              onChange={(e) => setNuevoMovimiento({ ...nuevoMovimiento, tipo: e.target.value, categoria: "" })}
            >
              <option value="gasto">Gasto</option>
              <option value="ingreso">Ingreso</option>
            </select>
          </td>
          <td data-label="Categoria">
            {nuevoMovimiento.tipo === "gasto" ? (
              <>
                <select
                  name="categoria"
                  value={nuevoMovimiento.categoria}
                  onChange={(e) => {
                    if (e.target.value === "nueva") {
                      setMostrarModalNuevaCategoria(true);
                    } else {
                      setNuevoMovimiento({ ...nuevoMovimiento, categoria: e.target.value });
                    }
                  }}
                  className="select-categoria"
                >
                  <option value="">Seleccionar categoría</option>
                  {categoriasDisponibles.map((cat, index) => (
                    <option key={index} value={cat.nombre}>{cat.nombre}</option>
                  ))}
                  <option value="nueva">+ Crear nueva categoría</option>
                </select>

                {/* Modal para nueva categoría */}
                {mostrarModalNuevaCategoria && (
                  <div className="modal-overlay">
                    <div className="modal-categoria">
                      <h3>Crear Nueva Categoría</h3>
                      <input
                        type="text"
                        placeholder="Nombre de la nueva categoría"
                        value={nuevaCategoria}
                        onChange={(e) => setNuevaCategoria(e.target.value)}
                        className="input-categoria"
                        autoFocus
                      />
                      <div className="modal-actions">
                        <button
                          onClick={() => {
                            agregarNuevaCategoria();
                            setMostrarModalNuevaCategoria(false);
                          }}
                          className="btn-primary"
                          disabled={!nuevaCategoria.trim()}
                        >
                          Crear
                        </button>
                        <button
                          onClick={() => {
                            setMostrarModalNuevaCategoria(false);
                            setNuevaCategoria("");
                          }}
                          className="btn-secondary"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </td>
          <td data-label="Monto">
            <input
              type="number"
              name="monto"
              value={nuevoMovimiento.monto}
              onChange={(e) => setNuevoMovimiento({ ...nuevoMovimiento, monto: e.target.value })}
              placeholder="Monto"
            />
          </td>
          <td data-label="Fecha">
            <input
              type="date"
              name="fecha"
              value={nuevoMovimiento.fecha}
              onChange={(e) => setNuevoMovimiento({ ...nuevoMovimiento, fecha: e.target.value })}
            />
          </td>
          <td data-label="Fijo">
            <input
              type="checkbox"
              checked={nuevoMovimiento.fijo}
              onChange={(e) => setNuevoMovimiento({ ...nuevoMovimiento, fijo: e.target.checked })}
            />
          </td>
          {esCompartido && (
            <td data-label="Usuario">
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
          <td data-label="Acciones">
            <button className="agregar" onClick={agregarNuevoMovimiento}>Agregar</button>
          </td>
        </tr>
      </tbody>

      <tbody>
        {movimientos.length === 0 ? (
          <tr>
            <td colSpan={esCompartido ? "8" : "7"}>No hay movimientos registrados.</td>
          </tr>
        ) : (
          movimientos.map((movimiento) => (
            <tr key={movimiento._id}>
              <td data-label="Nombre" onDoubleClick={() => iniciarEdicion(movimiento)}>
                {editandoId === movimiento._id ? (
                  <input
                    type="text"
                    value={movimiento.nombre}
                    onChange={(e) => manejarCambio(e, movimiento)}
                  />
                ) : (
                  movimiento.nombre
                )}
              </td>
              <td data-label="Tipo" onDoubleClick={() => iniciarEdicion(movimiento)}>
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
              <td data-label="Categoria" onDoubleClick={() => iniciarEdicion(movimiento)}>
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
              <td data-label="Monto" onDoubleClick={() => iniciarEdicion(movimiento)}>
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
              <td data-label="Fecha" onDoubleClick={() => iniciarEdicion(movimiento)}>
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
              <td data-label="Fijo" onDoubleClick={() => iniciarEdicion(movimiento)}>
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
  );

  const toggleFormulario = () => {
    setMostrarFormulario(!mostrarFormulario);
    // Si estamos cerrando el formulario, limpiamos los campos
    if (mostrarFormulario) {
      setNuevoMovimiento({
        nombre: '',
        tipo: 'gasto',
        categoria: '',
        monto: 0,
        fecha: new Date().toISOString().split('T')[0],
        fijo: false,
        usuario: ''
      });
    }
  };

  // Versión móvil (lista compacta con despliegue)
  const renderMobileView = () => (
    <div className="mobile-view-container">
      {/* Formulario desplegable para nuevo movimiento */}
      <div className={`formulario-movil ${mostrarFormulario ? 'desplegado' : ''}`}>
        <div className="encabezado-formulario" onClick={toggleFormulario}>
          <h3>Añadir Movimiento</h3>
          <span className="icono-desplegable">
            {mostrarFormulario ? '▼' : '▼'}
          </span>
        </div>

        {mostrarFormulario && (
          <div className="contenido-formulario">
            <div className="campo-formulario">
              <label>Nombre</label>
              <input
                type="text"
                value={nuevoMovimiento.nombre}
                onChange={(e) => setNuevoMovimiento({ ...nuevoMovimiento, nombre: e.target.value })}
                placeholder="Nombre del movimiento"
              />
            </div>

            <div className="campo-formulario">
              <label>Tipo</label>
              <select
                value={nuevoMovimiento.tipo}
                onChange={(e) => setNuevoMovimiento({ ...nuevoMovimiento, tipo: e.target.value, categoria: "" })}
              >
                <option value="gasto">Gasto</option>
                <option value="ingreso">Ingreso</option>
              </select>
            </div>

            {nuevoMovimiento.tipo === "gasto" && (
              <div className="campo-formulario">
                <label>Categoría</label>
                <div className="select-container">
                  <select
                    value={nuevoMovimiento.categoria}
                    onChange={(e) => {
                      if (e.target.value === "nueva") {
                        setMostrarModalNuevaCategoria(true);
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
                </div>
              </div>
            )}

            <div className="campo-formulario">
              <label>Monto</label>
              <input
                type="number"
                value={nuevoMovimiento.monto}
                onChange={(e) => setNuevoMovimiento({ ...nuevoMovimiento, monto: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div className="campo-formulario">
              <label>Fecha</label>
              <input
                type="date"
                value={nuevoMovimiento.fecha}
                onChange={(e) => setNuevoMovimiento({ ...nuevoMovimiento, fecha: e.target.value })}
              />
            </div>

            <div className="campo-formulario checkbox-container">
              <label>
                <input
                  type="checkbox"
                  checked={nuevoMovimiento.fijo}
                  onChange={(e) => setNuevoMovimiento({ ...nuevoMovimiento, fijo: e.target.checked })}
                />
                <span>Movimiento fijo</span>
              </label>
            </div>

            {esCompartido && (
              <div className="campo-formulario">
                <label>Usuario</label>
                <select
                  value={nuevoMovimiento.usuario}
                  onChange={(e) => setNuevoMovimiento({ ...nuevoMovimiento, usuario: e.target.value })}
                >
                  <option value="">Seleccionar usuario</option>
                  {usuariosDisponibles.map((usuario) => (
                    <option key={usuario._id} value={usuario._id}>{usuario.nombreUsuario}</option>
                  ))}
                </select>
              </div>
            )}

            <button
              className="boton-agregar"
              onClick={agregarNuevoMovimiento}
              disabled={!nuevoMovimiento.nombre || !nuevoMovimiento.monto}
            >
              Agregar Movimiento
            </button>
          </div>
        )}
      </div>

      {/* Modal para nueva categoría */}
      {mostrarModalNuevaCategoria && (
        <div className="modal-overlay">
          <div className="modal-categoria">
            <h3>Crear Nueva Categoría</h3>
            <input
              type="text"
              placeholder="Nombre de la nueva categoría"
              value={nuevaCategoria}
              onChange={(e) => setNuevaCategoria(e.target.value)}
              className="input-categoria"
              autoFocus
            />
            <div className="modal-actions">
              <button
                onClick={() => {
                  agregarNuevaCategoria();
                  setMostrarModalNuevaCategoria(false);
                }}
                className="btn-primary"
                disabled={!nuevaCategoria.trim()}
              >
                Crear
              </button>
              <button
                onClick={() => {
                  setMostrarModalNuevaCategoria(false);
                  setNuevaCategoria("");
                }}
                className="btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de movimientos */}
      <div className="movimientos-lista">
        {movimientos.length === 0 ? (
          <div className="no-movimientos">No hay movimientos registrados.</div>
        ) : (
          movimientos.map((movimiento) => (
            <div key={movimiento._id} className={`movimiento-item ${movimientoDesplegado === movimiento._id ? 'desplegado' : ''}`}>
              <div
                className="movimiento-header"
                onClick={() => setMovimientoDesplegado(movimientoDesplegado === movimiento._id ? null : movimiento._id)}
              >
                <div className="movimiento-nombre">
                  {movimiento.nombre}
                  <span className={`movimiento-icono ${movimiento.tipo === 'gasto' ? 'gasto' : 'ingreso'}`}>
                    {movimiento.tipo === 'gasto' ? '↓' : '↑'}
                  </span>
                </div>
                <div className="movimiento-monto">
                  ${movimiento.monto.toLocaleString()}
                </div>
                <div className="movimiento-flecha">
                  {movimientoDesplegado === movimiento._id ? <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-info-circle" viewBox="0 0 16 16">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                    <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0" />
                  </svg> : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-info-circle" viewBox="0 0 16 16">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                    <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0" />
                  </svg>}
                </div>
              </div>

              {movimientoDesplegado === movimiento._id && (
                <div className="movimiento-detalles">
                  <div className="detalle-fila">
                    <span className="detalle-etiqueta">Tipo:</span>
                    {editandoId === movimiento._id ? (
                      <select
                        name="tipo"
                        value={movimiento.tipo}
                        onChange={(e) => manejarCambio(e, movimiento)}
                        className="detalle-valor"
                      >
                        <option value="gasto">Gasto</option>
                        <option value="ingreso">Ingreso</option>
                      </select>
                    ) : (
                      <span className="detalle-valor">{movimiento.tipo}</span>
                    )}
                  </div>

                  <div className="detalle-fila">
                    <span className="detalle-etiqueta">Categoría:</span>
                    {editandoId === movimiento._id ? (
                      <select
                        name="categoria"
                        value={movimiento.categoria}
                        onChange={(e) => manejarCambio(e, movimiento)}
                        className="detalle-valor"
                      >
                        {categoriasDisponibles.map((cat, index) => (
                          <option key={index} value={cat.nombre}>{cat.nombre}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="detalle-valor">{movimiento.categoria}</span>
                    )}
                  </div>

                  <div className="detalle-fila">
                    <span className="detalle-etiqueta">Fecha:</span>
                    {editandoId === movimiento._id ? (
                      <input
                        type="date"
                        name="fecha"
                        value={movimiento.fecha}
                        onChange={(e) => manejarCambio(e, movimiento)}
                        className="detalle-valor"
                      />
                    ) : (
                      <span className="detalle-valor">
                        {new Date(movimiento.fecha).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <div className="detalle-fila">
                    <span className="detalle-etiqueta">Fijo:</span>
                    <span className="detalle-valor">
                      {movimiento.fijo ? "Sí" : "No"}
                    </span>
                  </div>

                  {esCompartido && (
                    <div className="detalle-fila">
                      <span className="detalle-etiqueta">Usuario:</span>
                      {editandoId === movimiento._id ? (
                        <select
                          name="usuario"
                          value={movimiento.usuario ? movimiento.usuario._id : ''}
                          onChange={(e) => manejarCambio(e, movimiento)}
                          className="detalle-valor"
                        >
                          <option value="">Seleccionar usuario</option>
                          {usuariosDisponibles.map((usuario) => (
                            <option key={usuario._id} value={usuario._id}>{usuario.nombreUsuario}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="detalle-valor">
                          {movimiento.usuario ? movimiento.usuario.nombreUsuario : 'Sin asignar'}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="movimiento-acciones">
                    {editandoId === movimiento._id ? (
                      <>
                        <button
                          className="accion-btn guardar"
                          onClick={() => guardarMovimiento(movimiento)}
                        >
                          Guardar
                        </button>
                        <button
                          className="accion-btn cancelar"
                          onClick={cancelarEdicion}
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="accion-btn editar"
                          onClick={() => iniciarEdicion(movimiento)}
                        >
                          Editar
                        </button>
                        <button
                          className="accion-btn eliminar"
                          onClick={() => eliminarMovimiento(movimiento._id)}
                        >
                          Eliminar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
  
  if (loading) {
    return <div className="loading-message">Cargando movimientos...</div>;
  }

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  return (
    <div className="lista-movimientos-container">
      <h3>Movimientos del Portafolio</h3>
      {mensaje && (
        <div className={`portfolio-message ${mensaje.includes('exitosamente') ? 'portfolio-message-success' : 'portfolio-message-error'
          }`}>
          {mensaje}
          <button
            className="portfolio-close-button"
            onClick={() => setMensaje('')}
            aria-label="Cerrar mensaje"
          >
            ×
          </button>
        </div>
      )}

      {isMobile ? renderMobileView() : renderDesktopView()}

      {modalCategorias.visible && (
        <div className="modal-overlay" onClick={() => setModalCategorias({ ...modalCategorias, visible: false })}>
          <div className="modal-categorias-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-categorias-header">
              <h3>Gestionar Categorías</h3>
              <button
                className="cerrar-modal"
                onClick={() => setModalCategorias({ ...modalCategorias, visible: false })}
              >
                &times;
              </button>
            </div>

            {modalCategorias.mensaje && (
              <div className={`modal-mensaje ${modalCategorias.mensaje.tipo}`}>
                {modalCategorias.mensaje.texto}
              </div>
            )}

            {/* Confirmación de eliminación */}
            {modalCategorias.confirmacionEliminar && (
              <div className="confirmacion-eliminar">
                <p>¿Estás seguro de eliminar la categoría "{modalCategorias.confirmacionEliminar.nombre}"?</p>
                <div className="confirmacion-botones">
                  <button
                    className="btn-confirmar"
                    onClick={() => {
                      eliminarCategoria(modalCategorias.confirmacionEliminar.id);
                      setModalCategorias({ ...modalCategorias, confirmacionEliminar: null });
                    }}
                  >
                    Eliminar
                  </button>
                  <button
                    className="btn-cancelar"
                    onClick={() => setModalCategorias({ ...modalCategorias, confirmacionEliminar: null })}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Lista de categorías */}
            <div className="lista-categorias">
              {categorias.map(categoria => (
                <div key={categoria._id} className="categoria-item">
                  {categoriaEditando?._id === categoria._id ? (
                    <input
                      type="text"
                      value={nuevoNombreCategoria}
                      onChange={(e) => setNuevoNombreCategoria(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && guardarEdicionCategoria()}
                      autoFocus
                      className="input-edicion-categoria"
                    />
                  ) : (
                    <span className="categoria-nombre">{categoria.nombre}</span>
                  )}

                  <div className="categoria-acciones">
                    {categoriaEditando?._id === categoria._id ? (
                      <>
                        <button
                          className="btn-guardar"
                          onClick={guardarEdicionCategoria}
                          disabled={!nuevoNombreCategoria.trim()}
                        >
                          Guardar
                        </button>
                        <button
                          className="btn-cancelar"
                          onClick={() => setCategoriaEditando(null)}
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="btn-editar"
                          onClick={() => {
                            setCategoriaEditando(categoria);
                            setNuevoNombreCategoria(categoria.nombre);
                          }}
                        >
                          Editar
                        </button>
                        <button
                          className="btn-eliminar"
                          onClick={() => setModalCategorias({
                            ...modalCategorias,
                            confirmacionEliminar: {
                              id: categoria._id,
                              nombre: categoria.nombre
                            }
                          })}
                        >
                          Eliminar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Formulario para nueva categoría */}
            <div className="nueva-categoria-form">
              <input
                type="text"
                placeholder="Nueva categoría"
                value={nuevaCategoria}
                onChange={(e) => setNuevaCategoria(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && agregarCategoria()}
                className="input-nueva-categoria"
              />
              <button
                className="btn-agregar"
                onClick={agregarCategoria}
                disabled={!nuevaCategoria.trim()}
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ListaMovimientos;