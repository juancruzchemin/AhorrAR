// components/Login.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css'; // Importar estilos

const Login = ({ setIsAuthenticated }) => {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [mensaje, setMensaje] = useState('');
  const navigate = useNavigate();

  const iniciarSesion = async () => {
    if (!correo) {
      setMensaje('El correo electrónico es requerido');
      return;
    } else if(!contrasena){
      setMensaje('La contraseña es requerida');
      return;
    }else if(!correo || !contrasena){
      setMensaje('El correo electronico y contraseña son requeridas');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/usuarios/login', {
        email: correo, // Cambiado de 'correo' a 'email'
        contrasena: contrasena
      });
      localStorage.setItem('token', response.data.token); // Almacenar el token
      localStorage.setItem('nombreUsuario', response.data.usuario.nombreUsuario); // Almacenar el nombre de usuario
      setIsAuthenticated(true); // Actualizar el estado de autenticación
      setMensaje('Inicio de sesión exitoso');
      navigate('/portafolios'); // Redirigir a la página de inicio
    } catch (error) {
      setMensaje('Error al iniciar sesión: ' + (error.response?.data.error || 'Error desconocido'));
    }
  };


  return (
    <div className="login-container">
      <h1>Iniciar Sesión</h1>
      <input
        type="email"
        placeholder="Correo Electrónico"
        value={correo}
        onChange={(e) => setCorreo(e.target.value)}
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={contrasena}
        onChange={(e) => setContrasena(e.target.value)}
      />
      <button onClick={iniciarSesion}>Iniciar Sesión</button>
      {mensaje && <p>{mensaje}</p>}
    </div>
  );
};

export default Login;
