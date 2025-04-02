import React, { useEffect, useState } from 'react';
import api from '../utlis/api'; // Usamos la instancia configurada de axios
import { jwtDecode } from 'jwt-decode';
import Modal from './Modal-Edit';
import '../styles/ConfiguracionCategorias.css';

const ConfiguracionCategorias = ({ portafolioId, onActualizacion }) => {
  const [categorias, setCategorias] = useState([]);
  const [nuevaCategoria, setNuevaCategoria] = useState('');
  const [mensajeAdvertencia, setMensajeAdvertencia] = useState({
    texto: '',
    tipo: '' // puede ser 'exito' o 'error'
  });
  const [gastosPorCategoria, setGastosPorCategoria] = useState({});
  const [modalAbierto, setModalAbierto] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState(null);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [loading, setLoading] = useState(true);
  // Al inicio del componente
  const [expandido, setExpandido] = useState(() => {
    const saved = localStorage.getItem('categoriasExpandido');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Efecto para guardar el estado
  useEffect(() => {
    localStorage.setItem('categoriasExpandido', JSON.stringify(expandido));
  }, [expandido]);

  const isTokenExpired = (token) => {
    if (!token) return true;
    try {
      const decodedToken = jwtDecode(token);
      return decodedToken.exp < Date.now() / 1000;
    } catch (error) {
      console.error('Error al decodificar el token:', error);
      return true;
    }
  };

  const checkTokenAndRedirect = () => {
    const token = localStorage.getItem('token');
    if (!token || isTokenExpired(token)) {
      alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      localStorage.removeItem('token');
      window.location.href = '/login';
      return true;
    }
    return false;
  };

  // Función para obtener categorías del portafolio
  const fetchCategorias = async () => {
    try {
      const response = await api.get(`${process.env.REACT_APP_BACKEND_URL}/api/portafolios/${portafolioId}/categorias`);
      setCategorias(response.data || []);
    } catch (error) {
      console.error('Error al obtener categorías:', error);
      if (error.response?.status === 401) {
        checkTokenAndRedirect();
      } else {
        setMensajeAdvertencia('Error al obtener categorías: ' + (error.response?.data.error || 'Error desconocido'));
      }
    }
  };

  // Función para obtener movimientos y calcular gastos
  const fetchMovimientos = async () => {
    try {
      const response = await api.get(`/api/movimientos/${portafolioId}`);

      const gastosTemp = {};
      response.data.forEach(movimiento => {
        if (movimiento.tipo === 'gasto') {
          movimiento.categoria.forEach(cat => {
            gastosTemp[cat] = (gastosTemp[cat] || 0) + movimiento.monto;
          });
        }
      });
      setGastosPorCategoria(gastosTemp);
    } catch (error) {
      console.error('Error al obtener movimientos:', error);
      if (error.response?.status === 401) {
        checkTokenAndRedirect();
      } else {
        setMensajeAdvertencia('Error al obtener movimientos: ' + (error.response?.data.error || 'Error desconocido'));
      }
    }
  };

  useEffect(() => {
    if (checkTokenAndRedirect()) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchCategorias(), fetchMovimientos()]);
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [portafolioId]);

  const agregarNuevaCategoria = async () => {
    if (checkTokenAndRedirect() || !nuevaCategoria.trim()) return;

    try {
      // Validación de duplicados
      if (categorias.some(cat => cat.nombre.toLowerCase() === nuevaCategoria.trim().toLowerCase())) {
        setMensajeAdvertencia({ texto: 'Esta categoría ya existe', tipo: 'error' });
        return;
      }

      // Enviar la nueva categoría al backend
      await api.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/portafolios/${portafolioId}/categorias`,
        { nombre: nuevaCategoria.trim() }
      );

      // Limpiar el campo de entrada
      setNuevaCategoria('');

      // Forzar recarga de las categorías
      await fetchCategorias();

      // Mostrar mensaje de éxito
      setMensajeAdvertencia({
        texto: 'Categoría agregada correctamente',
        tipo: 'exito'
      });

    } catch (error) {
      console.error('Error al agregar categoría:', error);
      setMensajeAdvertencia({
        texto: 'Error al agregar categoría: ' + (error.response?.data?.error || 'Error desconocido'),
        tipo: 'error'
      });
    }
  };

  const abrirModalEdicion = (categoria) => {
    setCategoriaEditando(categoria);
    setNuevoNombre(categoria.nombre);
    setMensajeAdvertencia({ texto: '', tipo: '' }); // Limpiar mensajes anteriores
    setModalAbierto(true);
  };

  const cerrarModalEdicion = () => {
    setModalAbierto(false);
    setCategoriaEditando(null);
    setNuevoNombre('');
  };

  const guardarCategoriaEditada = async () => {
    if (checkTokenAndRedirect() || !nuevoNombre.trim()) return;

    try {
      const response = await api.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/portafolios/${portafolioId}/categorias/${categoriaEditando._id}`,
        { nombre: nuevoNombre.trim() }
      );

      if (response.data.success) {
        setCategorias(prev => prev.map(cat =>
          cat._id === categoriaEditando._id ? { ...cat, nombre: nuevoNombre.trim() } : cat
        ));
        cerrarModalEdicion();
        setMensajeAdvertencia({
          texto: response.data.message,
          tipo: 'exito'
        });
      } else {
        setMensajeAdvertencia({
          texto: response.data.error,
          tipo: 'error'
        });
      }
    } catch (error) {
      console.error('Error al editar categoría:', error);
      setMensajeAdvertencia({
        texto: error.response?.data?.error || 'Error de conexión al servidor',
        tipo: 'error'
      });
    }
  };

  const eliminarCategoria = async (categoriaId) => {
    if (checkTokenAndRedirect()) return;

    if (!window.confirm('¿Estás seguro de eliminar esta categoría? Los movimientos asociados perderán esta categoría.')) {
      return;
    }

    try {
      await api.delete(
        `${process.env.REACT_APP_BACKEND_URL}/api/portafolios/${portafolioId}/categorias/${categoriaId}`
      );

      setCategorias(prev => prev.filter(cat => cat._id !== categoriaId));
      setMensajeAdvertencia({
        texto: 'Categoría eliminada correctamente',
        tipo: 'exito'
      });
      onActualizacion('categorias');

    } catch (error) {
      let mensaje = 'Error al eliminar categoría';

      if (error.response) {
        switch (error.response.status) {
          case 400:
            mensaje = error.response.data.error || 'Categoría no puede ser eliminada';
            break;
          case 404:
            mensaje = 'Categoría no encontrada';
            break;
          case 500:
            mensaje = 'Error interno del servidor';
            break;
        }
      }

      setMensajeAdvertencia({
        texto: mensaje,
        tipo: 'error'
      });
    }
  };

  const calcularGastado = (categoriaNombre) => {
    return gastosPorCategoria[categoriaNombre] || 0;
  };

  if (loading) {
    return (
      <div className="portfolio-categories-config">
        <p>Cargando categorías...</p>
      </div>
    );
  }

  return (
    <div className="portfolio-categories-config">
      <h3
        className="portfolio-categories-title"
        onClick={() => setExpandido(!expandido)}
        style={{ cursor: 'pointer' }}
      >
        Configuración de Categorías
        <span className="toggle-icon-categorias">
          {expandido ? '−' : '+'}
        </span>
      </h3>

      {expandido && ( // Solo muestra el contenido si está expandido
        <>
          {mensajeAdvertencia.texto && (
            <div className={`mensaje-advertencia ${mensajeAdvertencia.tipo}`}>
              {mensajeAdvertencia.texto}
            </div>
          )}

          <div className="portfolio-categories-grid">
            <div className="portfolio-categories-header">
              <div>Categoría</div>
              <div>Gastado</div>
              <div>Acciones</div>
            </div>

            {categorias.map(categoria => (
              <React.Fragment key={categoria._id}>
                <div className="portfolio-category-name">
                  {categoria.nombre}
                </div>
                <div className="portfolio-category-spent">
                  ${calcularGastado(categoria.nombre).toFixed(2)}
                </div>
                <div className="portfolio-category-actions">
                  <button
                    className="portfolio-category-btn portfolio-category-btn-edit"
                    onClick={() => abrirModalEdicion(categoria)}
                  >
                    Editar
                  </button>
                  <button
                    className="portfolio-category-btn portfolio-category-btn-delete"
                    onClick={() => eliminarCategoria(categoria._id)}
                  >
                    Eliminar
                  </button>
                </div>
              </React.Fragment>
            ))}

            <div className="portfolio-new-category">
              <input
                type="text"
                className="portfolio-new-category-input"
                placeholder="Nueva categoría"
                value={nuevaCategoria}
                onChange={(e) => setNuevaCategoria(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && agregarNuevaCategoria()}
              />
              <button
                className="portfolio-new-category-btn"
                onClick={agregarNuevaCategoria}
                disabled={!nuevaCategoria.trim()}
              >
                Agregar
              </button>
            </div>
          </div>

          {modalAbierto && (
            <Modal onClose={cerrarModalEdicion}>
              <h2>Editar Categoría: {categoriaEditando?.nombre}</h2>

              <input
                type="text"
                className="portfolio-new-category-input"
                value={nuevoNombre}
                onChange={(e) => {
                  setNuevoNombre(e.target.value);
                  // Limpiar mensajes cuando el usuario escribe
                  if (mensajeAdvertencia.texto) setMensajeAdvertencia({ texto: '', tipo: '' });
                }}
                placeholder="Nuevo nombre"
                onKeyDown={(e) => e.key === 'Enter' && guardarCategoriaEditada()}
                autoFocus
              />

              {/* Mostrar mensajes de error/éxito */}
              {mensajeAdvertencia.texto && (
                <div className={`alert-message ${mensajeAdvertencia.tipo}`}>
                  {mensajeAdvertencia.texto}
                </div>
              )}

              <div className="modal-actions">
                <button
                  className="portfolio-category-btn portfolio-category-btn-save"
                  onClick={guardarCategoriaEditada}
                  disabled={
                    !nuevoNombre.trim() ||
                    nuevoNombre.trim() === categoriaEditando?.nombre ||
                    (mensajeAdvertencia.tipo === 'error' && mensajeAdvertencia.texto.includes('duplicad'))
                  }
                >
                  Guardar Cambios
                </button>

                <button
                  className="portfolio-category-btn portfolio-category-btn-cancel"
                  onClick={cerrarModalEdicion}
                >
                  Cancelar
                </button>
              </div>
            </Modal>
          )}
        </>
      )}
    </div>
  );
};

export default ConfiguracionCategorias;