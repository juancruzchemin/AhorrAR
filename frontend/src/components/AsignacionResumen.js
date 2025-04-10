import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, isValid } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import "../styles/AsignacionResumen.css";

const AsignacionResumen = ({
    mesActual,
    onUpdateAsignaciones,
    onUpdateIngresos
}) => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    // Estados para ingresos (simplificados sin categoría)
    const [ingresosExpandido, setIngresosExpandido] = useState(false);
    const [nuevoIngreso, setNuevoIngreso] = useState({
        concepto: '',
        monto: ''
    });
    const [editingIngreso, setEditingIngreso] = useState({
        active: false,
        id: null,
        values: {
            concepto: '',
            monto: ''
        }
    });
    const [loadingIngresos, setLoadingIngresos] = useState(false);
    const [errorIngresos, setErrorIngresos] = useState(null);
    // Estados para asignaciones
    const [showCrearPortafolio, setShowCrearPortafolio] = useState(false);
    const [nuevoPortafolio, setNuevoPortafolio] = useState({
        nombre: '',
        tipo: 'personal',
        mes: '',
        inicio: '',
        fin: '',
        usuariosSeleccionados: []
    });
    // Estados para asignaciones (sin cambios)
    const [asignaciones, setAsignaciones] = useState([]);
    const [loadingPortafolios, setLoadingPortafolios] = useState(true);
    const [portafolios, setPortafolios] = useState(true);
    const [mensaje, setMensaje] = useState('');
    // Calcular valores derivados
    const totalIngresos = (mesActual && Array.isArray(mesActual.ingresos))
        ? mesActual.ingresos.reduce((total, ingreso) => total + (ingreso?.monto || 0), 0)
        : 0;
    const totalAsignado = asignaciones.reduce((sum, a) => sum + a.monto, 0);
    const disponible = (mesActual?.ingreso || 0) - totalAsignado;
    const [modalEliminar, setModalEliminar] = useState({
        mostrar: false,
        ingresoId: null,
        concepto: ''
    });

    // Efecto para cargar portafolios
    useEffect(() => {
        if (!mesActual) return;
        const fetchPortafolios = async () => {
            try {
                if (!token || !mesActual?.fechaInicio || !mesActual?.fechaFin) {
                    setMensaje('Datos incompletos para cargar portafolios');
                    setLoadingPortafolios(false);
                    return;
                }

                const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/portafolios`, {
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

                // Inicializar asignaciones
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
                setLoadingPortafolios(false);
            }
        };

        fetchPortafolios();
    }, [mesActual, token]);

    // Funciones para manejar ingresos (simplificadas)
    const agregarIngreso = async () => {
        if (!mesActual || !mesActual._id) {
            setErrorIngresos("No hay mes seleccionado");
            return;
        }

        if (!nuevoIngreso.concepto || !nuevoIngreso.monto) {
            setErrorIngresos("Concepto y monto son requeridos");
            return;
        }

        try {
            setLoadingIngresos(true);
            setErrorIngresos(null);

            // Opción 1: Usando PUT para actualizar todo el mes (como en tu ejemplo funcional)
            const nuevosIngresos = [
                ...(mesActual.ingresos || []),
                {
                    concepto: nuevoIngreso.concepto,
                    monto: parseFloat(nuevoIngreso.monto),
                    fecha: new Date()
                }
            ];

            const response = await axios.put(
                `${process.env.REACT_APP_BACKEND_URL}/api/mes/${mesActual._id}`,
                {
                    ...mesActual,
                    ingresos: nuevosIngresos
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            // Opción 2: Si prefieres usar POST, verifica la ruta exacta con tu backend
            /* const response = await axios.post(
                `${process.env.REACT_APP_BACKEND_URL}/api/ingresos`, // ← Ruta puede ser diferente
                {
                    mesId: mesActual._id,
                    concepto: nuevoIngreso.concepto,
                    monto: parseFloat(nuevoIngreso.monto)
                },
                { headers: { Authorization: `Bearer ${token}` } }
            ); */

            if (onUpdateIngresos) {
                onUpdateIngresos(response.data);
            }

            setNuevoIngreso({ concepto: '', monto: '' });
            setMensaje('Ingreso agregado correctamente');

        } catch (error) {
            console.error('Error completo:', error);
            const errorMsg = error.response?.data?.message ||
                'Error al comunicarse con el servidor';
            setErrorIngresos(errorMsg);
        } finally {
            setLoadingIngresos(false);
        }
    };

    const iniciarEdicionIngreso = (ingreso) => {
        setEditingIngreso({
            active: true,
            id: ingreso._id,
            values: {
                concepto: ingreso.concepto,
                monto: ingreso.monto.toString() // Asegurar que es string
            }
        });
    };

    const guardarEdicionIngreso = async () => {
        if (!mesActual || !mesActual._id || !editingIngreso.id) {
            setErrorIngresos("Datos incompletos para editar");
            return;
        }

        if (!editingIngreso.id || !mesActual?._id) {
            setErrorIngresos("Datos incompletos para editar");
            return;
        }

        const monto = parseFloat(editingIngreso.values.monto);
        if (isNaN(monto)) {
            setErrorIngresos("Monto debe ser un número válido");
            return;
        }

        try {
            setLoadingIngresos(true);
            setErrorIngresos(null);

            // 1. Actualización optimista (opcional, puedes eliminarla si prefieres)
            const ingresosActualizados = mesActual.ingresos.map(ingreso =>
                ingreso._id === editingIngreso.id ? {
                    ...ingreso,
                    concepto: editingIngreso.values.concepto,
                    monto: monto
                } : ingreso
            );

            const mesOptimista = {
                ...mesActual,
                ingresos: ingresosActualizados
            };

            if (onUpdateIngresos) {
                onUpdateIngresos(mesOptimista);
            }

            // 2. Enviar cambios al backend
            const response = await axios.put(
                `${process.env.REACT_APP_BACKEND_URL}/api/mes/${mesActual._id}/ingresos/${editingIngreso.id}`,
                {
                    concepto: editingIngreso.values.concepto,
                    monto: monto
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            console.log('Respuesta backend:', response.data);

            // 3. ACTUALIZACIÓN CORRECTA - Usar los datos del backend
            if (onUpdateIngresos) {
                // Usamos mesActualizado que viene en la respuesta
                onUpdateIngresos(response.data.mesActualizado);
            }

            setEditingIngreso({ active: false, id: null, values: { concepto: '', monto: '' } });
            setMensaje(response.data.message || 'Ingreso actualizado correctamente');

        } catch (error) {
            console.error('Error al editar:', error);
            setErrorIngresos(error.response?.data?.error || 'Error al guardar cambios');

            // Revertir a los datos originales si hay error
            if (onUpdateIngresos) {
                onUpdateIngresos(mesActual);
            }
        } finally {
            setLoadingIngresos(false);
        }
    };

    const eliminarIngreso = async (ingresoId) => {
        try {
            setLoadingIngresos(true);

            // 1. Actualización optimista (eliminar de la UI inmediatamente)
            const ingresosActualizados = mesActual.ingresos.filter(ingreso => ingreso._id !== ingresoId);
            const mesActualizado = {
                ...mesActual,
                ingresos: ingresosActualizados
            };

            if (onUpdateIngresos) {
                onUpdateIngresos(mesActualizado);
            }

            // 2. Enviar petición al backend
            await axios.delete(
                `${process.env.REACT_APP_BACKEND_URL}/api/mes/${mesActual._id}/ingresos/${ingresoId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setMensaje('Ingreso eliminado correctamente');

        } catch (error) {
            console.error('Error al eliminar ingreso:', error);
            setErrorIngresos(error.response?.data?.error || 'Error al eliminar ingreso');

            // Revertir cambios si hay error
            if (onUpdateIngresos) {
                onUpdateIngresos(mesActual);
            }
        } finally {
            setLoadingIngresos(false);
        }
    };


    if (loadingPortafolios) {
        return <div className="loading">Cargando datos...</div>;
    }

    return (
        <div className="asignacion-resumen-container">
            {/* Sección de ingresos */}
            <div className="mes-ingresos-list">
                <div className="mes-total-ingresos" onClick={() => setIngresosExpandido(!ingresosExpandido)}
                    style={{ cursor: 'pointer' }}
                    tabIndex="0"
                    role="button"
                    aria-expanded={ingresosExpandido}
                    onKeyDown={(e) => e.key === 'Enter' && setIngresosExpandido(!ingresosExpandido)}>
                    <div className="mes-total-content">
                        <div className="mes-total-label">Total de Ingresos</div>
                        <div className="mes-total-value">
                            ${totalIngresos.toLocaleString()}
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

                {ingresosExpandido && (
                    <div className="ingresos-content">
                        {/* Formulario simplificado sin categoría */}
                        <div className="nuevo-ingreso-form">
                            <input
                                type="text"
                                placeholder="Concepto"
                                value={nuevoIngreso.concepto}
                                onChange={(e) => setNuevoIngreso({ ...nuevoIngreso, concepto: e.target.value })}
                                className="input-concepto"
                            />
                            <input
                                type="number"
                                placeholder="Monto"
                                value={nuevoIngreso.monto}
                                onChange={(e) => setNuevoIngreso({ ...nuevoIngreso, monto: e.target.value })}
                                className="input-monto"
                            />
                            <button
                                onClick={agregarIngreso}
                                disabled={loadingIngresos || !nuevoIngreso.concepto || !nuevoIngreso.monto}
                                className="btn-add"
                            >
                                {loadingIngresos ? '...' : '+'}
                            </button>
                        </div>

                        {/* Lista de ingresos sin categoría */}
                        {mesActual.ingresos?.length > 0 ? (
                            <ul className="ingresos-list">
                                {mesActual?.ingresos?.filter(ingreso => ingreso?._id).map((ingreso) => (
                                    <li key={ingreso._id} className="ingreso-item">
                                        {editingIngreso.active && editingIngreso.id === ingreso._id ? (
                                            <div className="edicion-ingreso">
                                                <input
                                                    type="text"
                                                    value={editingIngreso.values.concepto}
                                                    onChange={(e) => setEditingIngreso({
                                                        ...editingIngreso,
                                                        values: { ...editingIngreso.values, concepto: e.target.value }
                                                    })}
                                                    className="input-concepto"
                                                />
                                                <input
                                                    type="text"
                                                    value={editingIngreso.values.monto}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        if (value === '' || !isNaN(value)) {
                                                            setEditingIngreso({
                                                                ...editingIngreso,
                                                                values: { ...editingIngreso.values, monto: value }
                                                            });
                                                        }
                                                    }}
                                                    className="input-monto"
                                                />
                                                <div className="acciones-edicion">
                                                    <button
                                                        onClick={guardarEdicionIngreso}
                                                        disabled={loadingIngresos}
                                                        className="btn-save"
                                                    >
                                                        {loadingIngresos ? '...' : '✓'}
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingIngreso({ active: false, id: null, values: { concepto: '', monto: '' } })}
                                                        className="btn-cancel"
                                                    >
                                                        ✗
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="ingreso-content">
                                                <span className="concepto">{ingreso.concepto}</span>
                                                <span className="monto">${(ingreso.monto || 0).toLocaleString()}</span>
                                                <div className="acciones">
                                                    <button
                                                        onClick={() => iniciarEdicionIngreso(ingreso)}
                                                        className="btn-edit"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        onClick={() => setModalEliminar({
                                                            mostrar: true,
                                                            ingresoId: ingreso._id,
                                                            concepto: ingreso.concepto
                                                        })}
                                                        className="btn-delete"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="no-ingresos">No hay ingresos registrados este mes</p>
                        )}
                    </div>
                )}
            </div>

            {/* Resumen de ingresos y asignaciones */}
            <div className="asignacion-resumen">
                <div className={`portfolio-stat-item portfolio-stat-expense`}>
                    <div className="portfolio-stat-label">Total Asignado:</div>
                    <div className="portfolio-stat-value">${totalAsignado.toLocaleString()}</div>
                </div>

                {/* <div className={`portfolio-stat-item portfolio-stat-income`}>

                    <div className="portfolio-stat-label">Ingreso Total del Mes:</div>
                    <div className="portfolio-stat-value">${mesActual.ingreso.toLocaleString()}</div>
                </div> */}

                <div className={`portfolio-stat-item portfolio-stat-remaining`}>
                    <div className="portfolio-stat-label">Disponible:</div>
                    <strong className="portfolio-stat-value">
                        ${disponible.toLocaleString()}
                    </strong>
                </div>
            </div>

            {/* Mensajes de estado */}
            {mensaje && (
                <div className={`message ${mensaje.includes('exitosamente') ? 'success' : 'error'}`}>
                    {mensaje}
                    <button className="close-message" onClick={() => setMensaje('')}>×</button>
                </div>
            )}

            {/* Modal para crear nuevo portafolio */}
            {showCrearPortafolio && (
                <div className="modal-overlay" onClick={() => setShowCrearPortafolio(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Crear Nuevo Portafolio</h3>

                        <div className="form-group">
                            <label>Nombre</label>
                            <input
                                type="text"
                                value={nuevoPortafolio.nombre}
                                onChange={(e) => setNuevoPortafolio({ ...nuevoPortafolio, nombre: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label>Tipo</label>
                            <select
                                value={nuevoPortafolio.tipo}
                                onChange={(e) => setNuevoPortafolio({ ...nuevoPortafolio, tipo: e.target.value })}
                            >
                                <option value="personal">Personal</option>
                                <option value="principal">Principal</option>
                                <option value="compartido">Compartido</option>
                                <option value="inversiones">Inversiones</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Mes</label>
                            <input
                                type="text"
                                value={`${format(new Date(mesActual.fechaInicio), 'MMMM yyyy')}`}
                                readOnly
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Fecha Inicio</label>
                                <input
                                    type="date"
                                    value={format(new Date(mesActual.fechaInicio), 'yyyy-MM-dd')}
                                    readOnly
                                />
                            </div>

                            <div className="form-group">
                                <label>Fecha Fin</label>
                                <input
                                    type="date"
                                    value={format(new Date(mesActual.fechaFin), 'yyyy-MM-dd')}
                                    readOnly
                                />
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button
                                onClick={() => setShowCrearPortafolio(false)}
                                className="btn-cancel"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    // Implementar lógica para crear portafolio
                                    setShowCrearPortafolio(false);
                                    setMensaje('Funcionalidad de creación de portafolio en desarrollo');
                                }}
                                disabled={!nuevoPortafolio.nombre}
                                className="btn-confirm"
                            >
                                Crear
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {modalEliminar.mostrar && (
                <div className="modal-overlay" onClick={() => setModalEliminar({ mostrar: false, ingresoId: null })}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Confirmar Eliminación</h3>
                        <p>¿Estás seguro de eliminar el ingreso "{modalEliminar.concepto}"?</p>

                        <div className="modal-actions">
                            <button
                                className="btn-cancel"
                                onClick={() => setModalEliminar({ mostrar: false, ingresoId: null })}
                            >
                                Cancelar
                            </button>
                            <button
                                className="btn-confirm"
                                onClick={() => {
                                    eliminarIngreso(modalEliminar.ingresoId);
                                    setModalEliminar({ mostrar: false, ingresoId: null });
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

export default AsignacionResumen;