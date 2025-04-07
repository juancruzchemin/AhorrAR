import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/HomeUsers.css'; // Asegúrate de crear este archivo CSS

const HomeUsers = () => {
  return (
    <div className="home-container">
      <div className="home-content">
        <header className="home-users-content">
          <h2 className="section-title">Gestión de Portafolios</h2>
        </header>
        <div className="home-buttons">
          <Link to="/portafolios" className="button portafolios-button">Ir a Portafolios</Link>
          {/* Descomenta si necesitas este botón */}
          {/* <Link to="/inversiones" className="button inversiones-button">Ir a Inversiones</Link> */}
        </div>
      </div>
    </div>
  );
};

export default HomeUsers;