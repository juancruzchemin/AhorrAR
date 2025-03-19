import React, { useEffect, useState } from 'react';
import '../styles/ConfiguracionCategorias.css'; // Asegúrate de que la ruta sea correcta
import axios from 'axios';
import {jwtDecode} from 'jwt-decode'; // Importación correcta
import Modal from './Modal-Edit'; // Importar el componente Modal

const ConfiguracionCategorias = ({ portafolioId }) => {
  const [categoriasLocal, setCategoriasLocal] = useState([]); // Estado local para manejar las categorías como un array
  const [nuevaCategoria, setNuevaCategoria] = useState(''); // Estado para la nueva categoría
  const [mensajeAdvertencia, setMensajeAdvertencia] = useState('');
  const [gastosPorCategoria, setGastosPorCategoria] = useState({}); // Estado para almacenar los gastos por categoría
  const [totalIngreso, setTotalIngreso] = useState(0); // Estado para almacenar el total de ingresos
  const [modalAbierto, setModalAbierto] = useState(false); // Estado para controlar la visibilidad del modal
  const [categoriaEditando, setCategoriaEditando] = useState(null); // Estado para la categoría que se está editando
  const [nuevoNombre, setNuevoNombre] = useState(''); // Estado para el nuevo nombre de la categoría

  // Función para verificar si el token ha expirado
  const isTokenExpired = (token) => {
    if (!token) return true; // Si no hay token, se considera expirado

    try {
      const decodedToken = jwtDecode(token);
      const currentTime = Date.now() / 1000; // Tiempo actual en segundos

      // Si la fecha de expiración es menor que el tiempo actual, el token ha expirado
      return decodedToken.exp < currentTime;
    } catch (error) {
      console.error('Error al decodificar el token:', error);
      return true; // Si hay un error, se considera expirado
    }
  };

  // Función para verificar el token y redirigir al usuario si ha expirado
  const checkTokenAndRedirect = () => {
    const token = localStorage.getItem('token');

    if (!token || isTokenExpired(token)) {
      alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      localStorage.removeItem('token'); // Elimina el token expirado
      window.location.href = '/login'; // Redirige al usuario a la página de inicio de sesión
      return true; // Indica que el token ha expirado
    }

    return false; // El token es válido
  };

  // Obtener las categorías y los movimientos al cargar el componente
  useEffect(() => {
    if (checkTokenAndRedirect()) return; // Verifica el token antes de continuar

    const fetchData = async () => {
      const token = localStorage.getItem('token'); // Obtener el token del localStorage
      if (!token) {
        alert('No hay sesión activa. Por favor, inicia sesión.');
        return;
      }

      try {
        // Obtener las categorías
        const categoriasResponse = await axios.get(
          `http://localhost:5000/api/portafolios/${portafolioId}/categorias`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setCategoriasLocal(categoriasResponse.data);

        // Obtener los movimientos
        const movimientosResponse = await axios.get(
          `http://localhost:5000/api/movimientos/${portafolioId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // Calcular los gastos por categoría y el total de ingresos
        const gastosTemp = {};
        let totalIngresos = 0;
        movimientosResponse.data.forEach(movimiento => {
          if (movimiento.tipo === 'gasto') {
            movimiento.categoria.forEach(cat => {
              gastosTemp[cat] = (gastosTemp[cat] || 0) + movimiento.monto;
            });
          } else if (movimiento.tipo === 'ingreso') {
            totalIngresos += movimiento.monto;
          }
        });
        setGastosPorCategoria(gastosTemp);
        setTotalIngreso(totalIngresos);
      } catch (error) {
        if (error.response && error.response.status === 401) {
          checkTokenAndRedirect(); // Redirige si el servidor devuelve un error 401
        } else {
          console.error('Error al obtener datos:', error);
          alert('Error al obtener datos: ' + (error.response?.data.error || 'Error desconocido'));
        }
      }
    };

    fetchData();
  }, [portafolioId]);

  // Función para agregar una nueva categoría
  const agregarNuevaCategoria = async () => {
    if (checkTokenAndRedirect()) return; // Verifica el token antes de continuar

    if (!nuevaCategoria.trim()) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('No hay sesión activa. Por favor, inicia sesión.');
        return;
      }

      const response = await axios.post(
        `http://localhost:5000/api/portafolios/${portafolioId}/categorias`,
        { nombre: nuevaCategoria },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data && response.data.categoria) {
        const nuevaCategoriaData = response.data.categoria;
        setCategoriasLocal(prev => [...prev, nuevaCategoriaData]);
        setNuevaCategoria('');
        window.location.reload(); // Recargar la página
      } else {
        alert('Error al agregar la nueva categoría: respuesta inesperada del servidor.');
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        checkTokenAndRedirect(); // Redirige si el servidor devuelve un error 401
      } else {
        console.error('Error al agregar la nueva categoría:', error);
        alert('Error al agregar la nueva categoría: ' + (error.response?.data.error || 'Error desconocido'));
      }
    }
  };

  // Función para abrir el modal de edición
  const abrirModalEdicion = (categoria) => {
    setCategoriaEditando(categoria);
    setNuevoNombre(categoria.nombre);
    setModalAbierto(true);
  };

  // Función para cerrar el modal de edición
  const cerrarModalEdicion = () => {
    setModalAbierto(false);
    setCategoriaEditando(null);
    setNuevoNombre('');
  };

  // Función para guardar los cambios de la categoría editada
  const guardarCategoriaEditada = async () => {
    if (checkTokenAndRedirect()) return; // Verifica el token antes de continuar

    if (!nuevoNombre.trim()) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('No hay sesión activa. Por favor, inicia sesión.');
        return;
      }

      const response = await axios.put(
        `http://localhost:5000/api/portafolios/${portafolioId}/categorias/${categoriaEditando._id}`,
        { nombre: nuevoNombre },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data && response.data.categoria) {
        setCategoriasLocal(prev =>
          prev.map(cat =>
            cat._id === categoriaEditando._id ? { ...cat, nombre: response.data.categoria.nombre } : cat
          )
        );
        cerrarModalEdicion();
        window.location.reload(); // Recargar la página
      } else {
        alert('Error al editar la categoría: respuesta inesperada del servidor.');
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        checkTokenAndRedirect(); // Redirige si el servidor devuelve un error 401
      } else {
        console.error('Error al editar la categoría:', error);
        alert('Error al editar la categoría: ' + (error.response?.data.error || 'Error desconocido'));
      }
    }
  };

  // Función para eliminar una categoría
  const eliminarCategoria = async (categoriaId) => {
    if (checkTokenAndRedirect()) return; // Verifica el token antes de continuar

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('No hay sesión activa. Por favor, inicia sesión.');
        return;
      }

      const response = await axios.delete(
        `http://localhost:5000/api/portafolios/${portafolioId}/categorias/${categoriaId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        setCategoriasLocal(prev => prev.filter(cat => cat._id !== categoriaId));
        window.location.reload(); // Recargar la página
      } else {
        alert('Error al eliminar la categoría: respuesta inesperada del servidor.');
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        checkTokenAndRedirect(); // Redirige si el servidor devuelve un error 401
      } else {
        console.error('Error al eliminar la categoría:', error);
        alert('Error al eliminar la categoría: ' + (error.response?.data.error || 'Error desconocido'));
      }
    }
  };

  // Calcular el gastado y el restante para cada categoría
  const calcularGastadoYRestante = (categoriaId) => {
    const categoria = categoriasLocal.find(cat => cat._id === categoriaId);
    if (!categoria) return { gastado: 0, restante: 0 };

    const gastado = gastosPorCategoria[categoria.nombre] || 0;
    const restante = (categoria.monto || 0) - gastado;

    return { gastado, restante };
  };

  return (
    <div className="configuracion-categorias-container">
      <h4>Configuración de Categorías</h4>
      {mensajeAdvertencia && (
        <div style={{ color: 'red', marginBottom: '10px' }}>
          {mensajeAdvertencia}
        </div>
      )}
      <div className="categorias-grid">
        <div className="grid-header">
          <h2>Categoría</h2>
          {/* <h2>Porcentaje</h2> */}
          {/* <h2>Monto</h2> */}
          <h2>Gastado</h2>
          {/* <h2>Restante</h2> */}
          <h2 className='acciones'>Acciones</h2>
        </div>
        {categoriasLocal.map(categoria => {
          const { gastado, restante } = calcularGastadoYRestante(categoria._id);

          return (
            <div key={categoria._id} className="categoria-item">
              <div className="categoria-name">
                <h2>{categoria.nombre}:</h2>
              </div>
              {/* <input
                type="number"
                placeholder="Porcentaje"
                value={categoria.porcentaje}
                onChange={(e) => setCategoriaPorcentaje(categoria._id, parseFloat(e.target.value) || 0)}
              /> */}
              {/* <input
                type="number"
                placeholder="Monto"
                value={categoria.monto}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    agregarMontoCategoria(categoria._id, 0);
                  } else {
                    agregarMontoCategoria(categoria._id, parseFloat(value));
                  }
                }}
              /> */}
              <h2 className="total-gastado">${gastado.toFixed(2)}</h2>
              {/* <input
                type="number"
                placeholder="Restante"
                value={restante.toFixed(2)}
                readOnly
              /> */}
              <div className="acciones">
                <button className="editar" onClick={() => abrirModalEdicion(categoria)}>Editar</button>
                <button className="eliminar" onClick={() => eliminarCategoria(categoria._id)}>Eliminar</button>
              </div>
            </div>
          );
        })}
        <div className="nueva-categoria">
          <input
            type="text"
            placeholder="Nueva Categoría"
            value={nuevaCategoria}
            onChange={(e) => setNuevaCategoria(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                agregarNuevaCategoria();
              }
            }}
          />
          <button onClick={agregarNuevaCategoria}>Agregar</button>
        </div>
      </div>

      {modalAbierto && (
        <Modal onClose={cerrarModalEdicion}>
          <h2>Editar Categoría</h2>
          <input
            type="text"
            value={nuevoNombre}
            onChange={(e) => setNuevoNombre(e.target.value)}
            placeholder="Nuevo nombre de la categoría"
          />
          <button onClick={guardarCategoriaEditada}>Guardar</button>
          <button onClick={cerrarModalEdicion}>Cancelar</button>
        </Modal>
      )}
    </div>
  );
};

export default ConfiguracionCategorias;