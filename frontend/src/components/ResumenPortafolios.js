import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth, eachWeekOfInterval, addWeeks } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import useUser from '../hooks/useUser';
import '../styles/ResumenPortafolios.css';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const ListaTodosMovimientos = () => {
    const { user } = useUser();
    const [movimientos, setMovimientos] = useState([]);
    const [movimientosGrafico, setMovimientosGrafico] = useState([]);
    const [loadingGrafico, setLoadingGrafico] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1
    });
    const [orden, setOrden] = useState({ campo: '', ascendente: true });
    const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false);
    const [movimientoAEliminar, setMovimientoAEliminar] = useState(null);
    const [vistaGrafico, setVistaGrafico] = useState('anual'); // 'semanal', 'mensual', 'anual'
    const [expandedRows, setExpandedRows] = useState({});
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [showMobileFilterModal, setShowMobileFilterModal] = useState(false);

    const navigate = useNavigate();
    // Estado para los filtros temporales (antes de aplicar)
    const [filtrosTemporales, setFiltrosTemporales] = useState({
        categorias: [],
        portafolios: [],
        tipos: [],
        montoMin: null,
        montoMax: null,
        fechaDesde: null,
        fechaHasta: null
    });

    // Estado para los filtros aplicados
    const [filtrosAplicados, setFiltrosAplicados] = useState({
        categorias: [],
        portafolios: [],
        tipos: [],
        montoMin: null,
        montoMax: null,
        fechaDesde: null,
        fechaHasta: null
    });

    const [opcionesFiltro, setOpcionesFiltro] = useState({
        categorias: [],
        portafolios: [],
        tipos: ['gasto', 'ingreso']
    });

    const [dropdownVisible, setDropdownVisible] = useState({
        categoria: false,
        monto: false,
        fecha: false,
        portafolio: false,
        tipo: false
    });

    // Determinar filtros activos
    const filtrosActivos = Object.entries(filtrosAplicados).filter(
        ([key, value]) =>
            (Array.isArray(value) && value.length > 0) ||
            (!Array.isArray(value) && value !== null)
    );

    const aplicarFiltros = () => {
        setFiltrosAplicados(filtrosTemporales);
        fetchMovimientos(1);
        fetchMovimientosGrafico(filtrosTemporales);
        closeAllDropdowns();
    };

    useEffect(() => {
        if (user) {
            fetchMovimientos(1);
            fetchMovimientosGrafico(filtrosAplicados);
            fetchCategorias();
            fetchPortafolios();
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchMovimientos(pagination.page);
        }
    }, [filtrosAplicados, pagination.page]);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 769) {
                setExpandedRows({});
            }
        };

        // Verificar el tamaño inicial
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchMovimientos = async (page = 1) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No hay token de autenticación');
            }

            const formatDate = (date) => {
                return date ? new Date(date).toISOString() : null;
            };

            const params = {
                page,
                limit: pagination.limit,
                ...(filtrosAplicados.categorias.length > 0 && { categorias: filtrosAplicados.categorias.join(',') }),
                ...(filtrosAplicados.portafolios.length > 0 && { portafolios: filtrosAplicados.portafolios.join(',') }),
                ...(filtrosAplicados.tipos.length > 0 && { tipos: filtrosAplicados.tipos.join(',') }),
                ...(filtrosAplicados.montoMin && { montoMin: filtrosAplicados.montoMin }),
                ...(filtrosAplicados.montoMax && { montoMax: filtrosAplicados.montoMax }),
                ...(filtrosAplicados.fechaDesde && { fechaDesde: formatDate(filtrosAplicados.fechaDesde) }),
                ...(filtrosAplicados.fechaHasta && { fechaHasta: formatDate(filtrosAplicados.fechaHasta) })
            };

            const response = await axios.get(
                `${process.env.REACT_APP_BACKEND_URL}/api/movimientos`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    params
                }
            );

            setMovimientos(response.data.movimientos);
            setPagination({
                page: response.data.page,
                limit: response.data.limit,
                total: response.data.total,
                totalPages: response.data.totalPages
            });
        } catch (err) {
            console.error('Error detallado:', err.response?.data || err.message);
            setError('Error al cargar movimientos: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const fetchMovimientosGrafico = async (filtros = {}) => {
        try {
            setLoadingGrafico(true);
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No hay token de autenticación');
            }

            const params = {
                ...(filtros.categorias && filtros.categorias.length > 0 && { categorias: filtros.categorias.join(',') }),
                ...(filtros.portafolios && filtros.portafolios.length > 0 && { portafolios: filtros.portafolios.join(',') }),
                ...(filtros.tipos && filtros.tipos.length > 0 && { tipos: filtros.tipos.join(',') }),
                ...(filtros.montoMin && { montoMin: filtros.montoMin }),
                ...(filtros.montoMax && { montoMax: filtros.montoMax }),
                ...(filtros.fechaDesde && { fechaDesde: filtros.fechaDesde }),
                ...(filtros.fechaHasta && { fechaHasta: filtros.fechaHasta })
            };

            const response = await axios.get(
                `${process.env.REACT_APP_BACKEND_URL}/api/movimientos/all`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    params
                }
            );

            setMovimientosGrafico(response.data);
        } catch (err) {
            console.error('Error al cargar movimientos para gráfico:', err);
        } finally {
            setLoadingGrafico(false);
        }
    };

    const fetchCategorias = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No hay token de autenticación');
            }

            const response = await axios.get(
                `${process.env.REACT_APP_BACKEND_URL}/api/categorias`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (!Array.isArray(response.data)) {
                throw new Error('Formato de respuesta inválido');
            }

            setOpcionesFiltro(prev => ({
                ...prev,
                categorias: response.data.filter(Boolean)
            }));
        } catch (err) {
            console.error('Error al cargar categorías:', err);
            setError('Error al cargar categorías. Intente recargar la página.');
        }
    };

    const fetchPortafolios = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/portafolios`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setOpcionesFiltro(prev => ({
                ...prev,
                portafolios: response.data.map(p => ({
                    sysId: p._id || p.sysId,
                    nombre: p.nombre
                }))
            }));
        } catch (err) {
            console.error('Error al cargar portafolios:', err);
            setError('Error al cargar portafolios. Intente recargar la página.');
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setPagination(prev => ({ ...prev, page: newPage }));
        }
    };

    const formatearFecha = (fecha) => {
        return format(new Date(fecha), 'dd/MM/yyyy');
    };

    const formatearMonto = (monto, tipo) => {
        return `${tipo === 'gasto' ? '-' : '+'}$${Math.abs(monto).toFixed(2)}`;
    };

    const ordenarMovimientos = (campo) => {
        const esAscendente = orden.campo === campo ? !orden.ascendente : true;
        const movimientosOrdenados = [...movimientos].sort((a, b) => {
            if (a[campo] < b[campo]) return esAscendente ? -1 : 1;
            if (a[campo] > b[campo]) return esAscendente ? 1 : -1;
            return 0;
        });

        setMovimientos(movimientosOrdenados);
        setOrden({ campo, ascendente: esAscendente });
    };

    const eliminarMovimiento = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No hay token de autenticación');
            }

            await axios.delete(
                `${process.env.REACT_APP_BACKEND_URL}/api/movimientos/${movimientoAEliminar}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setMostrarModalEliminar(false);
            fetchMovimientos(pagination.page);
            fetchMovimientosGrafico(filtrosAplicados);
        } catch (err) {
            console.error('Error al eliminar movimiento:', err.response?.data || err.message);
            setError('Error al eliminar movimiento: ' + (err.response?.data?.error || err.message));
        }
    };

    const procesarDatosGrafico = () => {
        const hoy = new Date();
        let labels = [];
        let dataGastos = [];
        let dataIngresos = [];

        if (vistaGrafico === 'anual') {
            // Vista anual: todos los meses del año
            labels = Array.from({ length: 12 }, (_, i) => format(new Date(hoy.getFullYear(), i, 1), 'MMM'));
            dataGastos = Array(12).fill(0);
            dataIngresos = Array(12).fill(0);

            if (!loadingGrafico && movimientosGrafico && movimientosGrafico.length > 0) {
                movimientosGrafico.forEach((movimiento) => {
                    try {
                        const fecha = new Date(movimiento.fecha);
                        if (fecha.getFullYear() === hoy.getFullYear()) {
                            const mes = fecha.getMonth();
                            if (movimiento.tipo === 'gasto') {
                                dataGastos[mes] += Math.abs(movimiento.monto);
                            } else if (movimiento.tipo === 'ingreso') {
                                dataIngresos[mes] += Math.abs(movimiento.monto);
                            }
                        }
                    } catch (error) {
                        console.error('Error procesando movimiento:', movimiento, error);
                    }
                });
            }
        } else if (vistaGrafico === 'mensual') {
            // Vista mensual: semanas del mes actual
            const inicioMes = startOfMonth(hoy);
            const finMes = endOfMonth(hoy);
            const semanas = eachWeekOfInterval(
                { start: inicioMes, end: finMes },
                { weekStartsOn: 1 }
            );

            labels = semanas.map((semana, index) => {
                const semanaFin = addWeeks(semana, 1);
                return `Semana ${index + 1} (${format(semana, 'dd/MM')} - ${format(semanaFin, 'dd/MM')})`;
            });

            dataGastos = Array(semanas.length).fill(0);
            dataIngresos = Array(semanas.length).fill(0);

            if (!loadingGrafico && movimientosGrafico && movimientosGrafico.length > 0) {
                movimientosGrafico.forEach((movimiento) => {
                    try {
                        const fecha = new Date(movimiento.fecha);
                        if (fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear()) {
                            const semanaIndex = semanas.findIndex(semana =>
                                fecha >= semana && fecha < addWeeks(semana, 1)
                            );
                            if (semanaIndex !== -1) {
                                if (movimiento.tipo === 'gasto') {
                                    dataGastos[semanaIndex] += Math.abs(movimiento.monto);
                                } else if (movimiento.tipo === 'ingreso') {
                                    dataIngresos[semanaIndex] += Math.abs(movimiento.monto);
                                }
                            }
                        }
                    } catch (error) {
                        console.error('Error procesando movimiento:', movimiento, error);
                    }
                });
            }
        } else if (vistaGrafico === 'semanal') {
            // Vista semanal: días de la semana actual
            const inicioSemana = startOfWeek(hoy, { weekStartsOn: 1 });
            const finSemana = endOfWeek(hoy, { weekStartsOn: 1 });
            const dias = eachDayOfInterval({ start: inicioSemana, end: finSemana });

            labels = dias.map(dia => format(dia, 'EEEE dd/MM'));
            dataGastos = Array(dias.length).fill(0);
            dataIngresos = Array(dias.length).fill(0);

            if (!loadingGrafico && movimientosGrafico && movimientosGrafico.length > 0) {
                movimientosGrafico.forEach((movimiento) => {
                    try {
                        const fecha = new Date(movimiento.fecha);
                        if (fecha >= inicioSemana && fecha <= finSemana) {
                            const diaIndex = dias.findIndex(dia =>
                                fecha.getDate() === dia.getDate() &&
                                fecha.getMonth() === dia.getMonth()
                            );
                            if (diaIndex !== -1) {
                                if (movimiento.tipo === 'gasto') {
                                    dataGastos[diaIndex] += Math.abs(movimiento.monto);
                                } else if (movimiento.tipo === 'ingreso') {
                                    dataIngresos[diaIndex] += Math.abs(movimiento.monto);
                                }
                            }
                        }
                    } catch (error) {
                        console.error('Error procesando movimiento:', movimiento, error);
                    }
                });
            }
        }
        return {
            labels,
            datasets: [
                {
                    label: 'Gastos',
                    data: dataGastos,
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.2)',
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'Ingresos',
                    data: dataIngresos,
                    borderColor: '#2ecc71',
                    backgroundColor: 'rgba(46, 204, 113, 0.2)',
                    tension: 0.3,
                    fill: true
                }
            ]
        };
    };

    const opcionesGrafico = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        return `${context.dataset.label}: $${context.raw.toFixed(2)}`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function (value) {
                        return `$${value}`;
                    }
                }
            }
        }
    };

    const actualizarFiltro = (campo, valor) => {
        setFiltrosTemporales(prev => ({
            ...prev,
            [campo]: valor instanceof Date ? valor.toISOString() : valor
        }));
    };

    const toggleFiltroOpcion = (campo, valor) => {
        setFiltrosTemporales(prev => {
            const valoresActuales = prev[campo];
            const valorPrimitivo = typeof valor === 'object' ? valor.sysId : valor;

            const nuevosValores = valoresActuales.includes(valorPrimitivo)
                ? valoresActuales.filter(v => v !== valorPrimitivo)
                : [...valoresActuales, valorPrimitivo];

            return { ...prev, [campo]: nuevosValores };
        });
    };

    const limpiarFiltros = () => {
        setFiltrosTemporales({
            categorias: [],
            portafolios: [],
            tipos: [],
            montoMin: null,
            montoMax: null,
            fechaDesde: null,
            fechaHasta: null
        });
        setFiltrosAplicados({
            categorias: [],
            portafolios: [],
            tipos: [],
            montoMin: null,
            montoMax: null,
            fechaDesde: null,
            fechaHasta: null
        });
        fetchMovimientos(1);
        fetchMovimientosGrafico({}); // Gráfico sin filtros
    };

    const toggleDropdown = (campo, e) => {
        if (e.target.classList.contains('filter-icon')) {
            setDropdownVisible(prev => ({
                ...Object.keys(prev).reduce((acc, key) => {
                    acc[key] = key === campo ? !prev[key] : false;
                    return acc;
                }, {})
            }));
        }
    };

    const closeAllDropdowns = () => {
        setDropdownVisible({
            categoria: false,
            monto: false,
            fecha: false,
            portafolio: false,
            tipo: false
        });
    };

    const handleAplicarFiltros = () => {
        aplicarFiltros();
    };

    const FilterDropdown = ({ children, campo }) => (
        dropdownVisible[campo] && (
            <div className="filter-dropdown" onClick={(e) => e.stopPropagation()}>
                <div className="filter-options">
                    {children}
                </div>
                <div className="filter-actions">
                    <button
                        className="filter-apply-button"
                        onClick={handleAplicarFiltros}
                    >
                        Aplicar
                    </button>
                </div>
            </div>
        )
    );

    const FilterCheckboxOptions = ({ opciones, campoFiltro }) => {
        if (!Array.isArray(opciones)) {
            return <div className="filter-error">Cargando opciones...</div>;
        }

        return (
            <>
                {opciones.map(opcion => {
                    const value = typeof opcion === 'object' ? opcion.sysId : opcion;
                    const displayText = typeof opcion === 'object' ? opcion.nombre : opcion;

                    return (
                        <label key={value} className="filter-option">
                            <input
                                type="checkbox"
                                checked={filtrosTemporales[campoFiltro].includes(value)}
                                onChange={() => toggleFiltroOpcion(campoFiltro, opcion)}
                                className="filter-checkbox"
                            />
                            <span className="filter-option-text">{displayText}</span>
                        </label>
                    );
                })}
            </>
        );
    };

    const FilterRangeInputs = ({ minValue, maxValue, minPlaceholder, maxPlaceholder, campo }) => (
        <>
            <div className="filter-range">
                <label className="filter-range-label">Mínimo:</label>
                <input
                    type="number"
                    value={minValue || ''}
                    onChange={(e) => actualizarFiltro(`${campo}Min`, e.target.value)}
                    placeholder={minPlaceholder}
                    className="filter-range-input"
                />
            </div>
            <div className="filter-range">
                <label className="filter-range-label">Máximo:</label>
                <input
                    type="number"
                    value={maxValue || ''}
                    onChange={(e) => actualizarFiltro(`${campo}Max`, e.target.value)}
                    placeholder={maxPlaceholder}
                    className="filter-range-input"
                />
            </div>
        </>
    );

    const FilterDateRange = () => (
        <div className="filter-date-range">
            <div className="filter-range">
                <label className="filter-range-label">Desde:</label>
                <DatePicker
                    selected={filtrosTemporales.fechaDesde ? new Date(filtrosTemporales.fechaDesde) : null}
                    onChange={(date) => actualizarFiltro('fechaDesde', date)}
                    selectsStart
                    startDate={filtrosTemporales.fechaDesde ? new Date(filtrosTemporales.fechaDesde) : null}
                    endDate={filtrosTemporales.fechaHasta ? new Date(filtrosTemporales.fechaHasta) : null}
                    dateFormat="dd/MM/yyyy HH:mm"
                    showTimeSelect
                    timeFormat="HH:mm"
                    className="filter-date-input"
                    placeholderText="Seleccione fecha"
                    isClearable
                />
            </div>
            <div className="filter-range">
                <label className="filter-range-label">Hasta:</label>
                <DatePicker
                    selected={filtrosTemporales.fechaHasta ? new Date(filtrosTemporales.fechaHasta) : null}
                    onChange={(date) => actualizarFiltro('fechaHasta', date)}
                    selectsEnd
                    startDate={filtrosTemporales.fechaDesde ? new Date(filtrosTemporales.fechaDesde) : null}
                    endDate={filtrosTemporales.fechaHasta ? new Date(filtrosTemporales.fechaHasta) : null}
                    minDate={filtrosTemporales.fechaDesde ? new Date(filtrosTemporales.fechaDesde) : null}
                    dateFormat="dd/MM/yyyy HH:mm"
                    showTimeSelect
                    timeFormat="HH:mm"
                    className="filter-date-input"
                    placeholderText="Seleccione fecha"
                    isClearable
                />
            </div>
        </div>
    );

    const formatFilterValue = (key, value) => {
        if (key === 'portafolios' && Array.isArray(value)) {
            const nombres = value.map(sysId => {
                const portafolio = opcionesFiltro.portafolios.find(p => p.sysId === sysId);
                return portafolio ? portafolio.nombre : sysId;
            });
            return nombres.join(', ');
        }

        if (Array.isArray(value)) {
            return value.join(', ');
        }

        if (value instanceof Date) {
            return format(value, 'dd/MM/yyyy HH:mm');
        }

        if (key === 'fechaDesde' || key === 'fechaHasta') {
            return value ? format(new Date(value), 'dd/MM/yyyy HH:mm') : '';
        }

        return String(value);
    };

    const toggleRowExpand = (id) => {
        if (window.innerWidth < 769) {
            setExpandedRows(prev => ({
                ...prev,
                [id]: !prev[id]
            }));
        }
    };

    if (!user) {
        return <div className="error-message">Por favor inicia sesión para ver tus movimientos</div>;
    }

    if (loading && movimientos.length === 0) {
        return <div className="loading">Cargando movimientos...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div className="lista-movimientos-container">
            <div className="grafico-container">
                <div className="grafico-header">
                    <h3>Resumen {vistaGrafico === 'anual' ? 'Anual' : vistaGrafico === 'mensual' ? 'Mensual' : 'Semanal'}</h3>
                    <div className="grafico-filtros">
                        <button
                            className={`grafico-filtro-btn ${vistaGrafico === 'semanal' ? 'active' : ''}`}
                            onClick={() => setVistaGrafico('semanal')}
                        >
                            Semanal
                        </button>
                        <button
                            className={`grafico-filtro-btn ${vistaGrafico === 'mensual' ? 'active' : ''}`}
                            onClick={() => setVistaGrafico('mensual')}
                        >
                            Mensual
                        </button>
                        <button
                            className={`grafico-filtro-btn ${vistaGrafico === 'anual' ? 'active' : ''}`}
                            onClick={() => setVistaGrafico('anual')}
                        >
                            Anual
                        </button>
                    </div>
                </div>
                {loadingGrafico ? (
                    <div className="cargando-grafico">Cargando datos del gráfico...</div>
                ) : (
                    <Line data={procesarDatosGrafico()} options={opcionesGrafico} />
                )}
            </div>

            <div className="controles-superiores">
                <h2>Todos mis movimientos</h2>

                <button
                    className="mobile-filters-button"
                    onClick={() => setShowMobileFilterModal(true)}
                >
                    Filtros
                </button>

                {filtrosActivos.length > 0 && (
                    <div className="filtros-activos-container">
                        <span className="filtros-activos-label">Filtros aplicados:</span>
                        {filtrosActivos.map(([key, value]) => (
                            <span key={key} className="filtro-activo">
                                {key}: {formatFilterValue(key, value)}
                                <button
                                    onClick={() => {
                                        setFiltrosTemporales(prev => ({ ...prev, [key]: Array.isArray(value) ? [] : null }));
                                        setFiltrosAplicados(prev => ({ ...prev, [key]: Array.isArray(value) ? [] : null }));
                                    }}
                                    className="quitar-filtro-btn"
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                        <button
                            onClick={limpiarFiltros}
                            className="limpiar-filtros-btn"
                        >
                            Quitar todos los filtros
                        </button>
                    </div>
                )}
            </div>

            <div className="movimientos-table">
                <div className="table-header">
                    <div
                        className={`header-cell ${orden.campo === 'nombre' ? 'active' : ''}`}
                        onClick={() => ordenarMovimientos('nombre')}
                    >
                        Nombre
                        {orden.campo === 'nombre' && (
                            <span className="sort-icon">
                                {orden.ascendente ? '↑' : '↓'}
                            </span>
                        )}
                    </div>

                    <div className={`header-cell filter-cell ${orden.campo === 'categoria' ? 'active' : ''}`}>
                        <span onClick={() => ordenarMovimientos('categoria')}>
                            Categoría
                            {orden.campo === 'categoria' && (
                                <span className="sort-icon">
                                    {orden.ascendente ? '↑' : '↓'}
                                </span>
                            )}
                        </span>
                        <span
                            className="filter-icon"
                            onClick={(e) => toggleDropdown('categoria', e)}
                        >
                            ⋮
                        </span>
                        <FilterDropdown campo="categoria">
                            <FilterCheckboxOptions
                                opciones={opcionesFiltro.categorias}
                                campoFiltro="categorias"
                            />
                        </FilterDropdown>
                    </div>

                    <div className={`header-cell filter-cell ${orden.campo === 'monto' ? 'active' : ''}`}>
                        <span onClick={() => ordenarMovimientos('monto')}>
                            Monto
                            {orden.campo === 'monto' && (
                                <span className="sort-icon">
                                    {orden.ascendente ? '↑' : '↓'}
                                </span>
                            )}
                        </span>
                        <span
                            className="filter-icon"
                            onClick={(e) => toggleDropdown('monto', e)}
                        >
                            ⋮
                        </span>
                        <FilterDropdown campo="monto">
                            <FilterRangeInputs
                                minValue={filtrosTemporales.montoMin}
                                maxValue={filtrosTemporales.montoMax}
                                minPlaceholder="0"
                                maxPlaceholder="Sin límite"
                                campo="monto"
                            />
                        </FilterDropdown>
                    </div>

                    <div className={`header-cell filter-cell ${orden.campo === 'fecha' ? 'active' : ''}`}>
                        <span onClick={() => ordenarMovimientos('fecha')}>
                            Fecha
                            {orden.campo === 'fecha' && (
                                <span className="sort-icon">
                                    {orden.ascendente ? '↑' : '↓'}
                                </span>
                            )}
                        </span>
                        <span
                            className="filter-icon"
                            onClick={(e) => toggleDropdown('fecha', e)}
                        >
                            ⋮
                        </span>
                        <FilterDropdown campo="fecha">
                            <FilterDateRange />
                        </FilterDropdown>
                    </div>

                    <div className={`header-cell filter-cell ${orden.campo === 'portafolio' ? 'active' : ''}`}>
                        <span onClick={() => ordenarMovimientos('portafolio')}>
                            Portafolios
                            {orden.campo === 'portafolio' && (
                                <span className="sort-icon">
                                    {orden.ascendente ? '↑' : '↓'}
                                </span>
                            )}
                        </span>
                        <span
                            className="filter-icon"
                            onClick={(e) => toggleDropdown('portafolio', e)}
                        >
                            ⋮
                        </span>
                        <FilterDropdown campo="portafolio">
                            <FilterCheckboxOptions
                                opciones={opcionesFiltro.portafolios}
                                campoFiltro="portafolios"
                            />
                        </FilterDropdown>
                    </div>

                    <div className={`header-cell filter-cell ${orden.campo === 'tipo' ? 'active' : ''}`}>
                        <span onClick={() => ordenarMovimientos('tipo')}>
                            Tipo
                            {orden.campo === 'tipo' && (
                                <span className="sort-icon">
                                    {orden.ascendente ? '↑' : '↓'}
                                </span>
                            )}
                        </span>
                        <span
                            className="filter-icon"
                            onClick={(e) => toggleDropdown('tipo', e)}
                        >
                            ⋮
                        </span>
                        <FilterDropdown campo="tipo">
                            <FilterCheckboxOptions
                                opciones={opcionesFiltro.tipos}
                                campoFiltro="tipos"
                            />
                        </FilterDropdown>
                    </div>

                    <div className="header-cell">Acciones</div>
                </div>

                {movimientos.length === 0 ? (
                    <div className="no-movimientos">No hay movimientos registrados</div>
                ) : (
                    movimientos.map((movimiento) => (
                        <React.Fragment key={movimiento._id}>
                            {/* Fila principal - siempre visible */}
                            
                            <div className="movimiento-row">
                                <div className="cell nombre" data-label="Nombre">
                                    {movimiento.nombre}
                                </div>
                                <div className="cell" data-label="Categoría">
                                    {movimiento.categoria?.join(', ') || 'Sin categoría'}
                                </div>
                                <div className={`cell monto ${movimiento.tipo}`} data-label="Monto">
                                    {formatearMonto(movimiento.monto, movimiento.tipo)}
                                </div>
                                <div className="cell" data-label="Fecha">
                                    {formatearFecha(movimiento.fecha)}
                                </div>
                                <div className="cell" data-label="Portafolio">
                                    {movimiento.portafolio?.nombre || 'General'}
                                </div>
                                <div className="cell" data-label="Tipo">
                                    <span className={`tipo-badge ${movimiento.tipo}`}>
                                        {movimiento.tipo}
                                    </span>
                                </div>
                                <div className="cell" data-label="Acciones">
                                    <button
                                        className="btn-eliminar"
                                        onClick={() => {
                                            setMovimientoAEliminar(movimiento._id);
                                            setMostrarModalEliminar(true);
                                        }}
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>

                            {/* Fila expandida - solo para móvil */}
                            {window.innerWidth < 769 && expandedRows[movimiento._id] && (
                                <div className="movimiento-detalle">
                                    <div className="cell" data-label="Categoría">
                                        {movimiento.categoria?.join(', ') || 'Sin categoría'}
                                    </div>
                                    <div className="cell" data-label="Portafolio">
                                        {movimiento.portafolio?.nombre || 'General'}
                                    </div>
                                    <div className="cell" data-label="Tipo">
                                        <span className={`tipo-badge ${movimiento.tipo}`}>
                                            {movimiento.tipo}
                                        </span>
                                    </div>
                                    <div className="cell" data-label="Acciones">
                                        <button
                                            className="btn-eliminar"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setMovimientoAEliminar(movimiento._id);
                                                setMostrarModalEliminar(true);
                                            }}
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            )}
                        </React.Fragment>
                    ))
                )}
            </div>

            {pagination.totalPages > 1 && (
                <div className="pagination-controls">
                    <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                    >
                        Anterior
                    </button>

                    <span>
                        Página {pagination.page} de {pagination.totalPages}
                    </span>

                    <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                    >
                        Siguiente
                    </button>
                </div>
            )}

            {movimientos.length > 0 && (
                <div className="total-movimientos">
                    Mostrando {movimientos.length} de {pagination.total} movimientos
                </div>
            )}

            {mostrarModalEliminar && (
                <div className="modal-overlay" onClick={() => setMostrarModalEliminar(false)}>
                    <div className="modal-confirmacion" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-contenido">
                            <p>¿Estás seguro de que deseas eliminar este movimiento?</p>
                            <div className="modal-botones">
                                <button onClick={() => setMostrarModalEliminar(false)}>Cancelar</button>
                                <button className="btn-eliminar" onClick={eliminarMovimiento}>
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showMobileFilterModal && (
                <div className="filter-mobile-modal">
                    <div className="filter-mobile-header">
                        <h3>Filtros</h3>
                        <button
                            className="filter-mobile-close"
                            onClick={() => setShowMobileFilterModal(false)}
                        >
                            &times;
                        </button>
                    </div>

                    <div className="mobile-filter-section">
                        <h4>Categorías</h4>
                        <FilterCheckboxOptions
                            opciones={opcionesFiltro.categorias}
                            campoFiltro="categorias"
                        />
                    </div>

                    <div className="mobile-filter-section">
                        <h4>Monto</h4>
                        <FilterRangeInputs
                            minValue={filtrosTemporales.montoMin}
                            maxValue={filtrosTemporales.montoMax}
                            minPlaceholder="0"
                            maxPlaceholder="Sin límite"
                            campo="monto"
                        />
                    </div>

                    {/* Repite para otros filtros */}

                    <button
                        className="filter-apply-button"
                        onClick={() => {
                            aplicarFiltros();
                            setShowMobileFilterModal(false);
                        }}
                    >
                        Aplicar Filtros
                    </button>
                </div>
            )}
        </div>
    );
};

export default ListaTodosMovimientos;   