import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/Registro.css'; // Importar estilos

const Registro = () => {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [email, setEmail] = useState(''); // Cambiado a email
  const [contrasena, setContrasena] = useState('');
  const [mensaje, setMensaje] = useState('');
  const navigate = useNavigate();

  const registrarUsuario = async () => {
    if (!nombre || !apellido || !nombreUsuario || !email || !contrasena) {
      setMensaje('Todos los campos son requeridos');
      return;
    }

    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/usuarios/registrar`, {
        nombre,
        apellido,
        nombreUsuario,
        email, // Asegúrate de que este campo esté presente
        contrasena
      });
      setMensaje('Usuario registrado exitosamente');
      setNombre('');
      setApellido('');
      setNombreUsuario('');
      setEmail(''); // Limpiar el campo de email
      setContrasena('');
      navigate('/login'); // Redirigir a la página de inicio
    } catch (error) {
      console.error('Error al registrar el usuario:', error.response.data);
      setMensaje('Error al registrar el usuario: ' + (error.response?.data.error || 'Error desconocido'));
    }
  };

  return (
    <div className="registro-container">
      <h1>Registro de Usuario</h1>
      <input
        type="text"
        placeholder="Nombre"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
      />
      <input
        type="text"
        placeholder="Apellido"
        value={apellido}
        onChange={(e) => setApellido(e.target.value)}
      />
      <input
        type="text"
        placeholder="Nombre de Usuario"
        value={nombreUsuario}
        onChange={(e) => setNombreUsuario(e.target.value)}
      />
      <input
        type="email"
        placeholder="Correo Electrónico"
        value={email} // Cambiado a email
        onChange={(e) => setEmail(e.target.value)} // Cambiado a email
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={contrasena}
        onChange={(e) => setContrasena(e.target.value)}
      />
      <button onClick={registrarUsuario}>Registrar</button>
      {mensaje && <p>{mensaje}</p>}
    </div>
  );
};

export default Registro;
