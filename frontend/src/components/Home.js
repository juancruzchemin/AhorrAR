// src/components/Home.js
import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Home.css'; // Asegúrate de crear este archivo CSS

const Home = () => {
  return (
    <div className="home-container">
      <header className="home-header">
        <h1>Control de Gastos</h1>
        <p>Gestiona tus gastos e ingresos de manera fácil y efectiva.</p>
      </header>
      <div className="home-content">
        <h2>Bienvenido de nuevo!</h2>
        <p>Accede a tus cuentas y controla tus finanzas.</p>
        <div className="home-buttons">
          <Link to="/login" className="button login-button">Iniciar Sesión</Link>
          <Link to="/registro" className="button register-button">Registrarse</Link>
        </div>
      </div>
    </div>
  );
};

export default Home;