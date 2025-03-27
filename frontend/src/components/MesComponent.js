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

            {mensaje && <div className="mes-alert mes-alert-warning">{mensaje}</div>}

            <CSSTransition
                in={!!mesActual}
                timeout={300}
                classNames="mes-change"
                unmountOnExit
            >
                <div className="mes-card" style={{
                    borderLeft: `4px solid ${mesActual ? getMonthColor(mesActual.nombre) : '#3498db'}`,
                    boxShadow: `0 4px 20px ${mesActual ? `${getMonthColor(mesActual.nombre)}20` : '#3498db20'}`
                }}>
                    {mesActual && (
                        <>
                            <h3 className="mes-title">{mesActual.nombre} {mesActual.anio}</h3>

                            <div className="mes-details">
                                <div className="mes-detail-item">
                                    <span className="mes-detail-label">Fecha Inicio</span>
                                    <span className="mes-detail-value">
                                        {format(new Date(mesActual.fechaInicio), 'dd/MM/yyyy')}
                                    </span>
                                </div>

                                <div className="mes-detail-item">
                                    <span className="mes-detail-label">Fecha Fin</span>
                                    <span className="mes-detail-value">
                                        {format(new Date(mesActual.fechaFin), 'dd/MM/yyyy')}
                                    </span>
                                </div>
                            </div>

                            <div className="mes-actualizar-ingreso">
                                <input
                                    type="number"
                                    placeholder="Nuevo ingreso"
                                    value={nuevoIngreso}
                                    onChange={(e) => setNuevoIngreso(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    className="mes-input-ingreso"
                                />
                                <button
                                    onClick={actualizarIngreso}
                                    className="mes-btn mes-btn-ingreso"
                                >
                                    Actualizar
                                </button>
                            </div>

                            <div className="mes-ingresos-list">
                                <h4>Detalle de Ingresos</h4>
                                {mesActual.ingresos?.length > 0 ? (
                                    <ul>
                                        {mesActual.ingresos.map((ingreso, index) => (
                                            <li key={index} className="mes-ingreso-item">
                                                <span className="mes-ingreso-concepto">{ingreso.concepto}</span>
                                                <span className="mes-ingreso-monto">${ingreso.monto.toLocaleString()}</span>
                                                <span className="mes-ingreso-fecha">{format(new Date(ingreso.fecha), 'dd/MM/yyyy')}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p>No hay ingresos registrados</p>
                                )}

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
                            </div>

                            <div className="mes-navigation">
                                <button
                                    className="mes-btn mes-btn-secondary"
                                    onClick={irAlMesAnterior}
                                    disabled={currentIndex === 0}
                                >
                                    <span>←</span> Anterior
                                </button>
                                <button
                                    className="mes-btn mes-btn-secondary"
                                    onClick={irAlMesSiguiente}
                                    disabled={currentIndex === meses.length - 1}
                                >
                                    Siguiente <span>→</span>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </CSSTransition>

            {!mesActual && !loading && (
                <p className="mes-loading">No hay meses disponibles</p>
            )}
        </div>
    );
};

export default MesComponent;