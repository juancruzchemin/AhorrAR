import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/EstadisticasPortafolio.css';

const EstadisticasPortafolio = ({ portafolioId }) => {
  const [totalGastado, setTotalGastado] = useState(0);
  const [totalIngreso, setTotalIngreso] = useState(0);

  useEffect(() => {
    const fetchEstadisticas = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/movimientos/${portafolioId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const movimientos = response.data;

        const totalGastos = movimientos.reduce((acc, movimiento) => acc + (movimiento.tipo === 'gasto' ? movimiento.monto : 0), 0);
        setTotalGastado(totalGastos);

        const totalIngresos = movimientos.reduce((acc, movimiento) => acc + (movimiento.tipo === 'ingreso' ? movimiento.monto : 0), 0);
        setTotalIngreso(totalIngresos);
      } catch (error) {
        console.error("Error al obtener estadísticas:", error);
      }
    };

    fetchEstadisticas();
  }, [portafolioId]);

  const totalRestante = totalIngreso - totalGastado;

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
        </div>

        <div className={`portfolio-stat-item portfolio-stat-remaining`}>
          <div className="portfolio-stat-label">Total Restante</div>
          <div className="portfolio-stat-value">${totalRestante.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
};


export default EstadisticasPortafolio;