import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import "../styles/PortafolioInversiones.css"; // Importa tu CSS aquí
import EstadisticasPortafolio from './EstadisticasPortafolio';
import PortafolioDetalle from './PortafolioDetalle';
import ListaInversiones from './ListaInversiones';
import ConfiguracionCategorias from './ConfiguracionCategorias';

const PortafolioInversiones = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_BACKEND_URL;

  // Estados
  const [portafolio, setPortafolio] = useState(null);
  const [inversiones, setInversiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Formulario
  const [formData, setFormData] = useState({
    nombre: '',
    precioCompra: 0,
    precioActual: 0,
    fechaCompra: format(new Date(), 'yyyy-MM-dd'),
    categoria: 'acciones',
    subcategoria: 'nacionales',
    montoActual: 0
  });

  // Categorías y subcategorías disponibles
  const categorias = {
    acciones: ['nacionales', 'internacionales'],
    bonos: ['corporativos', 'gubernamentales'],
    cripto: ['bitcoin', 'ethereum', 'stablecoins', 'otros'],
    fondos: ['indexados', 'activos', 'sectoriales'],
    propiedades: ['terrenos', 'departamentos', 'casas'],
    otros: ['metales', 'arte', 'coleccionables']
  };

  // Obtener datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No autenticado');

        const [portafolioRes, inversionesRes] = await Promise.all([
          axios.get(`${API_URL}/api/portafolios/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API_URL}/api/inversiones/portafolio/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setPortafolio(portafolioRes.data);
        setInversiones(inversionesRes.data.inversiones || []);
      } catch (err) {
        setError(err.response?.data?.error || err.message);
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, API_URL, navigate]);

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Si cambia la categoría, resetear subcategoría
    if (name === 'categoria') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        subcategoria: categorias[value][0],
        montoActual: name === 'precioCompra' ? value * (prev.cantidad || 1) : prev.montoActual
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'precioCompra' || name === 'precioActual' ?
          parseFloat(value) || 0 : value,
        montoActual: name === 'precioActual' ? value * (prev.cantidad || 1) : prev.montoActual
      }));
    }
  };

  // Crear nueva inversión
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');

      // Calcular monto actual si no se especificó
      const montoActualCalc = formData.montoActual > 0 ?
        formData.montoActual :
        formData.precioActual * 1; // Asumiendo cantidad 1 por defecto

      const res = await axios.post(`${API_URL}/api/inversiones`, {
        ...formData,
        portafolioId: id,
        montoActual: montoActualCalc,
        usuario: JSON.parse(localStorage.getItem('user'))._id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Actualizar lista de inversiones y portafolio
      setInversiones([res.data, ...inversiones]);

      // Actualizar el portafolio en el estado
      setPortafolio(prev => ({
        ...prev,
        inversiones: [...prev.inversiones, res.data._id],
        monto: (prev.monto || 0) + montoActualCalc
      }));

      // Resetear formulario
      setShowForm(false);
      setFormData({
        nombre: '',
        precioCompra: 0,
        precioActual: 0,
        fechaCompra: format(new Date(), 'yyyy-MM-dd'),
        categoria: 'acciones',
        subcategoria: 'nacionales',
        montoActual: 0
      });
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  // Calcular rentabilidad total
  const calcularRentabilidadTotal = () => {
    if (inversiones.length === 0) return 0;

    const totalInvertido = inversiones.reduce((sum, inv) => sum + inv.precioCompra, 0);
    const totalActual = inversiones.reduce((sum, inv) => sum + inv.precioActual, 0);

    return ((totalActual - totalInvertido) / totalInvertido) * 100;
  };

  if (loading) return <div className="loading">Cargando...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!portafolio) return <div>Portafolio no encontrado</div>;

  return (
    <div className="portafolio-inversiones-container">
      <PortafolioDetalle portafolioId={id} />
      <EstadisticasPortafolio portafolioId={id} />
      <ConfiguracionCategorias portafolioId={id} />
      <ListaInversiones portafolioId={id} />
      {/* Encabezado */}

    </div>
  );
};

export default PortafolioInversiones;