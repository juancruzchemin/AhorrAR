import React, { useState, useEffect } from "react";
import axios from "axios";
import { format, startOfMonth, endOfMonth, subMonths, addMonths, parseISO, isWithinInterval } from 'date-fns';
import { CSSTransition } from 'react-transition-group';
import "../styles/MesComponent.css";
import AsignacionIngresosPortafolios from './AsignacionIngresosPortafolios';

const MesComponent = ({ usuarioId }) => {
    const [meses, setMeses] = useState([]);
    const [mesActual, setMesActual] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [mensaje, setMensaje] = useState("");
    const [loading, setLoading] = useState(true);
    const [navigating, setNavigating] = useState(false);
    const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
    const [ingresoAEliminar, setIngresoAEliminar] = useState(null);
    // Al inicio del componente
    const [ingresosExpandido, setIngresosExpandido] = useState(() => {
        const saved = localStorage.getItem('ingresosExpandido');
        return saved !== null ? JSON.parse(saved) : false;
    });

    // Efecto para guardar el estado
    useEffect(() => {
        localStorage.setItem('ingresosExpandido', JSON.stringify(ingresosExpandido));
    }, [ingresosExpandido]);

    const API_URL = process.env.REACT_APP_BACKEND_URL;
    const token = localStorage.getItem("token");

    const [nuevoIngreso, setNuevoIngreso] = useState({
        concepto: '',
        monto: '',
        categoria: 'otros'
    });

    const [editing, setEditing] = useState({
        field: null,
        ingresoId: null,
        values: {
            concepto: '',
            monto: '',
            fecha: ''
        }
    });

    // Función para obtener color según el mes
    const getMonthColor = (monthName) => {
        const colors = {
            enero: '#e74c3c',
            febrero: '#9b59b6',
            marzo: '#3498db',
            abril: '#2ecc71',
            mayo: '#f1c40f',
            junio: '#e67e22',
            julio: '#e74c3c',
            agosto: '#1abc9c',
            septiembre: '#d35400',
            octubre: '#34495e',
            noviembre: '#8e44ad',
            diciembre: '#16a085'
        };
        return colors[monthName.toLowerCase()] || '#3498db';
    };

    // Función para verificar si un mes ya existe
    const mesExiste = (meses, nombre, anio) => {
        return meses.some(m => m.nombre === nombre && m.anio === anio);
    };

    // Función para ordenar meses cronológicamente
    const ordenarMeses = (meses) => {
        return [...meses].sort((a, b) => {
            const dateA = new Date(a.fechaInicio);
            const dateB = new Date(b.fechaInicio);
            return dateA - dateB;
        });
    };

    // Función para obtener meses (modificada)
    const fetchMeses = async () => {
        if (!token) {
            setMensaje("No hay sesión activa. Por favor, inicia sesión.");
            setLoading(false);
            return;
        }

        try {
            const response = await axios.get(`${API_URL}/api/mes`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            let mesesOrdenados = ordenarMeses(response.data);

            if (mesesOrdenados.length === 0) {
                const now = new Date();
                const mes = format(now, 'MMMM');
                const anio = format(now, 'yyyy');
                const fechaInicio = startOfMonth(now);
                const fechaFin = endOfMonth(now);

                const resCrear = await axios.post(`${API_URL}/api/mes`, {
                    nombre: mes,
                    anio,
                    fechaInicio,
                    fechaFin,
                    ingreso: 0
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                mesesOrdenados = [resCrear.data];
            }

            // Encontrar el mes actual
            const now = new Date();
            const currentMonthIndex = mesesOrdenados.findIndex(m =>
                isWithinInterval(now, {
                    start: parseISO(m.fechaInicio),
                    end: parseISO(m.fechaFin)
                })
            );

            setMeses(mesesOrdenados);
            setMesActual(mesesOrdenados[currentMonthIndex >= 0 ? currentMonthIndex : 0]);
            setCurrentIndex(currentMonthIndex >= 0 ? currentMonthIndex : 0);
        } catch (error) {
            console.error("Error al obtener meses:", error.response?.data || error.message);
            setMensaje("Error al obtener los meses. Intenta recargar la página.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMeses();
    }, [usuarioId]);

    // Función para crear nuevo mes (con verificación de duplicados)
    const crearNuevoMes = async (fecha) => {
        const mesNombre = format(fecha, 'MMMM');
        const anio = format(fecha, 'yyyy');
        const fechaInicio = startOfMonth(fecha);
        const fechaFin = endOfMonth(fecha);

        // Verificar si el mes ya existe
        if (mesExiste(meses, mesNombre, anio)) {
            const mesExistente = meses.find(m => m.nombre === mesNombre && m.anio === anio);
            const index = meses.findIndex(m => m._id === mesExistente._id);

            setCurrentIndex(index);
            setMesActual(mesExistente);
            return mesExistente;
        }

        // Si no existe, crear nuevo
        const response = await axios.post(`${API_URL}/api/mes`, {
            nombre: mesNombre,
            anio,
            fechaInicio,
            fechaFin,
            ingreso: 0
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const nuevosMeses = ordenarMeses([...meses, response.data]);
        const newIndex = nuevosMeses.findIndex(m => m._id === response.data._id);

        setMeses(nuevosMeses);
        setCurrentIndex(newIndex);
        setMesActual(response.data);

        return response.data;
    };

    const agregarIngreso = async () => {
        if (!nuevoIngreso.concepto || !nuevoIngreso.monto) {
            setMensaje("Concepto y monto son requeridos");
            return;
        }

        try {
            const nuevosIngresos = [
                ...mesActual.ingresos,
                {
                    concepto: nuevoIngreso.concepto,
                    monto: parseFloat(nuevoIngreso.monto),
                    fecha: new Date()
                }
            ];

            const response = await axios.put(
                `${API_URL}/api/mes/${mesActual._id}`,
                {
                    ...mesActual,
                    ingresos: nuevosIngresos
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setMesActual(response.data);
            setMeses(meses.map(mes =>
                mes._id === mesActual._id ? response.data : mes
            ));
            setNuevoIngreso({ concepto: '', monto: '' });
            setMensaje("Ingreso agregado correctamente");
        } catch (error) {
            setMensaje("Error al agregar ingreso: " + (error.response?.data.error || "Error desconocido"));
        }
    };

    // Navegación modificada
    const irAlMesAnterior = async () => {
        if (currentIndex > 0) {
            // Navegar a mes existente
            const newIndex = currentIndex - 1;
            setCurrentIndex(newIndex);
            setMesActual(meses[newIndex]);
        } else {
            // Crear nuevo mes anterior
            try {
                setNavigating(true);
                const fechaAnterior = subMonths(new Date(mesActual.fechaInicio), 1);
                await crearNuevoMes(fechaAnterior);
            } catch (error) {
                setMensaje("Error al crear mes anterior: " + (error.response?.data?.error || error.message));
            } finally {
                setNavigating(false);
            }
        }
    };

    const irAlMesSiguiente = async () => {
        if (currentIndex < meses.length - 1) {
            // Navegar a mes existente
            const newIndex = currentIndex + 1;
            setCurrentIndex(newIndex);
            setMesActual(meses[newIndex]);
        } else {
            // Crear nuevo mes siguiente
            try {
                setNavigating(true);
                const fechaSiguiente = addMonths(new Date(mesActual.fechaFin), 1);
                await crearNuevoMes(fechaSiguiente);
            } catch (error) {
                setMensaje("Error al crear mes siguiente: " + (error.response?.data?.error || error.message));
            } finally {
                setNavigating(false);
            }
        }
    };

    // Función para iniciar la edición
    const iniciarEdicion = (field, value, ingresoId = null) => {
        setEditing({ field, value, ingresoId });

        // Si es una fecha, formateamos para el input type="date"
        if (field === 'fechaInicio' || field === 'fechaFin') {
            const date = new Date(value);
            const formattedDate = date.toISOString().split('T')[0];
            setEditing(prev => ({ ...prev, value: formattedDate }));
        }
    };

    // Función para cancelar la edición
    const cancelarEdicion = () => {
        setEditing({ field: null, value: '', ingresoId: null });
    };

    const guardarEdicion = async () => {
        try {
            // Validaciones para fechas
            if (editing.field === 'fechaInicio' || editing.field === 'fechaFin') {
                if (!editing.value) {
                    setMensaje('La fecha no puede estar vacía');
                    return;
                }

                // Validar que fechaInicio sea anterior a fechaFin
                const nuevaFecha = new Date(editing.value);
                const otraFecha = editing.field === 'fechaInicio'
                    ? new Date(mesActual.fechaFin)
                    : new Date(mesActual.fechaInicio);

                if (editing.field === 'fechaInicio' && nuevaFecha > otraFecha) {
                    setMensaje('La fecha de inicio no puede ser posterior a la fecha final');
                    return;
                }

                if (editing.field === 'fechaFin' && nuevaFecha < otraFecha) {
                    setMensaje('La fecha final no puede ser anterior a la fecha de inicio');
                    return;
                }

                var updateData = {};
                if (editing.field === 'fechaInicio') {
                    // Preparar datos para actualizar
                    updateData = {
                        fechaInicio: editing.value,
                        fechaFin: mesActual.fechaFin,
                        nombre: mesActual.nombre,
                        anio: mesActual.anio,
                        ingresos: mesActual.ingresos
                    };
                } else {
                    updateData = {
                        fechaInicio: mesActual.fechaInicio,
                        fechaFin: editing.value,
                        nombre: mesActual.nombre,
                        anio: mesActual.anio,
                        ingresos: mesActual.ingresos
                    };
                }


                const response = await axios.put(
                    `${API_URL}/api/mes/${mesActual._id}`,
                    updateData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                // Actualizar estado local
                setMesActual(response.data);
                setMeses(meses.map(m => m._id === mesActual._id ? response.data : m));
                setMensaje('Fecha actualizada correctamente');
                setEditing({ field: null, value: '' });
                return;
            } else if (editing.field === 'ingreso') {
                // Validación de campos
                const errors = {};
                if (!editing.values.concepto) errors.concepto = 'Concepto requerido';
                if (!editing.values.monto || isNaN(editing.values.monto)) errors.monto = 'Monto inválido';

                if (Object.keys(errors).length > 0) {
                    setMensaje(Object.values(errors).join(', '));
                    return;
                }

                // Preparar datos para enviar al backend
                const ingresoData = {
                    concepto: editing.values.concepto,
                    monto: editing.values.monto,
                    fecha: editing.values.fecha
                };

                const response = await axios.put(
                    `${API_URL}/api/mes/${mesActual._id}/ingresos/${editing.ingresoId}`,
                    ingresoData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                // Actualizar estado local
                setMesActual(response.data.mesActualizado);
                setMeses(meses.map(m => m._id === mesActual._id ? response.data.mesActualizado : m));
                setMensaje(response.data.message || "Ingreso actualizado correctamente");
                cancelarEdicion();
            }
        } catch (error) {
            console.error("Error al guardar:", error);

            // Manejo mejorado de errores del backend
            if (error.response?.data?.errors) {
                const errorMessages = Object.values(error.response.data.errors).join(', ');
                setMensaje(errorMessages);
            } else {
                setMensaje(error.response?.data?.error || "Error al actualizar el ingreso");
            }
        }
    };

    // Función mejorada para eliminar ingreso
    const confirmarEliminacion = (ingresoId) => {
        setIngresoAEliminar(ingresoId);
        setModalEliminarAbierto(true);
    };

    const eliminarIngreso = async () => {
        if (!ingresoAEliminar) return;

        try {
            const response = await axios.delete(
                `${API_URL}/api/mes/${mesActual._id}/ingresos/${ingresoAEliminar}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setMesActual(response.data);
            setMeses(meses.map(m => m._id === mesActual._id ? response.data : m));
            setMensaje("Ingreso eliminado correctamente");
        } catch (error) {
            console.error("Error al eliminar:", error);
            setMensaje("Error al eliminar: " + (error.response?.data?.message || "Error desconocido"));
        } finally {
            setModalEliminarAbierto(false);
            setIngresoAEliminar(null);
        }
    };

    // Función para iniciar la edición de un ingreso
    const iniciarEdicionIngreso = (ingreso) => {
        setEditing({
            field: 'ingreso',
            ingresoId: ingreso._id,
            values: {
                concepto: ingreso.concepto,
                monto: ingreso.monto.toString(),
                fecha: format(new Date(ingreso.fecha), 'yyyy-MM-dd')
            }
        });
    };

    if (loading) {
        return <p className="mes-loading">Cargando mes...</p>;
    }

    if (!token) {
        return (
            <div className="mes-alert mes-alert-warning">
                No hay sesión activa. Por favor, inicia sesión.
            </div>
        );
    }

    return (
        <div className="mes-container">
            <div className="mes-header">
                {/* <h2>Gestión de Meses</h2> */}
            </div>

            <CSSTransition in={!!mesActual} timeout={300} classNames="mes-change" unmountOnExit>
                <div className="mes-card" style={{
                    borderLeft: `4px solid ${mesActual ? getMonthColor(mesActual.nombre) : '#3498db'}`,
                    boxShadow: `0 4px 20px ${mesActual ? `${getMonthColor(mesActual.nombre)}20` : '#3498db20'}`
                }}>
                    {mesActual && (
                        <>
                            <div className="mes-navigation">
                                <button
                                    className="mes-btn mes-btn-secondary"
                                    onClick={irAlMesAnterior}
                                    disabled={navigating}
                                >
                                    {navigating ? 'Cargando...' : '← Anterior'}
                                </button>
                                <h3 className="mes-title">
                                    {mesActual.nombre} {mesActual.anio}
                                    {navigating && <span className="mes-loading-indicator">...</span>}
                                </h3>
                                <button
                                    className="mes-btn mes-btn-secondary"
                                    onClick={irAlMesSiguiente}
                                    disabled={navigating}
                                >
                                    {navigating ? 'Cargando...' : 'Siguiente →'}
                                </button>
                            </div>

                            {/* Sección de fechas editables */}
                            <div className="mes-details">
                                {/* Fecha Inicio */}
                                <div className={`mes-detail-item ${!editing.field?.startsWith('fecha') ? 'editable' : ''}`}
                                    onClick={() => !editing.field && iniciarEdicion('fechaInicio', mesActual.fechaInicio)}>
                                    {editing.field === 'fechaInicio' ? (
                                        <div className="mes-edit-form">
                                            <input
                                                type="date"
                                                className="mes-edit-input"
                                                value={editing.value}
                                                onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                                            />
                                            <div className="mes-edit-buttons">
                                                <button className="mes-edit-btn mes-edit-confirm" onClick={guardarEdicion}>✓</button>
                                                <button className="mes-edit-btn mes-edit-cancel" onClick={cancelarEdicion}>✗</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="mes-detail-label">Fecha Inicio</span>
                                            <span className="mes-detail-value">
                                                {format(new Date(mesActual.fechaInicio), 'dd/MM/yyyy')}
                                            </span>
                                            {!editing.field && <span className="mes-edit-icon">✏️</span>}
                                        </>
                                    )}
                                </div>

                                {/* Fecha Fin */}
                                <div className={`mes-detail-item ${!editing.field?.startsWith('fecha') ? 'editable' : ''}`}
                                    onClick={() => !editing.field && iniciarEdicion('fechaFin', mesActual.fechaFin)}>
                                    {editing.field === 'fechaFin' ? (
                                        <div className="mes-edit-form">
                                            <input
                                                type="date"
                                                className="mes-edit-input"
                                                value={editing.value}
                                                onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                                            />
                                            <div className="mes-edit-buttons">
                                                <button className="mes-edit-btn mes-edit-confirm" onClick={guardarEdicion}>✓</button>
                                                <button className="mes-edit-btn mes-edit-cancel" onClick={cancelarEdicion}>✗</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="mes-detail-label">Fecha Fin</span>
                                            <span className="mes-detail-value">
                                                {format(new Date(mesActual.fechaFin), 'dd/MM/yyyy')}
                                            </span>
                                            {!editing.field && <span className="mes-edit-icon">✏️</span>}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Lista de ingresos con edición */}
                            <div className="mes-ingresos-list">
                                {/* Encabezado clickeable */}
                                <div className="mes-total-ingresos" onClick={() => setIngresosExpandido(!ingresosExpandido)}
                                    style={{ cursor: 'pointer' }}
                                    tabIndex="0"
                                    role="button"
                                    aria-expanded={ingresosExpandido}
                                    onKeyDown={(e) => e.key === 'Enter' && setIngresosExpandido(!ingresosExpandido)}>

                                    {/* Contenedor del título y monto (centrados) */}
                                    <div className="mes-total-content">
                                        <div className="mes-total-label">Total de Ingresos</div>
                                        <div className="mes-total-value">
                                            ${mesActual.ingresos?.reduce((total, ingreso) => total + ingreso.monto, 0).toLocaleString() || '0'}
                                        </div>
                                    </div>

                                    {/* Icono en esquina derecha */}
                                    <span className="toggle-icon">
                                        {ingresosExpandido ? (
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                            </svg>
                                        ) : (
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                        )}
                                    </span>
                                </div>

                                {/* Contenido desplegable - ahora con transición */}
                                <div className={`mes-ingresos-dropdown ${ingresosExpandido ? 'expanded' : 'collapsed'}`}>
                                    {ingresosExpandido && (
                                        <div className="mes-ingresos-dropdown">
                                            {/* Formulario para nuevo ingreso */}
                                            <div className="mes-agregar-ingreso">
                                                <h4>Agregar Nuevo Ingreso</h4>
                                                <div className="mes-ingreso-form">
                                                    <input
                                                        type="text"
                                                        placeholder="Concepto"
                                                        value={nuevoIngreso.concepto}
                                                        onChange={(e) => setNuevoIngreso({ ...nuevoIngreso, concepto: e.target.value })}
                                                        className="mes-input"
                                                    />
                                                    <input
                                                        type="number"
                                                        placeholder="Monto"
                                                        value={nuevoIngreso.monto}
                                                        onChange={(e) => setNuevoIngreso({ ...nuevoIngreso, monto: e.target.value })}
                                                        className="mes-input"
                                                    />
                                                    <button
                                                        onClick={agregarIngreso}
                                                        className="mes-btn mes-btn-primary"
                                                    >
                                                        Agregar
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Lista de ingresos */}
                                            {mesActual.ingresos?.length > 0 ? (
                                                <div className="mes-ingresos-container">
                                                    <div className="mes-ingresos-header">
                                                        <span>Concepto</span>
                                                        <span>Monto</span>
                                                        <span>Fecha</span>
                                                        <span>Acciones</span>
                                                    </div>
                                                    <ul className="mes-ingreso-list">
                                                        {mesActual.ingresos.map((ingreso) => (
                                                            <li key={ingreso._id} className="mes-ingreso-item">
                                                                {editing.field === 'ingreso' && editing.ingresoId === ingreso._id ? (
                                                                    <div className="mes-edit-ingreso-form">
                                                                        <input
                                                                            type="text"
                                                                            value={editing.values.concepto}
                                                                            onChange={(e) => setEditing({
                                                                                ...editing,
                                                                                values: { ...editing.values, concepto: e.target.value }
                                                                            })}
                                                                            className="mes-input"
                                                                            placeholder="Concepto"
                                                                        />
                                                                        <input
                                                                            type="number"
                                                                            value={editing.values.monto}
                                                                            onChange={(e) => setEditing({
                                                                                ...editing,
                                                                                values: { ...editing.values, monto: e.target.value }
                                                                            })}
                                                                            className="mes-input"
                                                                            placeholder="Monto"
                                                                        />
                                                                        <input
                                                                            type="date"
                                                                            value={editing.values.fecha}
                                                                            onChange={(e) => setEditing({
                                                                                ...editing,
                                                                                values: { ...editing.values, fecha: e.target.value }
                                                                            })}
                                                                            className="mes-input"
                                                                        />
                                                                        <div className="mes-edit-ingreso-buttons">
                                                                            <button
                                                                                className="mes-btn mes-btn-primary"
                                                                                onClick={guardarEdicion}
                                                                            >
                                                                                Guardar
                                                                            </button>
                                                                            <button
                                                                                className="mes-btn mes-btn-secondary"
                                                                                onClick={cancelarEdicion}
                                                                            >
                                                                                Cancelar
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        <span className="mes-ingreso-concepto">{ingreso.concepto}</span>
                                                                        <span className="mes-ingreso-monto">
                                                                            ${ingreso.monto.toLocaleString()}
                                                                        </span>
                                                                        <span className="mes-ingreso-fecha">
                                                                            {format(new Date(ingreso.fecha), 'dd/MM/yyyy')}
                                                                        </span>
                                                                        <div className="mes-ingreso-actions">
                                                                            <button
                                                                                className="mes-ingreso-btn mes-ingreso-edit-btn"
                                                                                onClick={() => iniciarEdicionIngreso(ingreso)}
                                                                                title="Editar"
                                                                            >
                                                                                ✏️
                                                                            </button>
                                                                            <button
                                                                                className="mes-ingreso-btn mes-ingreso-delete-btn"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    confirmarEliminacion(ingreso._id);
                                                                                }}
                                                                                title="Eliminar"
                                                                            >
                                                                                🗑️
                                                                            </button>
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ) : (
                                                <p className="mes-no-ingresos">No hay ingresos registrados</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </CSSTransition>

            {mensaje && <div className="mes-alert mes-alert-warning">{mensaje}</div>}

            {!mesActual && !loading && (
                <p className="mes-loading">No hay meses disponibles</p>
            )}

            <AsignacionIngresosPortafolios
                mesActual={mesActual}
                onUpdate={(mesActualizado) => {
                    setMesActual(mesActualizado);
                    setMensaje("Asignaciones actualizadas correctamente");
                }}
            />

            {/* Modal de confirmación para eliminar ingreso */}
            {modalEliminarAbierto && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>¿Eliminar ingreso?</h3>
                        <p>Esta acción no se puede deshacer. ¿Estás seguro?</p>
                        <div className="modal-actions">
                            <button
                                className="modal-btn modal-btn-secondary"
                                onClick={() => {
                                    setModalEliminarAbierto(false);
                                    setIngresoAEliminar(null);
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                className="modal-btn modal-btn-danger"
                                onClick={eliminarIngreso}
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

export default MesComponent;