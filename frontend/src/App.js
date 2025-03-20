import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import CrearPortafolio from './components/CrearPortafolio'; // Importar el nuevo componente
import './App.css';
import Registro from './components/Registro';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import Portafolios from "./components/Portafolios";
import PortafolioDetallePage from "./components/PortafolioDetallePage.js";
import Sidebar from './components/Sidebar'; // Importar el componente Sidebar
import Perfil from './components/Perfil'; // Importar el componente Perfil
import Home from './components/Home'; // Importar el componente Perfil
import { FaBars } from 'react-icons/fa'; // Importar el ícono de hamburguesa
import Inversiones from './components/Inversiones.js';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Estado para manejar la autenticación
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Estado para manejar el menú lateral

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token); // Actualiza el estado según la presencia del token
  }, []);

  const cerrarSesion = () => {
    localStorage.removeItem('token'); // Eliminar el token del localStorage
    setIsAuthenticated(false); // Actualizar el estado de autenticación
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen); // Alternar el estado del menú lateral
  };

  return (
    <Router>
      <div>
        <header>
          <h1>AhorrAR</h1>
          <nav>
            {isAuthenticated && ( // Mostrar enlaces solo si el usuario está autenticado
              <>
                {/* <Link to="/">Gastos</Link> */}
                {/* <Link to="/cuenta-conjunta">Cuenta Conjunta</Link> */}
                {/* <Link to="/portafolios">Portafolios</Link> */}
                {/* <Link to="/crear-portafolio">Crear Portafolio</Link> Enlace para crear un portafolio */}
                {!isSidebarOpen && (
                  <button className="menu-button" onClick={toggleSidebar}>
                    <FaBars /> {/* Ícono de hamburguesa */}
                  </button>
                )}
              </>
            )}
            {!isAuthenticated && ( // Mostrar enlaces de login y registro si el usuario no está autenticado
              <>
                <Link to="/login">Iniciar Sesión</Link>
                <Link to="/registro">Registrarse</Link>
                <Routes>
                  <Route path="/" element={<Home />} />
                </Routes>

              </>
            )}
          </nav>
        </header>
        <Routes>
          <Route path="/" element={<HomeUsers />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
          <Route
            path="/crear-portafolio"
            element={
              <ProtectedRoute>
                <CrearPortafolio />
              </ProtectedRoute>
            }
          />
          <Route path="/portafolios" element={<Portafolios />} />
          <Route path="/inversiones" element={<Inversiones />} />
          <Route path="/portafolios/:id" element={<PortafolioDetallePage />} />
          <Route
            path="/perfil"
            element={
              <ProtectedRoute>
                <Perfil />
              </ProtectedRoute>
            }
          />
        </Routes>
        {isSidebarOpen && <Sidebar cerrarSidebar={toggleSidebar} cerrarSesion={cerrarSesion} />} {/* Mostrar el menú lateral si está abierto */}
      </div>
    </Router>
  );
};

export default App;