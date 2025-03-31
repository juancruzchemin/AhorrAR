import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom';
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
import PortafolioInversiones from './components/PortafolioInversiones.js';
import api from '../src/utlis/api.js'; // Importar la instancia configurada de axios

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Verificar autenticación al montar y cuando cambie el token
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const isAuth = !!token;
      setIsAuthenticated(isAuth);

      // Configurar el header de Authorization si existe token
      if (isAuth) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } else {
        delete api.defaults.headers.common['Authorization'];
      }
    };

    checkAuth();

    // Escuchar cambios en localStorage
    window.addEventListener('storage', checkAuth);

    return () => {
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    delete api.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <Router>
      <div>
        <header className="header">
          <Link to="/portafolios" style={{ textDecoration: 'none', color: 'inherit' }}>
            <h1 style={{ cursor: 'pointer' }}>AhorrAR</h1>
          </Link>
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
          <Route
            path="/login"
            element={
              isAuthenticated ?
                <Navigate to="/" /> :
                <Login setIsAuthenticated={setIsAuthenticated} />
            }
          />
          <Route path="/crear-portafolio" element={<ProtectedRoute><CrearPortafolio /></ProtectedRoute>} />
          <Route path="/portafolios" element={<Portafolios />} />
          <Route path="/inversiones" element={<Inversiones />} />
          <Route path="/portafolios/:id" element={<PortafolioDetallePage />} />
          <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
          <Route
            path="/portafolios/:id/inversiones"
            element={<PortafolioInversiones />}
          />
        </Routes>

        {isSidebarOpen && <Sidebar cerrarSidebar={toggleSidebar} cerrarSesion={cerrarSesion} />}
      </div>
    </Router>
  );
};

export default App;