import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Sidebar.css'; // Asegúrate de que este archivo CSS esté correcto
import { FaTimes, FaMoneyBillWave, FaUsers, FaUser } from 'react-icons/fa'; // Importar íconos

const Sidebar = ({ cerrarSidebar, cerrarSesion }) => {
  const sidebarRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        cerrarSidebar();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [cerrarSidebar]);

  const handleLinkClick = () => {
    cerrarSidebar();
  };

  return (
    <div className="sidebar" ref={sidebarRef}>
      <button className="close-button" onClick={cerrarSidebar}> 
        <FaTimes /> {/* Ícono de cerrar */}
      </button>
      <h2>Menú</h2>
      <Link to="/portafolios" className="sidebar-link" onClick={handleLinkClick}>
        <FaMoneyBillWave /> Portafolios
      </Link>
      <Link to="/perfil" className="sidebar-link" onClick={handleLinkClick}>
        <FaUser /> Perfil
      </Link>
      {/* <Link to="/cuenta-conjunta" className="sidebar-link" onClick={handleLinkClick}>
        <FaUsers /> Cuenta Conjunta
      </Link> */}
      <button onClick={() => { cerrarSesion(); cerrarSidebar(); }} className="sidebar-button">Cerrar Sesión</button>
    </div>
  );
};

export default Sidebar;