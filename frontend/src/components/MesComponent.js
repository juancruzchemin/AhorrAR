import React, { useState, useEffect } from "react";
import axios from "axios";
import { format } from 'date-fns'; // o usar toLocaleDateString con opciones

const MesComponent = ({ usuarioId }) => {
  const [meses, setMeses] = useState([]);
  const [mesActual, setMesActual] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0); // Nombre más descriptivo
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.REACT_APP_BACKEND_URL;
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchMeses();
  }, [usuarioId]); // Añadir usuarioId como dependencia

  const fetchMeses = async () => {
    if (!token) {
      setMensaje("No hay sesión activa. Por favor, inicia sesión.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/api/mes/`, { // Cambiado a /mes
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.length > 0) {
        setMeses(response.data);
        setCurrentIndex(0);
        setMesActual(response.data[0]);
      } else {
        await crearMes();
      }
    } catch (error) {
      console.error("Error al obtener los meses:", error);
      setMensaje("Error al obtener los meses: " + (error.response?.data.error || "Error desconocido"));
    } finally {
      setLoading(false);
    }
  };

  const crearMes = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/mes/`, null, { // Cambiado a /mes
        headers: { Authorization: `Bearer ${token}` },
      });

      setMesActual(response.data.mes);
      setMeses([response.data.mes]);
      setCurrentIndex(0);
    } catch (error) {
      console.error("Error al crear el mes:", error);
      setMensaje("Error al crear el mes: " + (error.response?.data.error || "Error desconocido"));
    }
  };

  const irAlMesAnterior = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setMesActual(meses[newIndex]);
    }
  };

  const irAlMesSiguiente = () => {
    if (currentIndex < meses.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setMesActual(meses[newIndex]);
    }
  };

  if (loading) {
    return <p className="text-center">Cargando mes...</p>;
  }

  if (!token) {
    return (
      <div className="alert alert-warning text-center">
        No hay sesión activa. Por favor, inicia sesión.
      </div>
    );
  }

  return (
    <div className="container">
      <h2 className="text-center mt-4">Gestión de Meses</h2>

      {mensaje && <p className="alert alert-warning text-center">{mensaje}</p>}

      {mesActual ? (
        <div className="card p-4 mt-3">
          <h3>{mesActual.nombre} {mesActual.anio}</h3>
          <p><strong>Fecha Inicio:</strong> {format(new Date(mesActual.fechaInicio), 'dd/MM/yyyy')}</p>
          <p><strong>Fecha Fin:</strong> {format(new Date(mesActual.fechaFin), 'dd/MM/yyyy')}</p>
          <p><strong>Ingreso:</strong> ${mesActual.ingreso.toLocaleString()}</p>

          <div className="d-flex justify-content-between mt-3">
            <button 
              className="btn btn-secondary" 
              onClick={irAlMesAnterior} 
              disabled={currentIndex === 0}
            >
              ← Anterior
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={irAlMesSiguiente} 
              disabled={currentIndex === meses.length - 1}
            >
              Siguiente →
            </button>
          </div>
        </div>
      ) : (
        <p className="text-center">No hay meses disponibles</p>
      )}
    </div>
  );
};

export default MesComponent;