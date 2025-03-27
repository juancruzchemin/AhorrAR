import React, { useState, useEffect } from "react";
import axios from "axios";
import { format } from 'date-fns';
import { CSSTransition } from 'react-transition-group';
import "../styles/MesComponent.css";

const MesComponent = ({ usuarioId }) => {
    const [meses, setMeses] = useState([]);
    const [mesActual, setMesActual] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [mensaje, setMensaje] = useState("");
    const [loading, setLoading] = useState(true);

    const API_URL = process.env.REACT_APP_BACKEND_URL;
    const token = localStorage.getItem("token");

    const [nuevoIngreso, setNuevoIngreso] = useState({
        concepto: '',
        monto: '',
        categoria: 'otros'
    });

    const [editing, setEditing] = useState({
        field: null,       // 'fechaInicio', 'fechaFin' o 'ingreso-id'
        value: '',         // Valor temporal al editar
        ingresoId: null    // ID del ingreso que se está editando
    });

    const [tempDate, setTempDate] = useState({
        fechaInicio: '',
        fechaFin: ''
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

    // Declaración movida antes del useEffect
    const fetchMeses = async () => {
        if (!token) {
            setMensaje("No hay sesión activa. Por favor, inicia sesión.");
            setLoading(false);
            return;
        }

        try {
            const response = await axios.get(`${API_URL}/api/mes`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data.length === 0) {
                const resCrear = await axios.post(`${API_URL}/api/mes/auto`, null, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                setMeses([resCrear.data.mes]);
                setMesActual(resCrear.data.mes);
            } else {
                setMeses(response.data);
                setMesActual(response.data[0]);
            }
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

    const actualizarIngreso = async () => {
        if (!nuevoIngreso || isNaN(nuevoIngreso)) {
            setMensaje("Ingresa un valor numérico válido");
            return;
        }

        try {
            const response = await axios.put(
                `${API_URL}/api/mes/${mesActual._id}/ingreso`,
                { ingreso: parseFloat(nuevoIngreso) },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Actualiza el estado local
            setMesActual({ ...mesActual, ingreso: response.data.ingreso });
            setMeses(meses.map(mes =>
                mes._id === mesActual._id ? { ...mes, ingreso: response.data.ingreso } : mes
            ));
            setNuevoIngreso(""); // Limpia el input
            setMensaje("Ingreso actualizado correctamente");
        } catch (error) {
            setMensaje("Error al actualizar: " + (error.response?.data.error || "Error desconocido"));
        }
    };

    // Maneja la tecla "Enter"
    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            actualizarIngreso();
        }
    };

    const crearMes = async () => {
        try {
            const response = await axios.post(`${API_URL}/api/mes`, null, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setMesActual(response.data.mes);
            setMeses([response.data.mes]);
            setCurrentIndex(0);
        } catch (error) {
            console.error("Error al crear el mes:", error);
            setMensaje("Error al crear el mes: " + (error.response?.data.error || "Error desconocido"));
        }
    };

    const irAlMesAnterior = () => {
        if (currentIndex > 0) {
            const newIndex = currentIndex - 1;
            setCurrentIndex(newIndex);
            setMesActual(meses[newIndex]);
        }
    };

    const irAlMesSiguiente = () => {
        if (currentIndex < meses.length - 1) {
            const newIndex = currentIndex + 1;
            setCurrentIndex(newIndex);
            setMesActual(meses[newIndex]);
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

    // Función para guardar los cambios
    const guardarEdicion = async () => {
        try {
            if (editing.field === 'fechaInicio' || editing.field === 'fechaFin') {
                // Actualizar fechas del mes
                const response = await axios.put(
                    `${API_URL}/api/mes/${mesActual._id}`,
                    { [editing.field]: new Date(editing.value) },
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                setMesActual(response.data);
                setMeses(meses.map(m => m._id === mesActual._id ? response.data : m));

            } else if (editing.field === 'ingreso') {
                // Actualizar un ingreso específico
                const ingresoActualizado = {
                    ...mesActual.ingresos.find(i => i._id === editing.ingresoId),
                    monto: parseFloat(editing.value)
                };

                const response = await axios.put(
                    `${API_URL}/api/mes/${mesActual._id}/ingresos/${editing.ingresoId}`,
                    ingresoActualizado,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                setMesActual(response.data);
                setMeses(meses.map(m => m._id === mesActual._id ? response.data : m));
            }

            setMensaje("Cambios guardados correctamente");
            cancelarEdicion();

        } catch (error) {
            setMensaje("Error al guardar los cambios: " + (error.response?.data.error || "Error desconocido"));
        }
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
                            <h3 className="mes-title">{mesActual.nombre} {mesActual.anio}</h3>

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
                                {/* ... formulario de agregar ingreso ... */}

                                {mesActual.ingresos?.length > 0 ? (
                                    <ul>
                                        {mesActual.ingresos.map((ingreso) => (
                                            <li key={ingreso._id} className="mes-ingreso-item">
                                                {editing.field === 'ingreso' && editing.ingresoId === ingreso._id ? (
                                                    <div className="mes-edit-form">
                                                        <input
                                                            type="number"
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
                                                        <span className="mes-ingreso-concepto">{ingreso.concepto}</span>
                                                        <span className="mes-ingreso-monto"
                                                            onClick={() => iniciarEdicion('ingreso', ingreso.monto, ingreso._id)}>
                                                            ${ingreso.monto.toLocaleString()}
                                                            <span className="mes-edit-icon">✏️</span>
                                                        </span>
                                                        <span className="mes-ingreso-fecha">
                                                            {format(new Date(ingreso.fecha), 'dd/MM/yyyy')}
                                                        </span>
                                                    </>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p>No hay ingresos registrados</p>
                                )}
                            </div>

                            {/* ... resto del componente ... */}
                        </>
                    )}
                </div>
            </CSSTransition>

            {mensaje && <div className="mes-alert mes-alert-warning">{mensaje}</div>}

            {!mesActual && !loading && (
                <p className="mes-loading">No hay meses disponibles</p>
            )}
        </div>
    );
};

export default MesComponent;