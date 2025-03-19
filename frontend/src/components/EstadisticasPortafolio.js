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
    <div className="estadisticas-portafolio-container">
      <div className="estadisticas-content">
        <div className="estadisticas-info">
          <h3>Estadísticas del Portafolio</h3>
          <h2 className="total-gastado"><strong>Total Gastado:</strong> ${totalGastado.toFixed(2)}</h2>
          <h2 className="total-ingreso"><strong>Total Ingreso:</strong> ${totalIngreso.toFixed(2)}</h2>
          <h2 className="total-restante"><strong>Total Restante:</strong> ${totalRestante.toFixed(2)}</h2>
        </div>
      </div>
    </div>
  );
};

export default EstadisticasPortafolio;