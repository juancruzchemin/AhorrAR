import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Perfil.css'; // Asegúrate de crear este archivo CSS

const Perfil = () => {
  const [usuario, setUsuario] = useState({});
  const [editando, setEditando] = useState(false);
  const [cambiandoContrasena, setCambiandoContrasena] = useState(false);
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [email, setEmail] = useState('');
  const [contrasenaActual, setContrasenaActual] = useState('');
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [mensajeError, setMensajeError] = useState('');

  useEffect(() => {
    const fetchUsuario = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await axios.get('http://localhost:5000/api/usuarios/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsuario(response.data);
        setNombre(response.data.nombre);
        setApellido(response.data.apellido);
        setNombreUsuario(response.data.nombreUsuario);
        setEmail(response.data.email);
      } catch (error) {
        console.error('Error al obtener la información del usuario:', error);
      }
    };

    fetchUsuario();
  }, []);

  const guardarCambios = async () => {
    const token = localStorage.getItem('token');
    try {
      await axios.put('http://localhost:5000/api/usuarios/me', { nombre, apellido, nombreUsuario, email }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsuario({ ...usuario, nombre, apellido, nombreUsuario, email });
      setEditando(false);
      setMensajeError('');
    } catch (error) {
      console.error('Error al guardar los cambios:', error);
      setMensajeError('Error al guardar los cambios');
    }
  };

  const cambiarContrasena = async () => {
    if (nuevaContrasena !== confirmarContrasena) {
      setMensajeError('Las contraseñas no coinciden');
      return;
    }

    const token = localStorage.getItem('token');
    try {
      await axios.put('http://localhost:5000/api/usuarios/me', { contrasenaActual, nuevaContrasena }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCambiandoContrasena(false);
      setMensajeError('');
    } catch (error) {
      console.error('Error al cambiar la contraseña:', error);
      setMensajeError('Error al cambiar la contraseña');
    }
  };

  return (
    <div className="perfil-container">
      <h2>Perfil</h2>
      {editando ? (
        <>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre"
          />
          <input
            type="text"
            value={apellido}
            onChange={(e) => setApellido(e.target.value)}
            placeholder="Apellido"
          />
          <input
            type="text"
            value={nombreUsuario}
            onChange={(e) => setNombreUsuario(e.target.value)}
            placeholder="Nombre de Usuario"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
          />
          {mensajeError && <p className="error">{mensajeError}</p>}
          <button className="guardar" onClick={guardarCambios}>Guardar</button>
          <button className="cancelar" onClick={() => setEditando(false)}>Cancelar</button>
        </>
      ) : (
        <>
          <p><strong>Nombre:</strong> {usuario.nombre}</p>
          <p><strong>Apellido:</strong> {usuario.apellido}</p>
          <p><strong>Nombre de Usuario:</strong> {usuario.nombreUsuario}</p>
          <p><strong>Email:</strong> {usuario.email}</p>
          <button className="editar" onClick={() => setEditando(true)}>Editar</button>
        </>
      )}
      {!cambiandoContrasena && (
        <button className="cambiar-contrasena" onClick={() => setCambiandoContrasena(true)}>
          Cambiar Contraseña
        </button>
      )}
      {cambiandoContrasena && (
        <>
          <input
            type="password"
            value={contrasenaActual}
            onChange={(e) => setContrasenaActual(e.target.value)}
            placeholder="Contraseña Actual"
          />
          <input
            type="password"
            value={nuevaContrasena}
            onChange={(e) => setNuevaContrasena(e.target.value)}
            placeholder="Nueva Contraseña"
          />
          <input
            type="password"
            value={confirmarContrasena}
            onChange={(e) => setConfirmarContrasena(e.target.value)}
            placeholder="Confirmar Nueva Contraseña"
          />
          {mensajeError && <p className="error">{mensajeError}</p>}
          <button className="guardar" onClick={cambiarContrasena}>Guardar Contraseña</button>
          <button className="cancelar" onClick={() => setCambiandoContrasena(false)}>Cancelar</button>
        </>
      )}
    </div>
  );
};

export default Perfil;