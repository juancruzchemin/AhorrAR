import React, { useEffect } from "react";
import { useParams, Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import PortafolioDetalle from "./PortafolioDetalle"; // Asegúrate de que la ruta sea correcta
import ListaMovimientos from "./ListaMovimientos"; // Asegúrate de que la ruta sea correcta
import EstadisticasPortafolio from "./EstadisticasPortafolio";
import ConfiguracionCategorias from "./ConfiguracionCategorias";
import GastosPorCategoriaChart from "./GastosPorCategoriaChart";
import '../styles/PortafolioDetallePage.css'; // Asegúrate de que la ruta sea correcta

const PortafolioDetallePage = () => {
  const { id } = useParams(); // Obtener el ID del portafolio desde la URL
  const navigate = useNavigate();

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
      navigate('/login'); // Redirige al usuario a la página de inicio de sesión
      return true; // Indica que el token ha expirado
    }

    return false; // El token es válido
  };

  useEffect(() => {
    checkTokenAndRedirect();
  }, []);

  return (
    <div className="portafolio-detalle-page-container">
      <PortafolioDetalle portafolioId={id} />
      <div className="estadisticas-y-chart">
        <EstadisticasPortafolio portafolioId={id} />
        <GastosPorCategoriaChart portafolioId={id} />
      </div>
      <ConfiguracionCategorias portafolioId={id} />
      <ListaMovimientos portafolioId={id} /> {/* Pasar el ID del portafolio */}
    </div>
  );
};

export default PortafolioDetallePage;