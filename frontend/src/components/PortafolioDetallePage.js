import React, { useEffect } from "react";
import { useParams, Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import PortafolioDetalle from "./PortafolioDetalle";
import ListaMovimientos from "./ListaMovimientos";
import EstadisticasPortafolio from "./EstadisticasPortafolio";
import ConfiguracionCategorias from "./ConfiguracionCategorias";
import GastosPorCategoriaChart from "./GastosPorCategoriaChart";
import '../styles/PortafolioDetallePage.css';

const PortafolioDetallePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

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

  return (
    <div className="portfolio-detail-page">
      <PortafolioDetalle portafolioId={id} />
      
      <div className="portfolio-stats-chart-container">
        <div className="portfolio-stats-section">
          <EstadisticasPortafolio portafolioId={id} />
        </div>
        <div className="portfolio-chart-section">
          <GastosPorCategoriaChart portafolioId={id} />
        </div>
      </div>
      
      <ConfiguracionCategorias portafolioId={id} />
      <ListaMovimientos portafolioId={id} />
    </div>
  );
};

export default PortafolioDetallePage;