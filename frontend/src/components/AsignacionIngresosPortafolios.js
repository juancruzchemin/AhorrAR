import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, isValid, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import "../styles/AsignacionIngresosPortafolios.css";

const AsignacionIngresosPortafolios = ({ mesActual, onUpdate }) => {
    const token = localStorage.getItem('token');
    // Decodificar el token
    const decodedToken = JSON.parse(atob(token.split('.')[1])); // Decodifica el payload del token
    const userId = decodedToken.id; // Obtener el ID del usuario

    const navigate = useNavigate();
    const [portafolios, setPortafolios] = useState([]);
    const [asignaciones, setAsignaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mensaje, setMensaje] = useState('');
    const [showCrearPortafolio, setShowCrearPortafolio] = useState(false);
    const [mes, setMes] = useState('');
    const [nuevoPortafolio, setNuevoPortafolio] = useState({
        nombre: '',
        tipo: 'personal', // Valor por defecto
        mes: '',
        anio: new Date().getFullYear(),
        inicio: '',
        fin: '',
        usuarios: [userId],
        admins: [userId]
    });
    const API_URL = process.env.REACT_APP_BACKEND_URL;

    // Lista de meses del año
    const mesesDelAnio = [
        { id: 1, nombre: 'Enero' },
        { id: 2, nombre: 'Febrero' },
        { id: 3, nombre: 'Marzo' },
        { id: 4, nombre: 'Abril' },
        { id: 5, nombre: 'Mayo' },
        { id: 6, nombre: 'Junio' },
        { id: 7, nombre: 'Julio' },
        { id: 8, nombre: 'Agosto' },
        { id: 9, nombre: 'Septiembre' },
        { id: 10, nombre: 'Octubre' },
        { id: 11, nombre: 'Noviembre' },
        { id: 12, nombre: 'Diciembre' }
    ];

    // Obtener portafolios del usuario
    useEffect(() => {
        const fetchPortafolios = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/portafolios`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const portafoliosFiltrados = response.data.filter(portafolio => {
                    const inicioPortafolio = new Date(portafolio.inicio);
                    const finPortafolio = new Date(portafolio.fin);
                    const fechaInicioMes = new Date(mesActual.fechaInicio);
                    const fechaFinMes = new Date(mesActual.fechaFin);

                    return (
                        (inicioPortafolio >= fechaInicioMes && inicioPortafolio <= fechaFinMes) ||
                        (finPortafolio >= fechaInicioMes && finPortafolio <= fechaFinMes) ||
                        (inicioPortafolio <= fechaInicioMes && finPortafolio >= fechaFinMes)
                    );
                });

                setPortafolios(portafoliosFiltrados);

                if (mesActual.asignacionesIngresos) {
                    setAsignaciones(mesActual.asignacionesIngresos);
                } else {
                    const nuevasAsignaciones = portafoliosFiltrados.map(p => ({
                        portafolioId: p._id,
                        nombre: p.nombre,
                        monto: 0
                    }));
                    setAsignaciones(nuevasAsignaciones);
                }

            } catch (error) {
                setMensaje('Error al cargar portafolios: ' + (error.response?.data.error || error.message));
            } finally {
                setLoading(false);
            }
        };

        if (mesActual) {
            fetchPortafolios();
        }
    }, [mesActual, API_URL, token]);

    // Manejar cambio en el formulario de nuevo portafolio
    const handleNuevoPortafolioChange = (e) => {
        const { name, value } = e.target;

        setNuevoPortafolio(prev => {
            const updated = { ...prev, [name]: value };

            // Si cambia el mes o el año, actualizar fechas automáticamente
            if ((name === 'mes' || name === 'anio') && (updated.mes && updated.anio)) {
                const mesNumero = parseInt(updated.mes);
                const anioNumero = parseInt(updated.anio);

                if (!isNaN(mesNumero) && !isNaN(anioNumero)) {
                    const fechaInicio = startOfMonth(new Date(anioNumero, mesNumero - 1));
                    const fechaFin = endOfMonth(new Date(anioNumero, mesNumero - 1));

                    updated.inicio = format(fechaInicio, 'yyyy-MM-dd');
                    updated.fin = format(fechaFin, 'yyyy-MM-dd');
                }
            }

            return updated;
        });
    };

    // Crear nuevo portafolio
    const crearPortafolio = async () => {
        try {
            // Verificar que el usuario esté autenticado
            if (!token) {
                setMensaje('Debes iniciar sesión para crear portafolios');
                return;
            }

            // Validar campos obligatorios
            if (!nuevoPortafolio.nombre || !nuevoPortafolio.mes || !nuevoPortafolio.anio) {
                setMensaje('Nombre, mes y año son campos obligatorios');
                return;
            }

            // Verificar que tenemos un portafolio base para copiar
            if (portafolios.length === 0) {
                setMensaje('No hay portafolios disponibles para copiar la configuración');
                return;
            }

            // Preparar los datos para el backend
            const portafolioData = {
                nombre: nuevoPortafolio.nombre,
                tipo: nuevoPortafolio.tipo,
                inicio: nuevoPortafolio.inicio,
                fin: nuevoPortafolio.fin,
                mes: nuevoPortafolio.mes, // Asegúrate que esto sea el ID del mes si el backend lo requiere
                usuarios: [userId], // Array con el ID del usuario actual como string
                admins: [userId],   // Array con el ID del usuario como admin
                portafolioId: portafolios[0]._id // Usamos el primer portafolio como base
            };

            console.log('Datos a enviar:', portafolioData);

            const response = await axios.post(`${API_URL}/api/portafolios`, portafolioData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            // Actualizar la lista de portafolios
            setPortafolios([...portafolios, response.data]);

            // Agregar nueva asignación
            setAsignaciones([...asignaciones, {
                portafolioId: response.data._id,
                nombre: response.data.nombre,
                monto: 0
            }]);

            // Cerrar modal y resetear formulario
            setShowCrearPortafolio(false);
            setNuevoPortafolio({
                nombre: '',
                tipo: 'personal',
                mes: '',
                anio: new Date().getFullYear(),
                inicio: '',
                fin: '',
                usuarios: [],
                admins: []
            });

            setMensaje('Portafolio creado exitosamente');

        } catch (error) {
            console.error('Error detallado:', error.response?.data || error.message);
            setMensaje('Error al crear portafolio: ' + (error.response?.data?.error || error.message));
        }
    };

    // Calcular total asignado y disponible
    const totalAsignado = asignaciones.reduce((sum, a) => sum + a.monto, 0);
    const disponible = mesActual.ingreso - totalAsignado;

    // Manejar cambio en asignaciones
    const handleAsignacionChange = (index, value) => {
        const nuevoValor = parseFloat(value) || 0;

        if (nuevoValor < 0) {
            setMensaje('El monto no puede ser negativo');
            return;
        }

        const nuevasAsignaciones = [...asignaciones];
        nuevasAsignaciones[index].monto = nuevoValor;

        const nuevoTotal = nuevasAsignaciones.reduce((sum, a) => sum + a.monto, 0);

        if (nuevoTotal > mesActual.ingreso) {
            setMensaje('La suma de asignaciones no puede superar el ingreso total');
            return;
        }

        setAsignaciones(nuevasAsignaciones);
        setMensaje('');
    };

    // Guardar asignaciones
    const guardarAsignaciones = async () => {
        try {
            const response = await axios.put(
                `${API_URL}/api/mes/${mesActual._id}/asignaciones`,
                { asignacionesIngresos: asignaciones },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setMensaje('Asignaciones guardadas correctamente');
            if (onUpdate) onUpdate(response.data);

        } catch (error) {
            setMensaje('Error al guardar asignaciones: ' + (error.response?.data.error || error.message));
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
                            <label>Nombre:</label>
                            <input
                                type="text"
                                name="nombre"
                                value={nuevoPortafolio.nombre}
                                onChange={handleNuevoPortafolioChange}
                                className="form-input"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Tipo:</label>
                            <select
                                name="tipo"
                                value={nuevoPortafolio.tipo}
                                onChange={handleNuevoPortafolioChange}
                                className="form-input"
                            >
                                <option value="personal">Personal</option>
                                <option value="principal">Principal</option>
                                <option value="compartido">Compartido</option>
                            </select>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Mes:</label>
                                <select
                                    className="portfolio-form-select"
                                    name="mes"
                                    value={nuevoPortafolio.mes}
                                    onChange={handleNuevoPortafolioChange}
                                >
                                    <option value="">Selecciona un mes</option>
                                    {generarMeses().map((mes, index) => (
                                        <option key={index} value={mes.nombre}>{mes.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Año:</label>
                                <input
                                    type="number"
                                    name="anio"
                                    value={nuevoPortafolio.anio}
                                    onChange={handleNuevoPortafolioChange}
                                    className="form-input"
                                    min="2000"
                                    max="2100"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Fecha Inicio:</label>
                            <input
                                type="date"
                                name="inicio"
                                value={nuevoPortafolio.inicio}
                                onChange={handleNuevoPortafolioChange}
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label>Fecha Fin:</label>
                            <input
                                type="date"
                                name="fin"
                                value={nuevoPortafolio.fin}
                                onChange={handleNuevoPortafolioChange}
                                className="form-input"
                            />
                        </div>

                        <div className="modal-actions">
                            <button
                                onClick={() => setShowCrearPortafolio(false)}
                                className="modal-btn modal-btn-secondary"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={crearPortafolio}
                                className="modal-btn modal-btn-primary"
                                disabled={!nuevoPortafolio.nombre || !nuevoPortafolio.mes}
                            >
                                Crear Portafolio
                            </button>
                        </div>
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

                    return (
                        <div key={portafolio._id} className="asignacion-item">
                            <div
                                className="asignacion-portafolio-info clickable"
                                onClick={() => handlePortafolioClick(portafolio._id)}
                            >
                                <h4>{portafolio.nombre}</h4>
                                <div className="asignacion-portafolio-meta">
                                    <span>Tipo: {portafolio.tipo?.join(', ') || 'No especificado'}</span>
                                    <span>Periodo: {formatRangoFechas(portafolio.inicio, portafolio.fin)}</span>
                                </div>
                            </div>

                            <div className="asignacion-input-group">
                                <label>Monto a asignar:</label>
                                <div className="asignacion-input-container">
                                    <span className="asignacion-currency">$</span>
                                    <input
                                        type="number"
                                        min="0"
                                        max={mesActual.ingreso}
                                        value={asignacion.monto || 0}
                                        onChange={(e) => handleAsignacionChange(
                                            asignaciones.findIndex(a => a.portafolioId === portafolio._id),
                                            e.target.value
                                        )}
                                        className="asignacion-input"
                                        onClick={(e) => e.stopPropagation()} // Evita que el click en el input navegue
                                    />
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
                    disabled={totalAsignado > mesActual.ingreso || disponible < 0}
                    className="asignacion-btn asignacion-btn-primary"
                >
                    Guardar Asignaciones
                </button>
            </div>
        </div>
    );
};

export default AsignacionIngresosPortafolios;