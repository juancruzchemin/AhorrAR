import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { format } from 'date-fns';
import "../styles/ListaMovimientos.css";
import useUser from '../hooks/useUser';

const ListaInversiones = ({ portafolioId }) => {
    const { user } = useUser();
    const [inversiones, setInversiones] = useState([]);
    const [mensaje, setMensaje] = useState('');
    const [editandoId, setEditandoId] = useState(null);
    const [cargando, setCargando] = useState(false);
    const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
    const [inversionAEliminar, setInversionAEliminar] = useState(null);
    const [nuevaInversion, setNuevaInversion] = useState({
        nombre: '',
        categoria: '',
        precioCompra: 0,
        precioActual: 0,
        cantidad: 1,
        fechaCompra: format(new Date(), 'yyyy-MM-dd'),
        notas: ''
      });

    const [categoriasPortafolio, setCategoriasPortafolio] = useState([]);

    // Obtener inversiones
    const fetchInversiones = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${process.env.REACT_APP_BACKEND_URL}/api/inversiones/portafolio/${portafolioId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setInversiones(response.data.inversiones || []);
        } catch (error) {
            console.error("Error al obtener inversiones:", error);
            setMensaje('Error al cargar inversiones');
        } finally {
            setCargando(false);
        }
    }, [portafolioId]);

    // Obtener categorías del portafolio
    const fetchCategorias = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${process.env.REACT_APP_BACKEND_URL}/api/portafolios/${portafolioId}/categorias`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const categorias = response.data || [];

            setCategoriasPortafolio(categorias);

            // Establecer categoría inicial para nueva inversión
            if (categorias.length > 0) {
                setNuevaInversion(prev => ({
                    ...prev,
                    categoria: categorias[0].nombre
                }));
            }
        } catch (error) {
            console.error("Error al obtener categorías:", error);
            setMensaje('Error al cargar categorías');
        }
    }, [portafolioId]);

    // Cargar datos iniciales
    useEffect(() => {
        if (portafolioId && user) {
            setCargando(true);
            Promise.all([fetchCategorias(), fetchInversiones()])
                .catch(error => {
                    console.error("Error inicial:", error);
                    setCargando(false);
                });
        }
    }, [portafolioId, user, fetchCategorias, fetchInversiones]);

    const manejarCambioNuevaInversion = (e) => {
        const { name, value } = e.target;
        setNuevaInversion(prev => ({
            ...prev,
            [name]: name === 'precioCompra' || name === 'precioActual' || name === 'cantidad' ?
                parseFloat(value) || 0 : value
        }));
    };

    const agregarNuevaInversion = async () => {
        if (!nuevaInversion.nombre.trim()) {
          setMensaje('El nombre es requerido');
          return;
        }
      
        try {
          const token = localStorage.getItem('token');
          const payload = {
            nombre: nuevaInversion.nombre,
            categoria: nuevaInversion.categoria,
            precioCompra: parseFloat(nuevaInversion.precioCompra),
            precioActual: parseFloat(nuevaInversion.precioActual),
            cantidad: parseInt(nuevaInversion.cantidad),
            fechaCompra: nuevaInversion.fechaCompra,
            notas: nuevaInversion.notas || '', // Asegurar que siempre haya un valor
            portafolioId
          };
      
          const response = await axios.post(
            `${process.env.REACT_APP_BACKEND_URL}/api/inversiones`,
            payload,
            { 
              headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              } 
            }
          );
      
          setInversiones(prev => [...prev, response.data]);
          setMensaje('Inversión agregada correctamente');
      
          // Resetear formulario
          setNuevaInversion({
            nombre: '',
            categoria: categoriasPortafolio[0]?.nombre || '',
            precioCompra: 0,
            precioActual: 0,
            cantidad: 1,
            fechaCompra: format(new Date(), 'yyyy-MM-dd'),
            notas: ''
          });
      
        } catch (error) {
          console.error("Error al agregar inversión:", error);
          setMensaje(error.response?.data?.details || 'Error al agregar inversión');
        }
      };

    const manejarCambio = (e, inversion) => {
        const { name, value } = e.target;
        setInversiones(inversiones.map(inv =>
            inv._id === inversion._id ? {
                ...inv,
                [name]: name === 'precioCompra' || name === 'precioActual' || name === 'cantidad' ?
                    parseFloat(value) || 0 : value,
                montoActual: name === 'precioActual' ? parseFloat(value) * (inv.cantidad || 1) : inv.montoActual
            } : inv
        ));
    };

    const guardarInversion = async (inversion) => {
        const token = localStorage.getItem('token');
        if (!token) {
            setMensaje('No hay sesión activa');
            return;
        }

        try {
            await axios.put(
                `${process.env.REACT_APP_BACKEND_URL}/api/inversiones/${inversion._id}`,
                inversion,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMensaje('Inversión actualizada');
            setEditandoId(null);
        } catch (error) {
            console.error('Error al actualizar:', error);
            setMensaje('Error al actualizar: ' + (error.response?.data.error || 'Error desconocido'));
        }
    };

    const eliminarInversion = async (id) => {
        const token = localStorage.getItem('token');
        if (!token) {
            setMensaje('No hay sesión activa');
            return;
        }

        try {
            await axios.delete(
                `${process.env.REACT_APP_BACKEND_URL}/api/inversiones/${id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setInversiones(prev => prev.filter(inv => inv._id !== id));
            setMensaje('Inversión eliminada');
        } catch (error) {
            console.error('Error al eliminar:', error);
            setMensaje('Error al eliminar: ' + (error.response?.data.error || 'Error desconocido'));
        }
    };

    const calcularRentabilidad = (inversion) => {
        if (!inversion.precioCompra) return '0.00';
        return ((inversion.precioActual - inversion.precioCompra) / inversion.precioCompra * 100).toFixed(2);
    };

    const formatearFecha = (fecha) => {
        if (!fecha) return '';
        if (typeof fecha === 'string' && fecha.includes('T')) {
            return format(new Date(fecha), 'dd/MM/yyyy');
        }
        return format(new Date(fecha), 'dd/MM/yyyy');
    };

    if (!user) {
        return (
            <div className="lista-inversiones-container">
                <h3>Inversiones del Portafolio</h3>
                <p className="error-message">No estás autenticado. Por favor, inicia sesión.</p>
            </div>
        );
    }

    if (cargando) {
        return <div className="loading">Cargando datos...</div>;
    }

    return (
        <div className="lista-inversiones-container">
            <h3>Inversiones del Portafolio</h3>
            {mensaje && <p className={`mensaje ${mensaje.includes('Error') ? 'error-message' : 'success-message'}`}>{mensaje}</p>}

            <table className="table">
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Categoría</th>
                        <th>Precio Compra</th>
                        <th>Precio Actual</th>
                        <th>Cantidad</th>
                        <th>Monto Total</th>
                        <th>Fecha Compra</th>
                        <th>Rentabilidad</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {/* Fila fija para agregar nueva inversión */}
                    <tr className="fila-formulario">
                        <td>
                            <input
                                type="text"
                                name="nombre"
                                value={nuevaInversion.nombre}
                                onChange={manejarCambioNuevaInversion}
                                placeholder="Nombre"
                                required
                            />
                        </td>
                        <td>
                            <select
                                name="categoria"
                                value={nuevaInversion.categoria}
                                onChange={manejarCambioNuevaInversion}
                                required
                            >
                                {categoriasPortafolio.map((cat, index) => (
                                    <option key={index} value={cat.nombre}>
                                        {cat.nombre}
                                    </option>
                                ))}
                            </select>
                        </td>
                        <td>
                            <input
                                type="number"
                                name="precioCompra"
                                value={nuevaInversion.precioCompra}
                                onChange={manejarCambioNuevaInversion}
                                min="0"
                                step="0.01"
                                required
                            />
                        </td>
                        <td>
                            <input
                                type="number"
                                name="precioActual"
                                value={nuevaInversion.precioActual}
                                onChange={manejarCambioNuevaInversion}
                                min="0"
                                step="0.01"
                                required
                            />
                        </td>
                        <td>
                            <input
                                type="number"
                                name="cantidad"
                                value={nuevaInversion.cantidad}
                                onChange={manejarCambioNuevaInversion}
                                min="1"
                                step="1"
                                required
                            />
                        </td>
                        <td>
                            ${(nuevaInversion.precioActual * nuevaInversion.cantidad).toFixed(2)}
                        </td>
                        <td>
                            <input
                                type="date"
                                name="fechaCompra"
                                value={nuevaInversion.fechaCompra}
                                onChange={manejarCambioNuevaInversion}
                                required
                            />
                        </td>
                        <td>
                            {nuevaInversion.precioCompra > 0 ?
                                (((nuevaInversion.precioActual - nuevaInversion.precioCompra) / nuevaInversion.precioCompra * 100).toFixed(2) + '%') :
                                '0.00%'}
                        </td>
                        <td>
                            <button onClick={agregarNuevaInversion}>Agregar</button>
                        </td>
                    </tr>

                    {inversiones.length === 0 && !cargando ? (
                        <tr>
                            <td colSpan="9">No hay inversiones registradas</td>
                        </tr>
                    ) : (
                        inversiones.map((inversion) => (
                            <tr key={inversion._id}>
                                <td onDoubleClick={() => setEditandoId(inversion._id)}>
                                    {editandoId === inversion._id ? (
                                        <input
                                            type="text"
                                            name="nombre"
                                            value={inversion.nombre}
                                            onChange={(e) => manejarCambio(e, inversion)}
                                            required
                                        />
                                    ) : (
                                        inversion.nombre
                                    )}
                                </td>
                                <td onDoubleClick={() => setEditandoId(inversion._id)}>
                                    {editandoId === inversion._id ? (
                                        <select
                                            name="categoria"
                                            value={inversion.categoria}
                                            onChange={(e) => manejarCambio(e, inversion)}
                                        >
                                            {categoriasPortafolio.map(cat => (
                                                <option key={cat.nombre} value={cat.nombre}>
                                                    {cat.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        inversion.categoria
                                    )}
                                </td>
                                <td onDoubleClick={() => setEditandoId(inversion._id)}>
                                    {editandoId === inversion._id ? (
                                        <input
                                            type="number"
                                            name="precioCompra"
                                            value={inversion.precioCompra}
                                            onChange={(e) => manejarCambio(e, inversion)}
                                            min="0"
                                            step="0.01"
                                        />
                                    ) : (
                                        `$${inversion.precioCompra.toFixed(2)}`
                                    )}
                                </td>
                                <td onDoubleClick={() => setEditandoId(inversion._id)}>
                                    {editandoId === inversion._id ? (
                                        <input
                                            type="number"
                                            name="precioActual"
                                            value={inversion.precioActual}
                                            onChange={(e) => manejarCambio(e, inversion)}
                                            min="0"
                                            step="0.01"
                                        />
                                    ) : (
                                        `$${inversion.precioActual.toFixed(2)}`
                                    )}
                                </td>
                                <td onDoubleClick={() => setEditandoId(inversion._id)}>
                                    {editandoId === inversion._id ? (
                                        <input
                                            type="number"
                                            name="cantidad"
                                            value={inversion.cantidad || 1}
                                            onChange={(e) => manejarCambio(e, inversion)}
                                            min="1"
                                            step="1"
                                        />
                                    ) : (
                                        inversion.cantidad || 1
                                    )}
                                </td>
                                <td>
                                    ${(inversion.precioActual * (inversion.cantidad || 1)).toFixed(2)}
                                </td>
                                <td onDoubleClick={() => setEditandoId(inversion._id)}>
                                    {editandoId === inversion._id ? (
                                        <input
                                            type="date"
                                            name="fechaCompra"
                                            value={inversion.fechaCompra?.split('T')[0] || format(new Date(), 'yyyy-MM-dd')}
                                            onChange={(e) => manejarCambio(e, inversion)}
                                        />
                                    ) : (
                                        formatearFecha(inversion.fechaCompra)
                                    )}
                                </td>
                                <td className={parseFloat(calcularRentabilidad(inversion)) >= 0 ? 'positivo' : 'negativo'}>
                                    {calcularRentabilidad(inversion)}%
                                </td>
                                <td>
                                    {editandoId === inversion._id ? (
                                        <>
                                            <button className="guardar" onClick={() => guardarInversion(inversion)}>Guardar</button>
                                            <button className="cancelar" onClick={() => setEditandoId(null)}>Cancelar</button>
                                        </>
                                    ) : (
                                        <>
                                            <button className="editar" onClick={() => setEditandoId(inversion._id)}>Editar</button>
                                            <button className="eliminar" onClick={() => {
                                                setInversionAEliminar(inversion);
                                                setMostrarConfirmacion(true);
                                            }}>Eliminar</button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            {/* Modal de confirmación para eliminar */}
            {mostrarConfirmacion && (
                <div className="modal-confirmacion">
                    <div className="modal-contenido">
                        <p>¿Estás seguro que deseas eliminar la inversión "{inversionAEliminar?.nombre}"?</p>
                        <div className="modal-botones">
                            <button onClick={() => setMostrarConfirmacion(false)}>Cancelar</button>
                            <button
                                className="eliminar"
                                onClick={() => {
                                    eliminarInversion(inversionAEliminar._id);
                                    setMostrarConfirmacion(false);
                                }}
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ListaInversiones;