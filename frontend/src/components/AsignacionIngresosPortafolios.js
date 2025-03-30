import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, isValid, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import "../styles/AsignacionIngresosPortafolios.css";

const AsignacionIngresosPortafolios = ({ mesActual, onUpdate }) => {
    const token = localStorage.getItem('token');
    const navigate = useNavigate();
    const [portafolios, setPortafolios] = useState([]);
    const [asignaciones, setAsignaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mensaje, setMensaje] = useState('');
    const [showCrearPortafolio, setShowCrearPortafolio] = useState(false);
    const [nuevoPortafolio, setNuevoPortafolio] = useState({
        nombre: '',
        tipo: 'personal',
        mes: '',
        inicio: '',
        fin: '',
        usuariosSeleccionados: [] // Nuevo campo para usuarios seleccionados
    });

    const [busquedaUsuario, setBusquedaUsuario] = useState('');
    const [usuariosEncontrados, setUsuariosEncontrados] = useState([]);
    const [cargandoUsuarios, setCargandoUsuarios] = useState(false);
    const totalAsignado = asignaciones.reduce((sum, a) => sum + a.monto, 0);
    const [showNuevaInversion, setShowNuevaInversion] = useState(false);
    const [inversiones, setInversiones] = useState([]);
    const [nuevaInversion, setNuevaInversion] = useState({
        nombre: '',
        montoActual: 0,
        precioCompra: 0,
        precioActual: 0,
        fechaCompra: new Date().toISOString().split('T')[0], // Fecha actual en formato YYYY-MM-DD
        categoria: 'Acciones',
        subcategoria: 'Nacional'
    });
    const disponible = mesActual.ingreso - totalAsignado;
    const API_URL = process.env.REACT_APP_BACKEND_URL;

    // Obtener portafolios del usuario
    useEffect(() => {
        const fetchPortafolios = async () => {
            try {
                if (!token || !mesActual?.fechaInicio || !mesActual?.fechaFin) {
                    setMensaje('Datos incompletos para cargar portafolios');
                    setLoading(false);
                    return;
                }

                const response = await axios.get(`${API_URL}/api/portafolios`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const fechaInicioMes = new Date(mesActual.fechaInicio);
                const fechaFinMes = new Date(mesActual.fechaFin);

                const portafoliosFiltrados = response.data.filter(portafolio => {
                    try {
                        const inicioPortafolio = new Date(portafolio.inicio);
                        const finPortafolio = new Date(portafolio.fin);

                        return (
                            (inicioPortafolio >= fechaInicioMes && inicioPortafolio <= fechaFinMes) ||
                            (finPortafolio >= fechaInicioMes && finPortafolio <= fechaFinMes) ||
                            (inicioPortafolio <= fechaInicioMes && finPortafolio >= fechaFinMes)
                        );
                    } catch (e) {
                        console.error("Error procesando fechas del portafolio:", e);
                        return false;
                    }
                });

                setPortafolios(portafoliosFiltrados);

                // Inicializar asignaciones con montoAsignado si existe
                const inicialAsignaciones = portafoliosFiltrados.map(p => ({
                    portafolioId: p._id,
                    nombre: p.nombre,
                    monto: p.montoAsignado ||
                        mesActual.asignacionesIngresos?.find(a => a.portafolioId === p._id)?.monto ||
                        0
                }));

                setAsignaciones(inicialAsignaciones);

            } catch (error) {
                console.error("Error fetching portfolios:", error);
                setMensaje('Error al cargar portafolios: ' + (error.response?.data?.error || error.message));
            } finally {
                setLoading(false);
            }
        };

        fetchPortafolios();
    }, [mesActual, API_URL, token]);

    // Llamar esta función cuando cambie el input de búsqueda
    useEffect(() => {
        const timer = setTimeout(() => {
            buscarUsuarios(busquedaUsuario);
        }, 500);

        return () => clearTimeout(timer);
    }, [busquedaUsuario]);

    useEffect(() => {
        const fetchInversiones = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${API_URL}/api/inversiones`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setInversiones(response.data);
            } catch (error) {
                console.error("Error fetching inversiones:", error);
            }
        };

        fetchInversiones();
    }, [API_URL]);


    // Validación temprana
    if (!mesActual) {
        return (
            <div className="asignacion-container">
                <div className="asignacion-alerta">
                    No hay datos del mes actual disponibles. Por favor, selecciona un mes válido.
                </div>
            </div>
        );
    }

    // Obtener userId de forma segura
    const getUserId = () => {
        try {
            if (!token) return null;
            const decodedToken = JSON.parse(atob(token.split('.')[1]));
            return decodedToken?.id || null;
        } catch (error) {
            console.error("Error decoding token:", error);
            return null;
        }
    };

    const userId = getUserId();

    // Manejar cambio en el formulario de nuevo portafolio
    const handleNuevoPortafolioChange = (e) => {
        const { name, value } = e.target;

        setNuevoPortafolio(prev => {
            const updated = { ...prev, [name]: value };

            // Si cambia el mes, actualizar fechas automáticamente
            if (name === 'mes' && value) {
                try {
                    // Parsear el mes y año del formato "Mes Año" (ej: "March 2025")
                    const [mesNombre, anioStr] = value.split(' ');
                    const anio = parseInt(anioStr);

                    // Crear fecha (usamos enero como mes base y luego ajustamos)
                    let fecha = new Date(`${mesNombre} 1, ${anio}`);
                    if (isNaN(fecha.getTime())) {
                        console.error('Fecha inválida:', value);
                        return updated;
                    }

                    // Calcular fechas de inicio y fin
                    const fechaInicio = startOfMonth(fecha);
                    const fechaFin = endOfMonth(fecha);

                    updated.inicio = format(fechaInicio, 'yyyy-MM-dd');
                    updated.fin = format(fechaFin, 'yyyy-MM-dd');
                } catch (error) {
                    console.error('Error al procesar fechas:', error);
                }
            }

            return updated;
        });
    };

    // Crear nuevo portafolio
    const crearPortafolio = async () => {
        try {
            if (!token) {
                setMensaje('Debes iniciar sesión para crear portafolios');
                return;
            }

            // Validar campos obligatorios
            if (!nuevoPortafolio.nombre || !nuevoPortafolio.mes || !nuevoPortafolio.inicio || !nuevoPortafolio.fin) {
                setMensaje('Todos los campos son obligatorios');
                return;
            }

            // Obtener userId
            const userId = getUserId();
            if (!userId) {
                setMensaje('No se pudo identificar al usuario');
                return;
            }

            // Preparar lista de usuarios (siempre incluye al creador)
            const usuariosIds = [
                userId,
                ...nuevoPortafolio.usuariosSeleccionados.map(u => u._id)
            ].filter((v, i, a) => a.indexOf(v) === i); // Eliminar duplicados

            // Preparar datos para el backend
            const portafolioData = {
                nombre: nuevoPortafolio.nombre,
                tipo: [nuevoPortafolio.tipo], // Convertir a array
                mes: nuevoPortafolio.mes,
                inicio: nuevoPortafolio.inicio,
                fin: nuevoPortafolio.fin,
                usuarios: usuariosIds,
                admins: [userId] // Siempre el creador es admin
            };

            const response = await axios.post(`${API_URL}/api/portafolios`, portafolioData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.data?._id) {
                throw new Error('Respuesta inesperada del servidor');
            }

            // Actualizar estado
            setPortafolios(prev => [...prev, response.data]);
            setAsignaciones(prev => [...prev, {
                portafolioId: response.data._id,
                nombre: response.data.nombre,
                monto: 0
            }]);

            // Cerrar y resetear
            setShowCrearPortafolio(false);
            setNuevoPortafolio({
                nombre: '',
                tipo: 'personal',
                mes: '',
                inicio: '',
                fin: '',
                usuariosSeleccionados: []
            });
            setMensaje('Portafolio creado exitosamente');

        } catch (error) {
            console.error('Error:', error.response?.data || error.message);
            setMensaje(error.response?.data?.error || 'Error al crear portafolio');
        }
    };

    const handleAsignacionChange = (index, value) => {
        // Permitir campo vacío temporalmente
        if (value === '') {
            const nuevasAsignaciones = [...asignaciones];
            nuevasAsignaciones[index].monto = '';
            setAsignaciones(nuevasAsignaciones);
            setMensaje('');
            return;
        }

        const nuevoValor = parseFloat(value);

        // Si no es un número válido, no hacer nada
        if (isNaN(nuevoValor)) {
            return;
        }

        if (nuevoValor < 0) {
            setMensaje('El monto no puede ser negativo');
            return;
        }

        const nuevasAsignaciones = [...asignaciones];
        nuevasAsignaciones[index].monto = nuevoValor;

        const nuevoTotal = nuevasAsignaciones.reduce((sum, a) => typeof a.monto === 'number' ? sum + a.monto : sum, 0);

        if (nuevoTotal > mesActual.ingreso) {
            setMensaje('La suma de asignaciones no puede superar el ingreso total');
            // Limitar automáticamente el valor
            nuevasAsignaciones[index].monto = Math.min(
                nuevoValor,
                mesActual.ingreso - (nuevoTotal - nuevoValor)
            );
        }

        setAsignaciones(nuevasAsignaciones);
        setMensaje('');
    };

    // Guardar asignaciones
    const guardarAsignaciones = async () => {
        try {
            // Validación mejorada
            if (totalAsignado > mesActual.ingreso) {
                setMensaje('La suma de asignaciones no puede superar el ingreso total');
                return;
            }

            if (asignaciones.some(a => a.monto < 0)) {
                setMensaje('No se permiten valores negativos');
                return;
            }

            // Primero actualizar las asignaciones en el mes
            const response = await axios.put(
                `${API_URL}/api/mes/${mesActual._id}/asignaciones`,
                { asignacionesIngresos: asignaciones },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Luego actualizar el montoAsignado en cada portafolio
            const actualizacionesPortafolios = asignaciones.map(async (asignacion) => {
                try {
                    await axios.put(
                        `${API_URL}/api/portafolios/${asignacion.portafolioId}/monto-asignado`,
                        { montoAsignado: asignacion.monto },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                } catch (error) {
                    console.error(`Error actualizando portafolio ${asignacion.portafolioId}:`, error);
                    throw error;
                }
            });

            await Promise.all(actualizacionesPortafolios);

            // Actualizar el estado local si es necesario
            if (onUpdate) onUpdate(response.data.mesActualizado);

            // Actualizar los portafolios locales con los nuevos montos
            setPortafolios(prevPortafolios =>
                prevPortafolios.map(p => {
                    const asignacion = asignaciones.find(a => a.portafolioId === p._id);
                    return asignacion ? { ...p, montoAsignado: asignacion.monto } : p;
                })
            );

            setMensaje('Asignaciones guardadas correctamente');

        } catch (error) {
            console.error('Error al guardar asignaciones:', error);
            setMensaje('Error: ' + (error.response?.data?.error || error.message));
        }
    };

    // Función para formatear rango de fechas
    const formatRangoFechas = (inicio, fin) => {
        const fechaInicio = new Date(inicio);
        const fechaFin = new Date(fin);

        if (!isValid(fechaInicio)) return 'Fecha inválida';

        const formatoInicio = format(fechaInicio, 'dd/MM/yyyy');

        if (!isValid(fechaFin)) return formatoInicio;

        return `${formatoInicio} - ${format(fechaFin, 'dd/MM/yyyy')}`;
    };

    // Función para manejar el click en un portafolio
    const handlePortafolioClick = (portafolioId) => {
        navigate(`/portafolios/${portafolioId}`);
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

    const calcularPorcentaje = (monto) => {
        if (mesActual.ingreso <= 0 || typeof monto !== 'number') return '0%';
        const porcentaje = (monto / mesActual.ingreso) * 100;
        return `${porcentaje.toFixed(1)}%`;
    };

    const buscarUsuarios = async (query) => {
        if (!query || query.length < 3) {
            setUsuariosEncontrados([]);
            return;
        }

        try {
            setCargandoUsuarios(true);
            const response = await axios.get(`${API_URL}/api/usuarios/buscar?q=${query}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsuariosEncontrados(response.data);
        } catch (error) {
            console.error("Error buscando usuarios:", error);
            setMensaje('Error al buscar usuarios');
        } finally {
            setCargandoUsuarios(false);
        }
    };

    const agregarUsuario = (usuario) => {
        if (!nuevoPortafolio.usuariosSeleccionados.some(u => u._id === usuario._id)) {
            setNuevoPortafolio(prev => ({
                ...prev,
                usuariosSeleccionados: [...prev.usuariosSeleccionados, usuario]
            }));
            setBusquedaUsuario('');
            setUsuariosEncontrados([]);
        }
    };

    const eliminarUsuario = (usuarioId) => {
        setNuevoPortafolio(prev => ({
            ...prev,
            usuariosSeleccionados: prev.usuariosSeleccionados.filter(u => u._id !== usuarioId)
        }));
    };

    // ... después de tus otras funciones ...

    const handleNuevaInversionChange = (e) => {
        const { name, value } = e.target;
        setNuevaInversion(prev => ({
            ...prev,
            [name]: name.includes('precio') || name.includes('monto') ?
                parseFloat(value) || 0 : value
        }));
    };

    const agregarInversion = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setMensaje('Debes iniciar sesión para agregar inversiones');
                return;
            }

            const response = await axios.post(`${API_URL}/api/inversiones`, {
                ...nuevaInversion,
                usuario: userId // Asegúrate de que userId está definido
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setInversiones(prev => [...prev, response.data]);
            setShowNuevaInversion(false);
            setNuevaInversion({
                nombre: '',
                montoActual: 0,
                precioCompra: 0,
                precioActual: 0,
                fechaCompra: new Date().toISOString().split('T')[0],
                categoria: 'Acciones',
                subcategoria: 'Nacional'
            });
            setMensaje('Inversión agregada exitosamente');
        } catch (error) {
            console.error('Error al agregar inversión:', error);
            setMensaje(error.response?.data?.error || 'Error al agregar inversión');
        }
    };

    if (loading) {
        return <div className="asignacion-loading">Cargando portafolios...</div>;
    }

    return (
        <div className="asignacion-container">
            <div className="asignacion-header">
                <h3 className="asignacion-title">Asignación de Ingresos a Portafolios</h3>
            </div>

            {/* Modal para crear nuevo portafolio */}
            {showCrearPortafolio && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <h3>Crear Nuevo Portafolio</h3>

                        <div className="form-group">
                            <label>Nombre*:</label>
                            <input
                                type="text"
                                name="nombre"
                                value={nuevoPortafolio.nombre}
                                onChange={handleNuevoPortafolioChange}
                                className="form-input"
                                required
                                placeholder="Ej: Ahorros Vacaciones"
                            />
                        </div>

                        <div className="form-group">
                            <label>Tipo*:</label>
                            <select
                                name="tipo"
                                value={nuevoPortafolio.tipo}
                                onChange={(e) => {
                                    handleNuevoPortafolioChange(e);
                                    // Resetear usuarios si cambia de compartido a otro tipo
                                    if (e.target.value !== 'compartido') {
                                        setNuevoPortafolio(prev => ({
                                            ...prev,
                                            usuariosSeleccionados: []
                                        }));
                                    }
                                }}
                                className="form-input"
                                required
                            >
                                <option value="personal">Personal</option>
                                <option value="principal">Principal</option>
                                <option value="compartido">Compartido</option>
                                <option value="inversiones">Inversiones</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Mes*:</label>
                            <select
                                name="mes"
                                value={nuevoPortafolio.mes}
                                onChange={handleNuevoPortafolioChange}
                                className="form-input"
                                required
                            >
                                <option value="">Selecciona un mes</option>
                                {generarMeses().map((mes, index) => (
                                    <option key={index} value={mes.nombre}>{mes.nombre}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Fecha Inicio*:</label>
                                <input
                                    type="date"
                                    name="inicio"
                                    value={nuevoPortafolio.inicio}
                                    onChange={handleNuevoPortafolioChange}
                                    className="form-input"
                                    required
                                    readOnly
                                />
                            </div>

                            <div className="form-group">
                                <label>Fecha Fin*:</label>
                                <input
                                    type="date"
                                    name="fin"
                                    value={nuevoPortafolio.fin}
                                    onChange={handleNuevoPortafolioChange}
                                    className="form-input"
                                    required
                                    readOnly
                                />
                            </div>
                        </div>

                        {/* Sección de usuarios solo para portafolios compartidos */}
                        {nuevoPortafolio.tipo === 'compartido' && (
                            <div className="form-group">
                                <label>Agregar Usuarios:</label>
                                <div className="usuario-buscador">
                                    <input
                                        type="text"
                                        placeholder="Buscar por nombre o email..."
                                        value={busquedaUsuario}
                                        onChange={(e) => setBusquedaUsuario(e.target.value)}
                                        className="form-input"
                                    />
                                    {cargandoUsuarios && (
                                        <div className="loading-indicator">
                                            <span>Buscando usuarios...</span>
                                        </div>
                                    )}
                                    {usuariosEncontrados.length > 0 && (
                                        <ul className="usuarios-lista">
                                            {usuariosEncontrados.map(usuario => (
                                                <li
                                                    key={usuario._id}
                                                    onClick={() => agregarUsuario(usuario)}
                                                    className="usuario-item"
                                                >
                                                    <span className="usuario-nombre">{usuario.nombre}</span>
                                                    <span className="usuario-email">{usuario.email}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                {/* Usuarios seleccionados */}
                                {nuevoPortafolio.usuariosSeleccionados.length > 0 && (
                                    <div className="usuarios-seleccionados-container">
                                        <h4>Usuarios agregados:</h4>
                                        <ul className="usuarios-seleccionados-list">
                                            {nuevoPortafolio.usuariosSeleccionados.map(usuario => (
                                                <li key={usuario._id} className="usuario-seleccionado">
                                                    <div className="usuario-info">
                                                        <span className="usuario-nombre">{usuario.nombre}</span>
                                                        <span className="usuario-email">{usuario.email}</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => eliminarUsuario(usuario._id)}
                                                        className="eliminar-usuario-btn"
                                                        title="Eliminar usuario"
                                                    >
                                                        &times;
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="modal-actions">
                            <button
                                onClick={() => {
                                    setShowCrearPortafolio(false);
                                    setBusquedaUsuario('');
                                    setUsuariosEncontrados([]);
                                }}
                                className="modal-btn modal-btn-secondary"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={crearPortafolio}
                                className="modal-btn modal-btn-primary"
                                disabled={
                                    !nuevoPortafolio.nombre ||
                                    !nuevoPortafolio.tipo ||
                                    !nuevoPortafolio.mes ||
                                    !nuevoPortafolio.inicio ||
                                    !nuevoPortafolio.fin ||
                                    (nuevoPortafolio.tipo === 'compartido' && nuevoPortafolio.usuariosSeleccionados.length === 0)
                                }
                            >
                                Crear Portafolio
                            </button>
                        </div>

                        {mensaje && <div className="modal-mensaje">{mensaje}</div>}
                    </div>
                </div>
            )}

            <div className="asignacion-resumen">
                <div className="asignacion-total">
                    <span>Ingreso Total del Mes:</span>
                    <strong>${mesActual.ingreso.toLocaleString()}</strong>
                </div>
                <div className="asignacion-total">
                    <span>Total Asignado:</span>
                    <strong>${totalAsignado.toLocaleString()}</strong>
                </div>
                <div className="asignacion-total">
                    <span>Disponible:</span>
                    <strong className={disponible < 0 ? 'text-danger' : ''}>
                        ${disponible.toLocaleString()}
                    </strong>
                </div>
            </div>

            {mensaje && <div className="asignacion-mensaje">{mensaje}</div>}

            <div className="asignacion-portafolios">
                {portafolios.map((portafolio) => {
                    const asignacion = asignaciones.find(a => a.portafolioId === portafolio._id) || { monto: 0 };
                    const esInversion = portafolio.tipo?.includes('inversiones');

                    return (
                        <div
                            key={portafolio._id}
                            className={`asignacion-item ${esInversion ? 'portafolio-inversiones' : ''}`}
                        >
                            <div
                                className="asignacion-portafolio-info clickable"
                                onClick={() => esInversion
                                    ? navigate(`/portafolios/${portafolio._id}/inversiones`)
                                    : handlePortafolioClick(portafolio._id)
                                }
                            >
                                <h4>{portafolio.nombre}</h4>
                                <div className="asignacion-portafolio-meta">
                                    <span>Tipo: {portafolio.tipo?.join(', ') || 'No especificado'}</span>
                                    <span>Periodo: {formatRangoFechas(portafolio.inicio, portafolio.fin)}</span>
                                    {esInversion && (
                                        <span className="inversion-badge">Inversiones</span>
                                    )}
                                </div>
                            </div>

                            {(
                                <div className="asignacion-input-group">
                                    <label>Monto a asignar:</label>
                                    <div className="asignacion-input-container">
                                        <span className="asignacion-currency"></span>
                                        <input
                                            type="number"
                                            min="0"
                                            max={mesActual.ingreso}
                                            placeholder='$'
                                            value={asignacion.monto === '' ? '' : asignacion.monto}
                                            onChange={(e) => handleAsignacionChange(
                                                asignaciones.findIndex(a => a.portafolioId === portafolio._id),
                                                e.target.value
                                            )}
                                            className="asignacion-input"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="asignacion-actions">
                {/* <button
                    onClick={() => setShowNuevaInversion(true)}
                    className="asignacion-btn-inversion"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    Nuevo Portafolio de Inversiones
                </button> */}
                <button
                    onClick={() => setShowCrearPortafolio(true)}
                    className="asignacion-btn asignacion-btn-primary"
                >
                    + Nuevo Portafolio
                </button>
                <button
                    onClick={guardarAsignaciones}
                    disabled={totalAsignado > mesActual.ingreso || disponible < 0}
                    className="asignacion-btn asignacion-btn-primary"
                >
                    Guardar Asignaciones
                </button>
            </div>
            {/* {inversiones.length > 0 && (
                <div className="inversiones-container">
                    <div className="inversiones-header">
                        <span>Nombre</span>
                        <span>Monto</span>
                        <span>Precio Compra</span>
                        <span>Fecha Compra</span>
                        <span>Rentabilidad</span>
                        <span>Acciones</span>
                    </div>
                    <ul className="inversion-list">
                        {inversiones.map(inversion => (
                            <li key={inversion._id} className="inversion-item">
                                <span className="inversion-nombre">{inversion.nombre}</span>
                                <span className="inversion-monto">${inversion.montoActual.toLocaleString()}</span>
                                <span className="inversion-precio">${inversion.precioCompra.toLocaleString()}</span>
                                <span className="inversion-fecha">{format(new Date(inversion.fechaCompra), 'dd/MM/yyyy')}</span>
                                <span className={`inversion-rentabilidad ${inversion.precioActual >= inversion.precioCompra ? 'positiva' : 'negativa'}`}>
                                    {((inversion.precioActual - inversion.precioCompra) / inversion.precioCompra * 100).toFixed(2)}%
                                </span>
                                <div className="inversion-actions">
                                    <button className="mes-action-btn-edit">✏️</button>
                                    <button className="mes-action-btn-delete">🗑️</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )} */}

            {showNuevaInversion && (
                <div className="nueva-inversion-form">
                    <div className="form-group full-width">
                        <label>Nombre de la inversión</label>
                        <input type="text" className="mes-input" />
                    </div>

                    <div className="form-group">
                        <label>Monto invertido</label>
                        <input type="number" className="mes-input" />
                    </div>

                    <div className="form-group">
                        <label>Precio de compra</label>
                        <input type="number" className="mes-input" />
                    </div>

                    <div className="form-group">
                        <label>Fecha de compra</label>
                        <input type="date" className="mes-input" />
                    </div>

                    <div className="form-group">
                        <label>Categoría</label>
                        <select className="mes-input">
                            <option>Acciones</option>
                            <option>Bonos</option>
                            <option>Fondos</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Subcategoría</label>
                        <select className="mes-input">
                            <option>Nacional</option>
                            <option>Internacional</option>
                        </select>
                    </div>

                    <div className="nueva-inversion-actions">
                        <button className="mes-btn mes-btn-secondary">Cancelar</button>
                        <button className="mes-btn mes-btn-primary">Guardar</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AsignacionIngresosPortafolios;