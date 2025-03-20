// src/components/HomeUsers.js
import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/HomeUsers.css'; // Asegúrate de crear este archivo CSS

const HomeUsers = () => {
  return (
    <div className="home-users-container">
      <header className="home-users-header">
        <h1>Bienvenido de nuevo!</h1>
        <p>Accede a tus portafolios y controla tus inversiones.</p>
      </header>
      <div className="home-users-content">
        <h2>Gestión de Portafolios</h2>
        <Link to="/portafolios" className="button portafolios-button">Ir a Portafolios</Link>
      </div>
    </div>
  );
};

export default HomeUsers;