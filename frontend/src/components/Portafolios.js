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
      } catch (error) {
        setMensaje('Token no válido. Por favor, inicia sesión nuevamente.');
        return;
      }

      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/portafolios`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPortafolios(response.data);
      } catch (error) {
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
    </div>
  );
};

export default Portafolios;