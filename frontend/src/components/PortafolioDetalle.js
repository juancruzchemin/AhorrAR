import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { format, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import Modal from "./Modal"; // Importar el componente Modal
import '../styles/PortafolioDetalle.css';

const PortafolioDetalle = ({ portafolioId }) => {
  const navigate = useNavigate();
  const [portafolio, setPortafolio] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [editando, setEditando] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);

  // Estados para los campos editables
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState([]);
  const [mes, setMes] = useState('');
  const [inicio, setInicio] = useState('');
  const [fin, setFin] = useState('');
  const [usuariosSeleccionados, setUsuariosSeleccionados] = useState([]);
  const [inputUsuario, setInputUsuario] = useState('');
  const [usuariosDisponibles, setUsuariosDisponibles] = useState([]);

  // Estados para el modal
  const [modalDuplicarAbierto, setModalDuplicarAbierto] = useState(false);
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);

  useEffect(() => {
    const fetchPortafolio = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/portafolios/${portafolioId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPortafolio(response.data);
        // Inicializar los estados con los datos del portafolio
        setNombre(response.data.nombre);
        setTipo(response.data.tipo);
        setMes(response.data.mes);
        setInicio(response.data.inicio);
        setFin(response.data.fin);
        setUsuariosSeleccionados(response.data.usuarios.map(user => user._id));
      } catch (error) {
        console.error("Error al obtener el portafolio:", error);
        setMensaje('Error al obtener el portafolio: ' + (error.response?.data.error || 'Error desconocido'));
      }
    };

    const fetchUsuarios = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/usuarios`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsuariosDisponibles(response.data);
      } catch (error) {
        console.error("Error al obtener usuarios:", error);
      }
    };

    fetchPortafolio();
    fetchUsuarios();
  }, [portafolioId]);

  useEffect(() => {
    if (mes) {
      const selectedMonth = generarMeses().find(m => m.nombre === mes);
      if (selectedMonth) {
        setInicio(selectedMonth.inicio);
        setFin(selectedMonth.fin);
      }
    }
  }, [mes]);

  const guardarCambios = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setMensaje('No hay sesión activa. Por favor, inicia sesión.');
      return;
    }

    const usuariosValidos = usuariosSeleccionados.filter(userId => userId); // Filtrar usuarios inválidos

    const portafolioActualizado = {
      nombre,
      tipo,
      mes,
      inicio,
      fin,
      usuarios: [...new Set(usuariosValidos)], // Asegurarse de que el usuario autenticado esté en la lista de usuarios
    };

    try {
      const response = await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/portafolios/${portafolioId}`,
        portafolioActualizado,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setPortafolio(response.data);
      setUsuariosSeleccionados(response.data.usuarios.map(user => user._id)); // Actualizar usuarios seleccionados
      setMensaje('Portafolio actualizado exitosamente');
      setEditando(false);
      window.location.reload(); // Recargar la página después de guardar los cambios
    } catch (error) {
      console.error("Error al actualizar el portafolio:", error);
      setMensaje('Error al actualizar el portafolio: ' + (error.response?.data.error || 'Error desconocido'));
    }
  };

  const eliminarPortafolio = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setMensaje('No hay sesión activa. Por favor, inicia sesión.');
      return;
    }

    try {
      await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/api/portafolios/${portafolioId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMensaje("Portafolio eliminado correctamente.");
      navigate("/portafolios");
    } catch (error) {
      console.error("Error al eliminar el portafolio:", error);
      setMensaje("Error al eliminar el portafolio.");
    } finally {
      setModalEliminarAbierto(false); // Cerrar el modal después de eliminar el portafolio
    }
  };

  const agregarUsuario = () => {
    const usuario = usuariosDisponibles.find(
      (user) => user.nombreUsuario === inputUsuario || user.email === inputUsuario
    );
    if (usuario && !usuariosSeleccionados.includes(usuario._id)) {
      setUsuariosSeleccionados([...usuariosSeleccionados, usuario._id]);
      setInputUsuario('');
    } else {
      setMensaje('Usuario no encontrado o ya agregado');
    }
  };

  const eliminarUsuario = (id) => {
    setUsuariosSeleccionados(usuariosSeleccionados.filter((userId) => userId !== id));
  };

  const cancelarEdicion = () => {
    setEditando(false);
    setMensaje('');
  };

  const duplicarPortafolio = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setMensaje('No hay sesión activa. Por favor, inicia sesión.');
      return;
    }

    try {
      // Obtener el ID del usuario autenticado
      const responseUsuario = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/usuarios/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userId = responseUsuario.data._id;

      // Crear el nuevo portafolio duplicado
      const nuevoPortafolio = {
        nombre: `${portafolio.nombre} (Duplicado)`,
        tipo: portafolio.tipo,
        mes: portafolio.mes,
        inicio: portafolio.inicio,
        fin: portafolio.fin,
        usuarios: [...new Set([...portafolio.usuarios.map(user => user._id), userId])], // Asegurarse de que el usuario autenticado esté en la lista de usuarios
        admins: [...new Set([...portafolio.admins.map(admin => admin._id), userId])], // Asegurarse de que el usuario autenticado esté en la lista de administradores
        categorias: portafolio.categorias, // Copiar las categorías del portafolio actual
        wallet: portafolio.wallet, // Copiar la wallet del portafolio actual
        movimientos: [], // Inicializar con una lista vacía de movimientos
        portafolioId: portafolioId, // Enviar el ID del portafolio actual
      };

      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/portafolios`, nuevoPortafolio, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMensaje('Portafolio creado exitosamente');
    } catch (error) {
      console.error("Error al duplicar el portafolio:", error);
      setMensaje('Error al duplicar el portafolio: ' + (error.response?.data.error || 'Error desconocido'));
    } finally {
      setModalDuplicarAbierto(false); // Cerrar el modal después de duplicar el portafolio
    }
  };

  const generarMeses = () => {
    const meses = [];
    for (let i = 0; i < 12; i++) {
      const fecha = addMonths(new Date(), i);
      const nombre = format(fecha, 'MMMM yyyy');
      const inicio = format(startOfMonth(fecha), 'yyyy-MM-dd');
      const fin = format(endOfMonth(fecha), 'yyyy-MM-dd');
      meses.push({ nombre, inicio, fin });
    }
    return meses;
  };

  const cerrarMensaje = () => {
    setMensaje('');
  };

  if (!portafolio) return <p>Cargando...</p>;

  return (
    <div className="portafolio-detalle-container">
      {/* Contenido del portafolio */}
      <div className="portafolio-info">
        {/* Contenedor flexible para el nombre y el botón del menú */}
        <div className="nombre-y-menu">
          {/* Nombre del portafolio */}
          <h1 className="portafolio-nombre">{portafolio.nombre}</h1>
  
          {/* Menú desplegable */}
          <div className="menu-container">
            <button className="menu-button" onClick={() => setMenuAbierto(!menuAbierto)}>⋮</button>
            {menuAbierto && (
              <div className="dropdown-menu">
                <button onClick={() => { setEditando(true); setMenuAbierto(false); }}>Editar</button>
                <button onClick={() => setModalDuplicarAbierto(true)}>Crear siguiente portafolio</button>
                <button className="delete-button" onClick={() => setModalEliminarAbierto(true)}>Eliminar</button>
              </div>
            )}
          </div>
        </div>
        {editando ? (
          <div className="edit-mode">
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre del Portafolio"
            />
            <select
              multiple
              value={tipo}
              onChange={(e) => setTipo([...e.target.selectedOptions].map(option => option.value))}
            >
              <option value="Principal">Principal</option>
              <option value="Personal">Personal</option>
              <option value="Compartido">Compartido</option>
            </select>
            <select
              value={mes}
              onChange={(e) => setMes(e.target.value)}
            >
              <option value="">Selecciona un mes</option>
              {generarMeses().map((mes, index) => (
                <option key={index} value={mes.nombre}>{mes.nombre}</option>
              ))}
            </select>
            <input
              type="date"
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
            />
            <input
              type="date"
              value={fin}
              onChange={(e) => setFin(e.target.value)}
            />
            {tipo.includes("Compartido") && (
              <>
                <div className="agregar-usuario">
                  <input
                    type="text"
                    placeholder="Buscar usuario (nombre o email)"
                    value={inputUsuario}
                    onChange={(e) => setInputUsuario(e.target.value)}
                  />
                  <button onClick={agregarUsuario}>Agregar Usuario</button>
                </div>
                <div className="lista-usuarios">
                  {usuariosSeleccionados.map((userId) => {
                    const usuario = usuariosDisponibles.find((user) => user._id === userId);
                    return (
                      <div key={userId} className="usuario-item">
                        <span>{usuario?.nombreUsuario}</span>
                        <button onClick={() => eliminarUsuario(userId)}>Eliminar</button>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
            <div className="botones-edicion">
              <button onClick={guardarCambios}>Guardar</button>
              <button onClick={cancelarEdicion}>Cancelar</button>
            </div>
          </div>
        ) : (
          <div className="portafolio-detalle">
            <p><strong>Tipo:</strong> {portafolio.tipo.join(", ")}</p>
            <p><strong>Mes:</strong> {portafolio.mes}</p>
            <p><strong>Inicio:</strong> {new Date(portafolio.inicio).toLocaleDateString()}</p>
            <p><strong>Fin:</strong> {new Date(portafolio.fin).toLocaleDateString()}</p>
            <p><strong>Usuarios:</strong> {portafolio.usuarios?.map(user => user.nombreUsuario).join(", ") || "Sin usuarios"}</p>
          </div>
        )}
      </div>

      {/* Modal para duplicar el portafolio */}
      <Modal isOpen={modalDuplicarAbierto} onClose={() => setModalDuplicarAbierto(false)}>
        <h2>Crear siguiente portafolio</h2>
        <p >El nuevo portafolio solo incluira los movimientos que sean de gasto fijo</p>
        <div className="modal-buttons">
          <button className="crear-button" onClick={duplicarPortafolio}>Crear</button>
          <button className="cerrar-button" onClick={() => setModalDuplicarAbierto(false)}>Cancelar</button>
        </div>
      </Modal>

      {/* Modal para eliminar el portafolio */}
      <Modal isOpen={modalEliminarAbierto} onClose={() => setModalEliminarAbierto(false)}>
        <h2>Eliminar portafolio</h2>
        <p>¿Estás seguro de que deseas eliminar este portafolio?</p>
        <div className="modal-buttons">
          <button className="delete-button" onClick={eliminarPortafolio}>Eliminar</button>
          <button className="cerrar-button" onClick={() => setModalEliminarAbierto(false)}>Cancelar</button>
        </div>
      </Modal>

      {/* Mensajes de éxito o error */}
      {mensaje && (
        <div className={`mensaje ${mensaje.includes('exitosamente') ? 'exito' : 'error'}`}>
          {mensaje}
          <button className="close-button" onClick={cerrarMensaje}>x</button>
        </div>
      )}
    </div>
  );
};

export default PortafolioDetalle;