import React, { useEffect, useState } from 'react';
import api from '../utlis/api'; // Usamos la instancia configurada de axios
import { jwtDecode } from 'jwt-decode';
import Modal from './Modal-Edit';
import '../styles/ConfiguracionCategorias.css';

const ConfiguracionCategorias = ({ portafolioId }) => {
  const [categorias, setCategorias] = useState([]);
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

  // Función para obtener categorías del portafolio
  const fetchCategorias = async () => {
    try {
      const response = await api.get(`/api/portafolios/${portafolioId}/categorias`);
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
      // Validación adicional en el frontend
      if (categorias.some(cat => cat.nombre.toLowerCase() === nuevaCategoria.trim().toLowerCase())) {
        setMensajeAdvertencia('Esta categoría ya existe');
        return;
      }

      const response = await api.post(
        `/api/portafolios/${portafolioId}/categorias`,
      { nombre: nuevaCategoria.trim() }
      );

if (response.data) {
  setCategorias(prev => [...prev, response.data]);
  setNuevaCategoria('');
  setMensajeAdvertencia('');
  window.location.reload();
}
    } catch (error) {
  console.error('Error al agregar categoría:', error);
  if (error.response?.status === 401) {
    checkTokenAndRedirect();
  } else if (error.response?.status === 400) {
    // Manejar errores de validación del backend
    setMensajeAdvertencia(error.response.data.error || 'Error al agregar categoría');
  } else if (error.response?.status === 404) {
    setMensajeAdvertencia('Endpoint no encontrado. Contacta al administrador.');
  } else {
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
    const response = await api.put(
      `/api/portafolios/${portafolioId}/categorias/${categoriaEditando._id}`,
      { nombre: nuevoNombre.trim() }
    );

    if (response.data) {
      setCategorias(prev =>
        prev.map(cat =>
          cat._id === categoriaEditando._id ? response.data : cat
        )
      );
      cerrarModalEdicion();
      setMensajeAdvertencia('');
    }
  } catch (error) {
    console.error('Error al editar categoría:', error);
    if (error.response?.status === 401) {
      checkTokenAndRedirect();
    } else {
      setMensajeAdvertencia('Error al editar categoría: ' + (error.response?.data.error || 'Error desconocido'));
    }
  }
};

const eliminarCategoria = async (categoriaId) => {
  if (checkTokenAndRedirect()) return;

  if (!window.confirm('¿Estás seguro de que deseas eliminar esta categoría?')) return;

  try {
    await api.delete(`/api/portafolios/${portafolioId}/categorias/${categoriaId}`);
    setCategorias(prev => prev.filter(cat => cat._id !== categoriaId));
    setMensajeAdvertencia('');
  } catch (error) {
    console.error('Error al eliminar categoría:', error);
    if (error.response?.status === 401) {
      checkTokenAndRedirect();
    } else if (error.response?.status === 400) {
      setMensajeAdvertencia('No puedes eliminar una categoría que tiene movimientos asociados');
    } else {
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
            disabled={!nuevoNombre.trim()}
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