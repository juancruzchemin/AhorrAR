import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom'; // Agrega Navigate
import CrearPortafolio from './components/CrearPortafolio';
import './App.css';
import Registro from './components/Registro';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import Portafolios from "./components/Portafolios";
import PortafolioDetallePage from "./components/PortafolioDetallePage.js";
import Sidebar from './components/Sidebar';
import Perfil from './components/Perfil';
import Home from './components/Home';
import { FaBars } from 'react-icons/fa';
import Inversiones from './components/Inversiones.js';
import HomeUsers from './components/HomeUser.js';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Verificar autenticación al montar y cuando cambie el token
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      setIsAuthenticated(!!token);
    };

    checkAuth();

    // Escuchar cambios en localStorage (por si el token cambia desde otra pestaña)
    window.addEventListener('storage', checkAuth);

    return () => {
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <Router>
      <div>
        <header className="header">
          <h1>
            AhorrAR
          </h1>
          <nav>
            {isAuthenticated ? (
              <>
                {!isSidebarOpen && (
                  <button className="menu-button" onClick={toggleSidebar}>
                    <FaBars />
                  </button>
                )}
              </>
            ) : (
              <>
                <Link to="/login">Iniciar Sesión</Link>
                <Link to="/registro">Registrarse</Link>
              </>
            )}
          </nav>
        </header>

        <Routes>
          <Route
            path="/"
            element={isAuthenticated ? <HomeUsers setIsAuthenticated={setIsAuthenticated} /> : <Home />}
          />
          <Route path="/registro" element={<Registro />} />
          <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
          <Route path="/crear-portafolio" element={<ProtectedRoute><CrearPortafolio /></ProtectedRoute>} />
          <Route path="/portafolios" element={<Portafolios />} />
          <Route path="/inversiones" element={<Inversiones />} />
          <Route path="/portafolios/:id" element={<PortafolioDetallePage />} />
          <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
        </Routes>

        {isSidebarOpen && <Sidebar cerrarSidebar={toggleSidebar} cerrarSesion={cerrarSesion} />}
      </div>
    </Router>
  );
};

export default App;
