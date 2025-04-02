import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';

const Login = ({ setIsAuthenticated }) => {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  const iniciarSesion = async (e) => {
    e.preventDefault(); // Prevenir comportamiento por defecto del formulario

    // Validaciones mejoradas
    if (!correo.trim() || !contrasena.trim()) {
      setMensaje('Ambos campos son requeridos');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(correo)) {
      setMensaje('Ingrese un correo electrónico válido');
      return;
    }

    setCargando(true);
    setMensaje('');

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/usuarios/login`,
        {
          email: correo,
          contrasena: contrasena
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.token && response.data.usuario) {
        // Almacenar datos de sesión
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userData', JSON.stringify({
          id: response.data.usuario._id,
          nombre: response.data.usuario.nombreUsuario,
          email: response.data.usuario.email
        }));

        // Configurar axios para usar el token en futuras peticiones
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;

        setIsAuthenticated(true);
        setMensaje('Inicio de sesión exitoso! Redirigiendo...');

        navigate('/portafolios');

      } else {
        throw new Error('No se recibió token en la respuesta');
      }
    } catch (error) {
      console.error('Error en login:', error);

      // Limpiar credenciales por seguridad
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
      delete axios.defaults.headers.common['Authorization'];

      let errorMessage = 'Error al iniciar sesión';
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'Credenciales incorrectas';
        } else if (error.response.data && error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      }
      setMensaje(errorMessage);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-container">
      <h1>Iniciar Sesión</h1>
      <form onSubmit={iniciarSesion}>
        <input
          type="email"
          placeholder="Correo Electrónico"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
          required
          minLength="3"
        />
        <button type="submit" disabled={cargando}>
          {cargando ? 'Cargando...' : 'Iniciar Sesión'}
        </button>
      </form>
      {mensaje && <p className={mensaje.includes('Error') ? 'error-message' : 'success-message'}>{mensaje}</p>}
    </div>
  );
};

export default Login;