import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/EstadisticasPortafolio.css';

const EstadisticasPortafolio = ({ portafolioId }) => {
  const [totalGastado, setTotalGastado] = useState(0);
  const [totalIngreso, setTotalIngreso] = useState(0);
  const [montoAsignado, setMontoAsignado] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEstadisticas = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
  
      try {
        // Obtener movimientos
        const movimientosResponse = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/api/movimientos/${portafolioId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
  
        // Obtener datos del portafolio
        const portafolioResponse = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/api/portafolios/${portafolioId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
  
        const movimientos = movimientosResponse.data;
        const portafolio = portafolioResponse.data;
  
        // Calcular totales
        const totalGastos = movimientos.reduce(
          (acc, movimiento) => acc + (movimiento.tipo === 'gasto' ? movimiento.monto : 0), 0
        );
        
        const totalIngresosMovimientos = movimientos.reduce(
          (acc, movimiento) => acc + (movimiento.tipo === 'ingreso' ? movimiento.monto : 0), 0
        );
  
        const totalIngresos = totalIngresosMovimientos + (portafolio.montoAsignado || 0);
  
        // Actualizar el totalGastado en el portafolio
        await axios.put(
          `${process.env.REACT_APP_BACKEND_URL}/api/portafolios/${portafolioId}/total-gastado`,
          { totalGastado: totalGastos },
          { headers: { Authorization: `Bearer ${token}` } }
        );
  
        setTotalGastado(totalGastos);
        setTotalIngreso(totalIngresos);
        setMontoAsignado(portafolio.montoAsignado || 0);
        setIsLoading(false);
      } catch (error) {
        console.error("Error al obtener estadísticas:", error);
        setIsLoading(false);
      }
    };
  
    fetchEstadisticas();
  }, [portafolioId]);

  const totalRestante = totalIngreso - totalGastado;

  if (isLoading) {
    return <div className="portfolio-stats-container">Cargando estadísticas...</div>;
  }

  return (
    <div className="portfolio-stats-container">
      <h3 className="portfolio-stats-header">Estadísticas del Portafolio</h3>

      <div className="portfolio-stats-grid">
        <div className={`portfolio-stat-item portfolio-stat-expense`}>
          <div className="portfolio-stat-label">Total Gastado</div>
          <div className="portfolio-stat-value">${totalGastado.toFixed(2)}</div>
        </div>

        <div className={`portfolio-stat-item portfolio-stat-income`}>
          <div className="portfolio-stat-label">Total Ingreso</div>
          <div className="portfolio-stat-value">${totalIngreso.toFixed(2)}</div>
          {montoAsignado > 0 && (
            <div className="portfolio-stat-subtext">
              (Incluye ${montoAsignado.toFixed(2)} asignado)
            </div>
          )}
        </div>

        <div className={`portfolio-stat-item portfolio-stat-remaining`}>
          <div className="portfolio-stat-label">Total Restante</div>
          <div className="portfolio-stat-value">${totalRestante.toFixed(2)}</div>
          <div className="portfolio-stat-subtext">
            {totalRestante >= 0 ? (
              <span className="positive-remaining">Disponible</span>
            ) : (
              <span className="negative-remaining">Sobregiro</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EstadisticasPortafolio;  