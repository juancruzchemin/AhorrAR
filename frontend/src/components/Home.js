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
        <div className="home-cards">
          <Link to="/gastos" className="home-card">
            <h3>Gastos</h3>
            <p>Accede a la gestión de tus gastos.</p>
          </Link>
          <Link to="/cuenta-conjunta" className="home-card">
            <h3>Cuenta Conjunta</h3>
            <p>Gestiona tus cuentas conjuntas fácilmente.</p>
          </Link>
          <Link to="/portafolios" className="home-card">
            <h3>Portafolios</h3>
            <p>Consulta y administra tus portafolios.</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
