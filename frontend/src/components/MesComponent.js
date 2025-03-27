import React, { useState, useEffect } from "react";
import axios from "axios";

const MesComponent = ({ usuarioId }) => {
  const [meses, setMeses] = useState([]);
  const [mesActual, setMesActual] = useState(null);
  const [index, setIndex] = useState(0);
  const [mensaje, setMensaje] = useState("");

  const API_URL = process.env.REACT_APP_BACKEND_URL; // Usar variable de entorno
  const token = localStorage.getItem("token"); // Obtener token del usuario autenticado

  useEffect(() => {
    fetchMeses();
  }, []);

  const fetchMeses = async () => {
    if (!token) {
      setMensaje("No hay sesión activa. Por favor, inicia sesión.");
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/api/mes`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.length > 0) {
        setMeses(response.data);
        setIndex(0);
        setMesActual(response.data[0]);
      } else {
        crearMes(); // Si no hay meses, crear el mes actual
      }
    } catch (error) {
      console.error("Error al obtener los meses:", error);
      setMensaje("Error al obtener los meses: " + (error.response?.data.error || "Error desconocido"));
    }
  };

  const crearMes = async () => {
    if (!token) {
      setMensaje("No hay sesión activa. Por favor, inicia sesión.");
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/api/mes`, { usuario: usuarioId }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMesActual(response.data.mes);
      setMeses([response.data.mes]);
    } catch (error) {
      console.error("Error al crear el mes:", error);
      setMensaje("Error al crear el mes: " + (error.response?.data.error || "Error desconocido"));
    }
  };

  const mesAnterior = () => {
    if (index < meses.length - 1) {
      setIndex(index + 1);
      setMesActual(meses[index + 1]);
    }
  };

  const mesSiguiente = () => {
    if (index > 0) {
      setIndex(index - 1);
      setMesActual(meses[index - 1]);
    }
  };

  return (
    <div className="container">
      <h2 className="text-center mt-4">Gestión de Meses</h2>

      {mensaje && <p className="alert alert-warning text-center">{mensaje}</p>}

      {mesActual ? (
        <div className="card p-4 mt-3">
          <h3>{mesActual.nombre} {mesActual.anio}</h3>
          <p><strong>Fecha Inicio:</strong> {new Date(mesActual.fechaInicio).toLocaleDateString()}</p>
          <p><strong>Fecha Fin:</strong> {new Date(mesActual.fechaFin).toLocaleDateString()}</p>
          <p><strong>Ingreso:</strong> ${mesActual.ingreso}</p>

          <div className="d-flex justify-content-between mt-3">
            <button className="btn btn-secondary" onClick={mesAnterior} disabled={index === meses.length - 1}>← Anterior</button>
            <button className="btn btn-secondary" onClick={mesSiguiente} disabled={index === 0}>Siguiente →</button>
          </div>
        </div>
      ) : (
        <p className="text-center">Cargando mes...</p>
      )}
    </div>
  );
};

export default MesComponent;
