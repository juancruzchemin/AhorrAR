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
    const [busquedaUsuario, setBusquedaUsuario] = useState('');
    const [usuariosEncontrados, setUsuariosEncontrados] = useState([]);
    const [cargandoUsuarios, setCargandoUsuarios] = useState(false);
    const totalAsignado = mesActual?.totalAsignado || 0;
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
    const [nuevoPortafolio, setNuevoPortafolio] = useState({
        nombre: '',
        tipo: 'personal',
        mes: '',
        inicio: '',
        fin: '',
        usuariosSeleccionados: [] // Nuevo campo para usuarios seleccionados
    });
    const [modalAsignacionCompartida, setModalAsignacionCompartida] = useState({
        abierto: false,
        portafolioId: null,
        asignacionesUsuarios: [],
        total: 0
    });

    const calcularDisponible = () => {
        const totalIngresos = (mesActual && Array.isArray(mesActual.ingresos))
            ? mesActual.ingresos.reduce((total, ingreso) => total + (ingreso?.monto || 0), 0)
            : 0;
        return totalIngresos - totalAsignado;
    };

    const disponible = calcularDisponible();
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
                    asignacionesUsuarios: p.asignacionesUsuarios,
                    tipo: p.tipo,
                    monto: p.montoAsignado ||
                        mesActual.asignacionesIngresos?.find(a => a.portafolioId === p._id)?.monto ||
                        0
                }));

                setAsignaciones(inicialAsignaciones);

                // Obtener detalles completos de los usuarios para cada portafolio
                const portafoliosConUsuarios = await Promise.all(portafoliosFiltrados.map(async portafolio => {
                    if (portafolio.usuarios && portafolio.usuarios.length > 0) {
                        try {
                            const usuariosResponse = await axios.get(`${API_URL}/api/usuarios/lista`, {
                                headers: { Authorization: `Bearer ${token}` },
                                params: { ids: portafolio.usuarios.join(',') }
                            });
                            return {
                                ...portafolio,
                                usuarios: usuariosResponse.data
                            };
                        } catch (error) {
                            console.error("Error obteniendo usuarios:", error);
                            return portafolio;
                        }
                    }
                    return portafolio;
                }));

                setPortafolios(portafoliosConUsuarios);

            } catch (error) {
                console.error("Error fetching portfolios:", error);
                setMensaje('Error al cargar portafolios: ' + (error.response?.data?.error || error.message));
            } finally {
                setLoading(false);
            }
        };

        fetchPortafolios();
    }, [mesActual, API_URL, token]);

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

    const handleAsignacionChange = (index, nuevoValor) => {
        // 1. Manejo de valor vacío
        if (nuevoValor === '') {
            const nuevasAsignaciones = [...asignaciones];
            nuevasAsignaciones[index] = {
                ...nuevasAsignaciones[index],
                monto: ''
            };
            setAsignaciones(nuevasAsignaciones);
            setMensaje('');
            return;
        }

        // 2. Validación numérica
        const valorNumerico = Number(nuevoValor);
        if (isNaN(valorNumerico)) {
            setMensaje('Por favor ingrese un número válido');
            return;
        }

        // 3. Cálculo de suma actual (optimizado)
        const sumaActual = asignaciones.reduce((total, element, i) => {
            if (i === index) return total;

            let monto = 0;
            if (Array.isArray(element.tipo) && element.tipo.includes('compartido')) {
                const userAlloc = element.asignacionesUsuarios?.find(a => a.usuario === userId);
                monto = userAlloc?.monto || 0;
            } else {
                monto = element.monto || 0;
            }

            return total + Number(monto);
        }, 0);

        // 4. Validación de límite
        const totalProvisional = sumaActual + valorNumerico;
        const ingresoMes = Number(mesActual.ingreso);
        const excedente = totalProvisional - ingresoMes;

        if (excedente > 0) {
            const maxPermitido = (ingresoMes - sumaActual).toFixed(2);
            setMensaje(`Supera el límite por $${excedente.toFixed(2)}. Máximo permitido: $${maxPermitido}`);

            // Auto-ajuste al máximo permitido
            const nuevasAsignaciones = [...asignaciones];
            nuevasAsignaciones[index] = {
                ...nuevasAsignaciones[index],
                monto: Number(maxPermitido)
            };
            setAsignaciones(nuevasAsignaciones);
            return;
        }

        // 5. Actualización exitosa
        const nuevasAsignaciones = [...asignaciones];
        nuevasAsignaciones[index] = {
            ...nuevasAsignaciones[index],
            monto: valorNumerico
        };
        setAsignaciones(nuevasAsignaciones);
        setMensaje('');
    };

    const guardarAsignaciones = async () => {
        try {
            // 1. Preparar datos para enviar (convertir vacíos a 0 y asegurar 2 decimales)
            const asignacionesParaGuardar = asignaciones.map(asign => ({
                ...asign,
                monto: parseFloat((asign.monto === '' ? 0 : (asign.monto || 0)).toFixed(2))
            }));

            // 2. Calcular total asignado (versión adaptada)
            const totalAsignado = asignaciones.reduce((total, element) => {
                let monto = 0;

                if (Array.isArray(element.tipo) && element.tipo.includes('compartido')) {
                    // Para portafolios compartidos, tomar solo el monto del usuario actual
                    const userAlloc = element.asignacionesUsuarios?.find(a => a.usuario === userId);
                    monto = userAlloc?.monto || 0;
                } else {
                    // Para portafolios no compartidos, tomar el monto completo
                    monto = element.monto || 0;
                }

                return total + parseFloat(monto);
            }, 0);

            // 3. Validaciones mejoradas
            const ingresoMes = parseFloat(mesActual.ingreso);
            const excedente = parseFloat((totalAsignado - ingresoMes).toFixed(2));

            if (excedente > 0) {
                setMensaje(`Error: Excedes el ingreso mensual por $${excedente.toLocaleString()}`);
                return;
            }

            if (asignacionesParaGuardar.some(a => a.monto < 0)) {
                setMensaje('Error: No se permiten valores negativos');
                return;
            }

            // 4. Actualizar asignaciones en el mes (versión optimizada)
            const [responseMes, ...portafoliosResponses] = await Promise.all([
                axios.put(
                    `${API_URL}/api/mes/${mesActual._id}/asignaciones`,
                    { asignacionesIngresos: asignacionesParaGuardar },
                    { headers: { Authorization: `Bearer ${token}` } }
                ),
                ...asignacionesParaGuardar.map(asignacion =>
                    axios.put(
                        `${API_URL}/api/portafolios/${asignacion.portafolioId}/monto-asignado`,
                        { montoAsignado: parseFloat(asignacion.monto) },
                        { headers: { Authorization: `Bearer ${token}` } }
                    )
                )
            ]);

            // 5. Actualizar estados locales
            if (onUpdate) onUpdate(responseMes.data.mesActualizado);

            setPortafolios(prevPortafolios =>
                prevPortafolios.map(p => {
                    const asignacion = asignacionesParaGuardar.find(a => a.portafolioId === p._id);
                    return asignacion ? {
                        ...p,
                        montoAsignado: parseFloat(asignacion.monto)
                    } : p;
                })
            );

            // 6. Actualizar estado de asignaciones
            setAsignaciones(asignacionesParaGuardar.map(a => ({
                ...a,
                monto: parseFloat(a.monto)
            })));

            setMensaje('¡Asignaciones guardadas correctamente!');

        } catch (error) {
            console.error('Error al guardar:', error);
            setMensaje(error.response?.data?.message ||
                error.response?.data?.error ||
                'Error al guardar. Por favor verifica los datos e intenta nuevamente.');
        } finally {
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

    const obtenerDetallesUsuarios = async (userIds) => {
        try {
            if (!userIds || userIds.length === 0) return [];

            const token = localStorage.getItem('token');
            const idsSolo = userIds.map(u => typeof u === 'string' ? u : u._id);

            const response = await axios.get(`${API_URL}/api/usuarios/lista`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { ids: idsSolo.join(',') }
            });

            return response.data || [];
        } catch (error) {
            console.error('Error obteniendo detalles de usuarios:', error);
            return [];
        }
    };

    const abrirModalAsignacionCompartida = async (portafolioId, userIds, montoActual) => {
        try {
            // Obtener detalles completos de los usuarios
            const usuarios = await obtenerDetallesUsuarios(userIds);

            if (usuarios.length === 0) {
                setMensaje('No se pudieron cargar los usuarios de este portafolio');
                return;
            }

            // Obtener el portafolio con sus asignaciones actuales
            const portafolio = portafolios.find(p => p._id === portafolioId);
            const asignacionesActuales = portafolio?.asignacionesUsuarios || [];

            console.log('Asignaciones actuales del portafolio:', asignacionesActuales);

            // Inicializar asignaciones por usuario con valores existentes
            const asignacionesIniciales = usuarios.map(usuario => {
                // Buscar asignación existente para este usuario
                const asignacionExistente = asignacionesActuales.find(
                    a => a.usuario?.toString() === usuario._id.toString()
                );

                console.log(`Usuario: ${usuario._id} - Asignación encontrada:`, asignacionExistente);

                return {
                    usuarioId: usuario._id,
                    nombre: usuario.nombre || usuario.email || `Usuario ${usuario._id.substring(0, 5)}`,
                    monto: asignacionExistente?.monto || 0
                };
            });

            console.log('Asignaciones iniciales:', asignacionesIniciales);

            // Calcular el total actual
            const totalActual = asignacionesIniciales.reduce((sum, a) => sum + a.monto, 0);
            const totalDisponible = mesActual.disponible + (montoActual || 0);

            setModalAsignacionCompartida({
                abierto: true,
                portafolioId,
                asignacionesUsuarios: asignacionesIniciales,
                total: totalActual,
                nombrePortafolio: portafolio?.nombre || 'Portafolio compartido'
            });

        } catch (error) {
            console.error('Error al abrir modal de asignación compartida:', error);
            setMensaje('Error al cargar la información de usuarios');
        }
    };

    // Función para manejar cambios en el modal de portafolios compartidos
    const manejarCambioAsignacionUsuario = (usuarioId, nuevoValor) => {
        const valorNumerico = nuevoValor === '' ? 0 : parseFloat(nuevoValor) || 0;

        // Calcular suma de otros portafolios (no compartidos)
        const sumaOtrosPortafolios = asignaciones
            .filter(asign => !asign.esCompartido)
            .reduce((sum, asign) => sum + (asign.monto || 0), 0);

        // Calcular suma de otros usuarios en portafolios compartidos
        const sumaOtrosUsuarios = modalAsignacionCompartida.asignacionesUsuarios
            .filter(u => u.usuarioId !== usuarioId)
            .reduce((sum, u) => sum + (u.monto || 0), 0);

        // Validar límite
        if (sumaOtrosPortafolios + sumaOtrosUsuarios + valorNumerico <= mesActual.ingreso) {
            setModalAsignacionCompartida(prev => ({
                ...prev,
                asignacionesUsuarios: prev.asignacionesUsuarios.map(u =>
                    u.usuarioId === usuarioId
                        ? { ...u, monto: nuevoValor === '' ? '' : valorNumerico }
                        : u
                ),
                total: sumaOtrosPortafolios + sumaOtrosUsuarios + valorNumerico
            }));
        } else {
            setMensaje(`El total asignado no puede superar $${mesActual.ingreso.toLocaleString()}`);
        }
    };

    const guardarAsignacionCompartida = async () => {
        const { portafolioId, total, asignacionesUsuarios } = modalAsignacionCompartida;
        const token = localStorage.getItem('token');

        try {
            // 1. Actualizar el estado local
            setAsignaciones(asignaciones.map(a =>
                a.portafolioId === portafolioId ? { ...a, monto: total } : a
            ));

            // 2. Preparar datos para el backend
            const datosParaBackend = {
                asignacionesUsuarios: asignacionesUsuarios.map(asig => ({
                    usuario: asig.usuarioId, // Asegurarse que coincide con lo que espera el backend
                    monto: asig.monto
                }))
            };

            console.log('Enviando a:', `${API_URL}/api/portafolios/${portafolioId}/asignaciones-usuarios`);
            console.log('Datos enviados:', datosParaBackend);

            // 3. Enviar al backend
            const response = await axios.put(
                `${API_URL}/api/portafolios/${portafolioId}/asignaciones-usuarios`,
                datosParaBackend,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('Respuesta del servidor:', response.data);

            // 4. Cerrar modal y limpiar
            setModalAsignacionCompartida({
                abierto: false,
                portafolioId: null,
                asignacionesUsuarios: [],
                total: 0
            });

            // 5. Mostrar mensaje de éxito
            setMensaje('Asignaciones por usuario guardadas correctamente');

        } catch (err) {
            console.error('Error guardando asignaciones por usuario', err);

            let errorMsg = 'Error al guardar asignaciones';
            if (err.response) {
                if (err.response.status === 404) {
                    errorMsg = 'Ruta no encontrada - Verifica la URL del servidor';
                } else if (err.response.data?.error) {
                    errorMsg = err.response.data.error;
                }
            }

            setMensaje(errorMsg);
        }
    };

    if (loading) {
        return <div className="asignacion-loading">Cargando portafolios...</div>;
    }

    return (
        <div className="asignacion-container">
            <div className="asignacion-header">
                <h3 className="asignacion-title">Listas de movimientos</h3>
            </div>

            <div className="asignacion-portafolios">
                {portafolios.map((portafolio) => {
                    const asignacion = asignaciones.find(a => a.portafolioId === portafolio._id) || { monto: 0 };
                    const esInversion = portafolio.tipo?.includes('inversiones');
                    const esCompartido = portafolio.tipo?.includes('compartido') || portafolio.tipo?.some(t => t.includes('compartido'));
                    return (
                        <div
                            key={portafolio._id}
                            className={`portfolio-compact ${esInversion ? 'portfolio-compact--investment' : 'portfolio-compact--outcome'}`}
                        >
                            <div className="portfolio-compact__main">
                                {/* Movemos el onClick solo a los elementos que deben ser clickeables */}
                                <div
                                    className="portfolio-compact__info"
                                    onClick={() => esInversion
                                        ? navigate(`/portafolios/${portafolio._id}/inversiones`)
                                        : handlePortafolioClick(portafolio._id)
                                    }
                                    style={{ cursor: 'pointer', flex: 1 }} // Asegura que ocupe todo el espacio disponible
                                >
                                    <h4 className="portfolio-compact__title">
                                        {portafolio.nombre}
                                        <span className="portfolio-compact__badge">
                                            <i className="fas fa-chart-line"></i> {portafolio.tipo?.join(', ') || 'Sin tipo'}
                                        </span>
                                    </h4>
                                    <div className="portfolio-compact__meta">
                                        <span className="portfolio-compact__period">
                                            <i className="far fa-calendar-alt"></i> {formatRangoFechas(portafolio.inicio, portafolio.fin)}
                                        </span>
                                    </div>
                                </div>

                                <div className="portfolio-compact__amounts">
                                    <div className="compact-amount">
                                        <label className="compact-amount__label">Asignado:</label>
                                        <div className="compact-amount__input-container">
                                            <span className="compact-amount__currency">$</span>
                                            <input
                                                type="number"
                                                value={asignacion.monto === null || asignacion.monto === undefined ? '' : asignacion.monto}
                                                onChange={(e) => {
                                                    if (!esCompartido) {
                                                        handleAsignacionChange(
                                                            asignaciones.findIndex(a => a.portafolioId === portafolio._id),
                                                            e.target.value
                                                        );
                                                    }
                                                }}
                                                onClick={() => {
                                                    if (esCompartido) {
                                                        const montoUsuario = portafolio.asignacionesUsuarios?.find(a => a.usuarioId === userId)?.monto || 0;
                                                        abrirModalAsignacionCompartida(
                                                            portafolio._id,
                                                            portafolio.usuarios,
                                                            montoUsuario
                                                        );
                                                    }
                                                }}
                                                onBlur={() => {
                                                    const index = asignaciones.findIndex(a => a.portafolioId === portafolio._id);
                                                    if (asignaciones[index].monto === '') {
                                                        const nuevasAsignaciones = [...asignaciones];
                                                        nuevasAsignaciones[index] = {
                                                            ...nuevasAsignaciones[index],
                                                            monto: 0
                                                        };
                                                        setAsignaciones(nuevasAsignaciones);
                                                    }
                                                }}
                                                readOnly={esCompartido}
                                                className="compact-amount__input"
                                            />
                                        </div>
                                    </div>

                                    <div
                                        className="compact-total"
                                        onClick={() => esInversion
                                            ? navigate(`/portafolios/${portafolio._id}/inversiones`)
                                            : handlePortafolioClick(portafolio._id)
                                        }
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <label className="compact-total__label">Gastado:</label>
                                        <div className="compact-total__value">
                                            ${portafolio.totalGastado?.toLocaleString() || '0'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="asignacion-actions">
                <button
                    onClick={() => setShowCrearPortafolio(true)}
                    className="asignacion-btn asignacion-btn-primary"
                >
                    + Nuevo Portafolio
                </button>
                <button
                    onClick={guardarAsignaciones}
                    className="asignacion-btn asignacion-btn-primary"
                >
                    Guardar Asignaciones
                </button>
            </div>

            {mensaje && (
                <div className={`portfolio-message ${mensaje.includes('exitosamente') ? 'portfolio-message-success' : 'portfolio-message-error'
                    }`}>
                    {mensaje}
                    <button
                        className="portfolio-close-button"
                        onClick={() => setMensaje('')}
                        aria-label="Cerrar mensaje"
                    >
                        ×
                    </button>
                </div>
            )}

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

            {/* Modal para crear nuevo portafolio */}
            {showCrearPortafolio && (
                <div className="modal-overlay" onClick={() => setShowCrearPortafolio(false)}>
                    <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Crear Nuevo Portafolio</h3>
                            <button
                                className="modal-close-btn"
                                onClick={() => {
                                    setShowCrearPortafolio(false);
                                    setBusquedaUsuario('');
                                    setUsuariosEncontrados([]);
                                }}
                            >
                                &times;
                            </button>
                        </div>

                        <div className="modal-body">
                            {/* Nombre */}
                            <div className="form-group">
                                <label className="form-label">Nombre*</label>
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

                            {/* Tipo y Mes en fila */}
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Tipo*</label>
                                    <select
                                        name="tipo"
                                        value={nuevoPortafolio.tipo}
                                        onChange={(e) => {
                                            handleNuevoPortafolioChange(e);
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
                                        <option value="">Selecciona un tipo</option>
                                        <option value="personal">Personal</option>
                                        <option value="principal">Principal</option>
                                        <option value="compartido">Compartido</option>
                                        <option value="inversiones">Inversiones</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Mes*</label>
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
                            </div>

                            {/* Fechas en la misma fila */}
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Fecha Inicio*</label>
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
                                    <label className="form-label">Fecha Fin*</label>
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

                            {/* Usuarios compartidos */}
                            {nuevoPortafolio.tipo === 'compartido' && (
                                <div className="shared-users-section">
                                    <div className="form-group">
                                        <label className="form-label">Agregar Usuarios</label>
                                        <div className="user-search-container">
                                            <input
                                                type="text"
                                                placeholder="Buscar por nombre o email..."
                                                value={busquedaUsuario}
                                                onChange={(e) => setBusquedaUsuario(e.target.value)}
                                                className="form-input"
                                            />
                                            {cargandoUsuarios && (
                                                <div className="search-loading">
                                                    <div className="spinner"></div>
                                                    <span>Buscando usuarios...</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Resultados de búsqueda */}
                                        {usuariosEncontrados.length > 0 && (
                                            <div className="user-results-container">
                                                {usuariosEncontrados.map(usuario => (
                                                    <div
                                                        key={usuario._id}
                                                        onClick={() => agregarUsuario(usuario)}
                                                        className="user-result-item"
                                                    >
                                                        <div className="user-avatar">
                                                            {usuario.nombre.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="user-info">
                                                            <span className="user-name">{usuario.nombre}</span>
                                                            <span className="user-email">{usuario.email}</span>
                                                        </div>
                                                        <div className="add-icon">+</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Usuarios seleccionados */}
                                        {nuevoPortafolio.usuariosSeleccionados.length > 0 && (
                                            <div className="selected-users-container">
                                                <h4 className="selected-users-title">Usuarios agregados</h4>
                                                <div className="selected-users-list">
                                                    {nuevoPortafolio.usuariosSeleccionados.map(usuario => (
                                                        <div key={usuario._id} className="selected-user-item">
                                                            <div className="user-avatar">
                                                                {usuario.nombre.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="user-info">
                                                                <span className="user-name">{usuario.nombre}</span>
                                                            </div>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    eliminarUsuario(usuario._id);
                                                                }}
                                                                className="remove-user-btn"
                                                                title="Eliminar usuario"
                                                            >
                                                                &times;
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button
                                onClick={() => {
                                    setShowCrearPortafolio(false);
                                    setBusquedaUsuario('');
                                    setUsuariosEncontrados([]);
                                }}
                                className="btn-secondary"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={crearPortafolio}
                                className="btn-primary"
                                disabled={
                                    !nuevoPortafolio.nombre ||
                                    !nuevoPortafolio.tipo ||
                                    !nuevoPortafolio.mes ||
                                    !nuevoPortafolio.inicio ||
                                    !nuevoPortafolio.fin ||
                                    (nuevoPortafolio.tipo === 'compartido' &&
                                        nuevoPortafolio.usuariosSeleccionados.length === 0)
                                }
                            >
                                Crear Portafolio
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {modalAsignacionCompartida.abierto && (
                <div className="modal-overlay" onClick={() => setModalAsignacionCompartida(prev => ({ ...prev, abierto: false }))}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Distribuir asignación: {modalAsignacionCompartida.nombrePortafolio}</h3>

                        <div className="asignacion-usuarios-container">
                            {modalAsignacionCompartida.asignacionesUsuarios.map((asignacionUsuario) => (
                                <div key={asignacionUsuario.usuarioId} className="asignacion-usuario">
                                    <div className="usuario-info">
                                        <div className="usuario-nombre">{asignacionUsuario.nombre}</div>
                                        {asignacionUsuario.email && (
                                            <div className="usuario-email">{asignacionUsuario.email}</div>
                                        )}
                                    </div>
                                    <div className="input-container">
                                        <span>$</span>
                                        <input
                                            type="number"
                                            min="0"
                                            value={asignacionUsuario.monto}
                                            onChange={(e) => {
                                                const value = Math.max(0, parseFloat(e.target.value) || 0);
                                                manejarCambioAsignacionUsuario(asignacionUsuario.usuarioId, value);
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className={`total-asignacion ${modalAsignacionCompartida.total > (mesActual.ingreso || 0) ? 'excedido' : ''
                            }`}>
                            <strong>Total asignado:</strong>
                            <span>${modalAsignacionCompartida.total.toLocaleString()}</span>
                            {modalAsignacionCompartida.total > (mesActual.ingreso || 0) && (
                                <div className="advertencia">¡El total excede el ingreso disponible!</div>
                            )}
                        </div>

                        <div className="modal-actions">
                            <button
                                className="btn-cancelar"
                                onClick={() => setModalAsignacionCompartida(prev => ({ ...prev, abierto: false }))}
                            >
                                Cancelar
                            </button>
                            <button
                                className="btn-guardar"
                                onClick={guardarAsignacionCompartida}
                                disabled={modalAsignacionCompartida.total <= 0}
                            >
                                Guardar distribución
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AsignacionIngresosPortafolios;