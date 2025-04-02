import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import PortafolioDetalle from "./PortafolioDetalle";
import ListaMovimientos from "./ListaMovimientos";
import EstadisticasPortafolio from "./EstadisticasPortafolio";
import ConfiguracionCategorias from "./ConfiguracionCategorias";
import '../styles/PortafolioDetallePage.css';

const PortafolioDetallePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [updateFlags, setUpdateFlags] = useState({
    movimientos: 0,
    categorias: 0
  });

  const token = localStorage.getItem("token");

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
      navigate('/login');
      return true;
    }
    return false;
  };

  useEffect(() => {
    checkTokenAndRedirect();
  }, []);

  // Función única para actualizaciones
  const handleActualizacion = (tipo) => {
    setUpdateFlags(prev => ({
      ...prev,
      [tipo]: prev[tipo] + 1
    }));
  };

  if (!token) {
    return (
        <div className="mes-alert mes-alert-warning">
            No hay sesión activa. Por favor, inicia sesión.
        </div>
    );
}


  return (
    <div className="portfolio-detail-page">
      <PortafolioDetalle portafolioId={id} />
      <EstadisticasPortafolio
        portafolioId={id}
        key={`estadisticas-${updateFlags.movimientos}`}
      />
      <ConfiguracionCategorias
        portafolioId={id}
        key={`categorias-${updateFlags.categorias}`}
        onActualizacion={(tipo) => {
          console.log(`Actualización requerida para: ${tipo}`);
          // Aquí puedes actualizar el estado del padre si es necesario
        }}
      />
      <ListaMovimientos
        portafolioId={id}
        onActualizacion={handleActualizacion}
        key={`lista-movimientos-${updateFlags.movimientos}`}
      />
    </div>
  );
};

export default PortafolioDetallePage;