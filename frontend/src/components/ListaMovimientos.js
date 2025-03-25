import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/ListaMovimientos.css";

const ListaMovimientos = ({ portafolioId }) => {
  const [movimientos, setMovimientos] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [categoriasDisponibles, setCategoriasDisponibles] = useState([]);
  const [usuariosDisponibles, setUsuariosDisponibles] = useState([]);
  const [esCompartido, setEsCompartido] = useState(false);
  const [nuevoMovimiento, setNuevoMovimiento] = useState({
    nombre: '',
    categoria: '',
    monto: '',
    fecha: new Date().toISOString().split('T')[0],
    tipo: 'gasto',
    fijo: false,
    usuario: ''
  });
  const [nuevaCategoria, setNuevaCategoria] = useState("");
  const [mostrarInputNuevaCategoria, setMostrarInputNuevaCategoria] = useState(false);
  const [ordenAscendente, setOrdenAscendente] = useState(true);
  const [loading, setLoading] = useState(true);

  // [Mantén todas tus funciones de fetch, isTokenExpired, checkTokenAndRedirect...]

  useEffect(() => {
    if (checkTokenAndRedirect()) return;

    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setMensaje('No hay sesión activa. Por favor, inicia sesión.');
        setLoading(false);
        return;
      }

      try {
        const [movimientosRes, categoriasRes, portafolioRes] = await Promise.all([
          axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/movimientos/${portafolioId}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/portafolios/${portafolioId}/categorias`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/portafolios/${portafolioId}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setMovimientos(movimientosRes.data);
        setCategoriasDisponibles(categoriasRes.data);
        setEsCompartido(portafolioRes.data.tipo.includes("Compartido"));
        setUsuariosDisponibles(portafolioRes.data.usuarios || []);
        
        if (portafolioRes.data.usuarioActual) {
          setNuevoMovimiento(prev => ({
            ...prev,
            usuario: portafolioRes.data.usuarioActual
          }));
        }
      } catch (error) {
        if (error.response?.status === 401) {
          checkTokenAndRedirect();
        } else {
          console.error("Error al obtener datos:", error);
          setMensaje('Error al obtener datos: ' + (error.response?.data.error || 'Error desconocido'));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [portafolioId]);

  // [Mantén todas tus funciones de manejo: agregarNuevoMovimiento, guardarMovimiento, etc...]

  if (loading) {
    return (
      <div className="portfolio-movements-container">
        <p>Cargando movimientos...</p>
      </div>
    );
  }

  return (
    <div className="portfolio-movements-container">
      <h3 className="portfolio-movements-title">Movimientos del Portafolio</h3>
      
      {mensaje && (
        <div className={`portfolio-message ${
          mensaje.includes('exitosamente') ? 'portfolio-message-success' : 'portfolio-message-error'
        }`}>
          {mensaje}
        </div>
      )}

      <table className="portfolio-movements-table">
        <thead className="portfolio-movements-header">
          <tr>
            <th>Nombre</th>
            <th>Tipo</th>
            <th>Categoría</th>
            <th>Monto</th>
            <th>Fecha</th>
            <th>Fijo</th>
            {esCompartido && <th>Usuario</th>}
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {/* Fila para agregar nuevo movimiento */}
          <tr className="portfolio-movement-form">
            <td colSpan={esCompartido ? 7 : 6}>
              <div className="portfolio-movement-form-row">
                <input
                  type="text"
                  className="portfolio-movement-form-input"
                  placeholder="Nombre"
                  value={nuevoMovimiento.nombre}
                  onChange={(e) => setNuevoMovimiento({...nuevoMovimiento, nombre: e.target.value})}
                />
              </div>
            </td>
            <td>
              <div className="portfolio-movement-form-row">
                <select
                  className="portfolio-movement-form-select"
                  value={nuevoMovimiento.tipo}
                  onChange={(e) => setNuevoMovimiento({...nuevoMovimiento, tipo: e.target.value, categoria: ""})}
                >
                  <option value="gasto">Gasto</option>
                  <option value="ingreso">Ingreso</option>
                </select>
              </div>
            </td>
            <td>
              <div className="portfolio-movement-form-row">
                {nuevoMovimiento.tipo === "gasto" ? (
                  <>
                    <select
                      className="portfolio-movement-form-select"
                      value={nuevoMovimiento.categoria}
                      onChange={(e) => {
                        if (e.target.value === "nueva") {
                          setMostrarInputNuevaCategoria(true);
                        } else {
                          setNuevoMovimiento({...nuevoMovimiento, categoria: e.target.value});
                        }
                      }}
                    >
                      <option value="">Seleccionar categoría</option>
                      {categoriasDisponibles.map((cat, index) => (
                        <option key={index} value={cat.nombre}>{cat.nombre}</option>
                      ))}
                      <option value="nueva">+ Nueva categoría</option>
                    </select>
                    {mostrarInputNuevaCategoria && (
                      <div style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
                        <input
                          type="text"
                          className="portfolio-movement-form-input"
                          placeholder="Nueva categoría"
                          value={nuevaCategoria}
                          onChange={(e) => setNuevaCategoria(e.target.value)}
                        />
                        <button 
                          className="portfolio-movement-btn portfolio-movement-btn-add"
                          onClick={agregarNuevaCategoria}
                        >
                          Agregar
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <input 
                    type="text" 
                    className="portfolio-movement-form-input"
                    value="Ingreso" 
                    readOnly 
                  />
                )}
              </div>
            </td>
            <td>
              <div className="portfolio-movement-form-row">
                <input
                  type="number"
                  className="portfolio-movement-form-input"
                  placeholder="Monto"
                  value={nuevoMovimiento.monto}
                  onChange={(e) => setNuevoMovimiento({...nuevoMovimiento, monto: e.target.value})}
                />
              </div>
            </td>
            <td>
              <div className="portfolio-movement-form-row">
                <input
                  type="date"
                  className="portfolio-movement-form-input"
                  value={nuevoMovimiento.fecha}
                  onChange={(e) => setNuevoMovimiento({...nuevoMovimiento, fecha: e.target.value})}
                />
              </div>
            </td>
            <td>
              <div className="portfolio-movement-form-row">
                <input
                  type="checkbox"
                  checked={nuevoMovimiento.fijo}
                  onChange={(e) => setNuevoMovimiento({...nuevoMovimiento, fijo: e.target.checked})}
                />
              </div>
            </td>
            {esCompartido && (
              <td>
                <div className="portfolio-movement-form-row">
                  <select
                    className="portfolio-movement-form-select"
                    value={nuevoMovimiento.usuario}
                    onChange={(e) => setNuevoMovimiento({...nuevoMovimiento, usuario: e.target.value})}
                  >
                    <option value="">Seleccionar usuario</option>
                    {usuariosDisponibles.map((usuario) => (
                      <option key={usuario._id} value={usuario._id}>
                        {usuario.nombreUsuario}
                      </option>
                    ))}
                  </select>
                </div>
              </td>
            )}
            <td>
              <div className="portfolio-movement-form-btns">
                <button 
                  className="portfolio-movement-btn portfolio-movement-btn-add"
                  onClick={agregarNuevoMovimiento}
                >
                  Agregar
                </button>
              </div>
            </td>
          </tr>

          {movimientos.length === 0 ? (
            <tr>
              <td colSpan={esCompartido ? 8 : 7} className="portfolio-no-movements">
                No hay movimientos registrados
              </td>
            </tr>
          ) : (
            movimientos.map((movimiento) => (
              <tr key={movimiento._id} className="portfolio-movement-row">
                <td className="portfolio-movement-cell">
                  <span className="portfolio-movement-label">Nombre:</span>
                  <span className="portfolio-movement-value">
                    {editandoId === movimiento._id ? (
                      <input
                        type="text"
                        className="portfolio-movement-form-input"
                        value={movimiento.nombre}
                        onChange={(e) => manejarCambio(e, movimiento)}
                      />
                    ) : (
                      movimiento.nombre
                    )}
                  </span>
                </td>
                
                <td className="portfolio-movement-cell">
                  <span className="portfolio-movement-label">Tipo:</span>
                  <span className="portfolio-movement-value">
                    {editandoId === movimiento._id ? (
                      <select
                        className="portfolio-movement-form-select"
                        value={movimiento.tipo}
                        onChange={(e) => manejarCambio(e, movimiento)}
                      >
                        <option value="gasto">Gasto</option>
                        <option value="ingreso">Ingreso</option>
                      </select>
                    ) : (
                      movimiento.tipo
                    )}
                  </span>
                </td>
                
                {/* Resto de celdas con el mismo patrón */}
                
                <td className="portfolio-movement-cell portfolio-movement-actions">
                  {editandoId === movimiento._id ? (
                    <>
                      <button 
                        className="portfolio-movement-btn portfolio-movement-btn-edit"
                        onClick={() => guardarMovimiento(movimiento)}
                      >
                        Guardar
                      </button>
                      <button 
                        className="portfolio-movement-btn portfolio-movement-btn-delete"
                        onClick={() => setEditandoId(null)}
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        className="portfolio-movement-btn portfolio-movement-btn-edit"
                        onClick={() => iniciarEdicion(movimiento)}
                      >
                        Editar
                      </button>
                      <button 
                        className="portfolio-movement-btn portfolio-movement-btn-delete"
                        onClick={() => eliminarMovimiento(movimiento._id)}
                      >
                        Eliminar
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ListaMovimientos;