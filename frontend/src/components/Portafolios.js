import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "../styles/Portafolio.css";
import MesComponent from "../components/MesComponent";

const Portafolios = () => {
  const [portafolios, setPortafolios] = useState([]);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    const fetchPortafolios = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setMensaje('No hay sesión activa. Por favor, inicia sesión.');
        return;
      }

      try {
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        console.log(decodedToken);
      } catch (error) {
        setMensaje('Token no válido. Por favor, inicia sesión nuevamente.');
        return;
      }

      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/portafolios`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("Portafolios obtenidos:", response.data);
        setPortafolios(response.data);
      } catch (error) {
        console.error("Error al obtener los portafolios:", error.response);
        setMensaje('Error al obtener los portafolios: ' + (error.response?.data.error || 'Error desconocido'));
      }
    };

    fetchPortafolios();
  }, []);

  return (
    <div>
      <div>
        <MesComponent />
      </div>

      <div className="portafolio-container">
        <h2 className="portafolio-title">Mis Portafolios</h2>
        {mensaje && <p className="portafolio-mensaje">{mensaje}</p>}
        {portafolios.length === 0 ? (
          <div className="portafolio-alert">
            <p>No tienes portafolios. ¿Quieres crear uno nuevo?</p>
            <Link to="/crear-portafolio" className="portafolio-btn">
              Crear Portafolio +
            </Link>
          </div>
        ) : (
          <ul className="portafolio-list">
            {portafolios.map((portafolio) => (
              <li key={portafolio._id} className="portafolio-item">
                <Link to={`/portafolios/${portafolio._id}`} className="portafolio-link">
                  <span className="portafolio-nombre">{portafolio.nombre}</span>
                  <span className="portafolio-tipo">{portafolio.tipo.join(', ')}</span>
                </Link>
              </li>
            ))}
            <li className="portafolio-item">
              <Link to="/crear-portafolio" className="portafolio-btn">
                Crear Portafolio
              </Link>
            </li>
          </ul>
        )}
      </div>
    </div>
  );
};

export default Portafolios;