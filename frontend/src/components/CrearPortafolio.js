import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import '../styles/CrearPortafolio.css'; // Asegúrate de crear este archivo CSS

const CrearPortafolio = () => {
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState([]); // Estado para el tipo de portafolio
  const [admins, setAdmins] = useState([]); // Estado para almacenar los administradores seleccionados
  const [mes, setMes] = useState('');
  const [inicio, setInicio] = useState('');
  const [fin, setFin] = useState('');
  const [usuarios, setUsuarios] = useState([]); // Estado para almacenar la lista de usuarios
  const [usuariosSeleccionados, setUsuariosSeleccionados] = useState([]); // Estado para los usuarios seleccionados
  const [inputAdmin, setInputAdmin] = useState(''); // Input para buscar administradores
  const [inputUsuario, setInputUsuario] = useState(''); // Input para buscar usuarios
  const [mensaje, setMensaje] = useState('');
  const navigate = useNavigate();

  const tiposDisponibles = ['Principal', 'Personal', 'Compartido']; // Tipos de portafolio

  // Generar lista de meses dinámicamente
  const generarMeses = () => {
    const meses = [];
    let fecha = new Date();
    for (let i = 0; i < 12; i++) {
      const inicioMes = startOfMonth(fecha);
      const finMes = endOfMonth(fecha);
      meses.push({
        nombre: format(inicioMes, 'MMMM'),
        inicio: format(inicioMes, 'yyyy-MM-dd'),
        fin: format(finMes, 'yyyy-MM-dd'),
      });
      fecha = addMonths(fecha, 1);
    }
    return meses;
  };

  const mesesDelAño = generarMeses();

  useEffect(() => {
    // Obtener la lista de usuarios al cargar el componente
    const fetchUsuarios = async () => {
      const token = localStorage.getItem('token'); // Obtener el token del localStorage

      try {
        const response = await axios.get('http://localhost:5000/api/usuarios', {
          headers: {
            Authorization: `Bearer ${token}` // Enviar el token en el encabezado
          }
        });
        setUsuarios(response.data); // Almacenar la lista de usuarios

        // Establecer el usuario actual como administrador por defecto
        const currentUser = response.data.find(user => user.nombreUsuario === localStorage.getItem('nombreUsuario'));
        if (currentUser) {
          setAdmins([currentUser._id]); // Establecer el ID del usuario como administrador por defecto
        }
      } catch (error) {
        console.error('Error al obtener usuarios:', error);
      }
    };

    fetchUsuarios();
  }, []);

  const handleMesChange = (e) => {
    const mesSeleccionado = mesesDelAño.find(m => m.nombre === e.target.value);
    if (mesSeleccionado) {
      setMes(mesSeleccionado.nombre);
      setInicio(mesSeleccionado.inicio);
      setFin(mesSeleccionado.fin);
    } else {
      setMes('');
      setInicio('');
      setFin('');
    }
  };

  const agregarAdmin = () => {
    const usuario = usuarios.find(
      (user) => user.nombreUsuario === inputAdmin || user.email === inputAdmin
    );
    if (usuario && !admins.includes(usuario._id)) {
      setAdmins([...admins, usuario._id]);
      setInputAdmin('');
    } else {
      setMensaje('Usuario no encontrado o ya agregado');
    }
  };

  const agregarUsuario = () => {
    const usuario = usuarios.find(
      (user) => user.nombreUsuario === inputUsuario || user.email === inputUsuario
    );
    if (usuario && !usuariosSeleccionados.includes(usuario._id)) {
      setUsuariosSeleccionados([...usuariosSeleccionados, usuario._id]);
      setInputUsuario('');
    } else {
      setMensaje('Usuario no encontrado o ya agregado');
    }
  };

  const eliminarAdmin = (id) => {
    setAdmins(admins.filter((adminId) => adminId !== id));
  };

  const eliminarUsuario = (id) => {
    setUsuariosSeleccionados(usuariosSeleccionados.filter((userId) => userId !== id));
  };

  const crearPortafolio = async () => {
    const token = localStorage.getItem('token'); // Obtener el token del localStorage
    if (!token) {
      setMensaje('No hay sesión activa. Por favor, inicia sesión.');
      return;
    }

    // Decodificar el token
    const decodedToken = JSON.parse(atob(token.split('.')[1])); // Decodifica el payload del token
    const usuarioId = decodedToken.id; // Obtener el ID del usuario

    const portafolioData = {
      nombre,
      tipo,
      admins: [...admins, usuarioId], // Agregar el ID del usuario autenticado como administrador
      mes,
      inicio,
      fin,
      usuarios: [...usuariosSeleccionados, usuarioId], // Agregar el ID del usuario autenticado a la lista de usuarios
    };

    try {
      await axios.post('http://localhost:5000/api/portafolios', portafolioData, {
        headers: {
          Authorization: `Bearer ${token}` // Enviar el token en el encabezado
        }
      });
      setMensaje('Portafolio creado exitosamente');
      navigate('/'); // Redirigir a la página de inicio o a otra página
    } catch (error) {
      console.error('Error al crear el portafolio:', error); // Log del error completo
      setMensaje('Error al crear el portafolio: ' + (error.response?.data.error || 'Error desconocido'));
    }
  };

  const currentUser = localStorage.getItem('nombreUsuario');

  return (
    <div className="crear-portafolio-container">
      <h1>Crear Portafolio</h1>
      <input
        type="text"
        placeholder="Nombre del Portafolio"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
      />
      <select multiple value={tipo} onChange={(e) => setTipo([...e.target.selectedOptions].map(option => option.value))}>
        <option value="">Selecciona tipos</option>
        {tiposDisponibles.map((tipo, index) => (
          <option key={index} value={tipo}>{tipo}</option>
        ))}
      </select>
      {tipo.includes('Compartido') && (
        <>
          <div className="agregar-usuario">
            <input
              type="text"
              placeholder="Buscar administrador (nombre o email)"
              value={inputAdmin}
              onChange={(e) => setInputAdmin(e.target.value)}
            />
            <button className="agregar" onClick={agregarAdmin}>Agregar Administrador</button>
          </div>
          <div className="lista-usuarios">
            {admins.map((adminId) => {
              const admin = usuarios.find((user) => user._id === adminId);
              return (
                <div key={adminId} className="usuario-item">
                  <span>{admin?.nombreUsuario}</span>
                  {admin?.nombreUsuario !== currentUser && (
                    <button className="eliminar" onClick={() => eliminarAdmin(adminId)}>×</button>
                  )}
                </div>
              );
            })}
          </div>
          {/* <label>Usuarios que puedan ver el portafolio</label> */}
          <div className="agregar-usuario">
            <input
              type="text"
              placeholder="Buscar usuario (nombre o email)"
              value={inputUsuario}
              onChange={(e) => setInputUsuario(e.target.value)}
            />
            <button className="agregar" onClick={agregarUsuario}>Agregar Usuario</button>
          </div>
          <div className="lista-usuarios">
            {usuariosSeleccionados.map((userId) => {
              const usuario = usuarios.find((user) => user._id === userId);
              return (
                <div key={userId} className="usuario-item">
                  <span>{usuario?.nombreUsuario}</span>
                  {usuario?.nombreUsuario !== currentUser && (
                    <button className="eliminar" onClick={() => eliminarUsuario(userId)}>×</button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
      <select value={mes} onChange={handleMesChange}>
        <option value="">Selecciona un mes</option>
        {mesesDelAño.map((mes, index) => (
          <option key={index} value={mes.nombre}>{mes.nombre}</option>
        ))}
      </select>
      <input
        type="date"
        placeholder="Fecha de Inicio"
        value={inicio}
        onChange={(e) => setInicio(e.target.value)}
      />
      <input
        type="date"
        placeholder="Fecha de Fin"
        value={fin}
        onChange={(e) => setFin(e.target.value)}
      />
      <button className="crear" onClick={crearPortafolio}>Crear Portafolio</button>
      {mensaje && <p>{mensaje}</p>} {/* Mostrar el mensaje si existe */}
    </div>
  );
};

export default CrearPortafolio;