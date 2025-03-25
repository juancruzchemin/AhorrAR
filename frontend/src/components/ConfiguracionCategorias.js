import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import Modal from './Modal-Edit';
import '../styles/ConfiguracionCategorias.css';

const ConfiguracionCategorias = ({ portafolioId }) => {
  const [categoriasLocal, setCategoriasLocal] = useState([]);
  const [nuevaCategoria, setNuevaCategoria] = useState('');
  const [mensajeAdvertencia, setMensajeAdvertencia] = useState('');
  const [gastosPorCategoria, setGastosPorCategoria] = useState({});
  const [modalAbierto, setModalAbierto] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState(null);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (checkTokenAndRedirect()) return;

    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('No hay sesión activa. Por favor, inicia sesión.');
        return;
      }

      try {
        const [categoriasResponse, movimientosResponse] = await Promise.all([
          axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/portafolios/${portafolioId}/categorias`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/movimientos/${portafolioId}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setCategoriasLocal(categoriasResponse.data);

        const gastosTemp = {};
        movimientosResponse.data.forEach(movimiento => {
          if (movimiento.tipo === 'gasto') {
            movimiento.categoria.forEach(cat => {
              gastosTemp[cat] = (gastosTemp[cat] || 0) + movimiento.monto;
            });
          }
        });
        setGastosPorCategoria(gastosTemp);
      } catch (error) {
        if (error.response?.status === 401) {
          checkTokenAndRedirect();
        } else {
          console.error('Error al obtener datos:', error);
          setMensajeAdvertencia('Error al obtener datos: ' + (error.response?.data.error || 'Error desconocido'));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [portafolioId]);

  const agregarNuevaCategoria = async () => {
    if (checkTokenAndRedirect() || !nuevaCategoria.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/portafolios/${portafolioId}/categorias`,
        { nombre: nuevaCategoria },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data?.categoria) {
        setCategoriasLocal(prev => [...prev, response.data.categoria]);
        setNuevaCategoria('');
      }
    } catch (error) {
      if (error.response?.status === 401) {
        checkTokenAndRedirect();
      } else {
        console.error('Error al agregar categoría:', error);
        setMensajeAdvertencia('Error al agregar categoría: ' + (error.response?.data.error || 'Error desconocido'));
      }
    }
  };

  const abrirModalEdicion = (categoria) => {
    setCategoriaEditando(categoria);
    setNuevoNombre(categoria.nombre);
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
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/portafolios/${portafolioId}/categorias/${categoriaEditando._id}`,
        { nombre: nuevoNombre },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data?.categoria) {
        setCategoriasLocal(prev =>
          prev.map(cat =>
            cat._id === categoriaEditando._id ? { ...cat, nombre: response.data.categoria.nombre } : cat
          )
        );
        cerrarModalEdicion();
      }
    } catch (error) {
      if (error.response?.status === 401) {
        checkTokenAndRedirect();
      } else {
        console.error('Error al editar categoría:', error);
        setMensajeAdvertencia('Error al editar categoría: ' + (error.response?.data.error || 'Error desconocido'));
      }
    }
  };

  const eliminarCategoria = async (categoriaId) => {
    if (checkTokenAndRedirect()) return;

    if (!window.confirm('¿Estás seguro de que deseas eliminar esta categoría?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${process.env.REACT_APP_BACKEND_URL}/api/portafolios/${portafolioId}/categorias/${categoriaId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCategoriasLocal(prev => prev.filter(cat => cat._id !== categoriaId));
    } catch (error) {
      if (error.response?.status === 401) {
        checkTokenAndRedirect();
      } else {
        console.error('Error al eliminar categoría:', error);
        setMensajeAdvertencia('Error al eliminar categoría: ' + (error.response?.data.error || 'Error desconocido'));
      }
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
      <h3 className="portfolio-categories-title">Configuración de Categorías</h3>
      
      {mensajeAdvertencia && (
        <div className="portfolio-message-warning">
          {mensajeAdvertencia}
        </div>
      )}

      <div className="portfolio-categories-grid">
        <div className="portfolio-categories-header">
          <div>Categoría</div>
          <div>Gastado</div>
          <div>Acciones</div>
        </div>

        {categoriasLocal.map(categoria => (
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
          >
            Agregar
          </button>
        </div>
      </div>

      {modalAbierto && (
        <Modal onClose={cerrarModalEdicion}>
          <h2>Editar Categoría</h2>
          <input
            type="text"
            className="portfolio-new-category-input"
            value={nuevoNombre}
            onChange={(e) => setNuevoNombre(e.target.value)}
            placeholder="Nuevo nombre"
          />
          <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
            <button 
              className="portfolio-category-btn portfolio-category-btn-edit"
              onClick={guardarCategoriaEditada}
            >
              Guardar
            </button>
            <button 
              className="portfolio-category-btn portfolio-category-btn-delete"
              onClick={cerrarModalEdicion}
            >
              Cancelar
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ConfiguracionCategorias;