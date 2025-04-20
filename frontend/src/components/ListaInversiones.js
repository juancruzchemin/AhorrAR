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
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [inversionDesplegada, setInversionDesplegada] = useState(null);
    const [nuevaInversion, setNuevaInversion] = useState({
        nombre: '',
        categoria: '',
        precioCompra: 0,
        precioActual: 0,
        cantidad: 1,
        fechaCompra: format(new Date(), 'yyyy-MM-dd'),
        notas: '',
        estado: 'activa' // Estado inicial
    });
    const [mostrarModalVenta, setMostrarModalVenta] = useState(false);
    const [inversionAVender, setInversionAVender] = useState(null);
    const [datosVenta, setDatosVenta] = useState({
        precioVenta: 0,
        fechaVenta: format(new Date(), 'yyyy-MM-dd')
    });

    const [categoriasPortafolio, setCategoriasPortafolio] = useState([]);
    // Estados para ordenamiento
    const [campoOrdenado, setCampoOrdenado] = useState('nombre');
    const [ordenAscendente, setOrdenAscendente] = useState(true);
    const [menuAbiertoId, setMenuAbiertoId] = useState(null);


    // Función para ordenar las inversiones
    const ordenarInversiones = (campo) => {
        if (campo === campoOrdenado) {
            setOrdenAscendente(!ordenAscendente);
        } else {
            setCampoOrdenado(campo);
            setOrdenAscendente(true);
        }
    };

    // Función para ordenar las inversiones antes de renderizar
    const inversionesOrdenadas = [...inversiones].sort((a, b) => {
        let comparacion = 0;

        switch (campoOrdenado) {
            case 'nombre':
                comparacion = a.nombre.localeCompare(b.nombre);
                break;
            case 'categoria':
                comparacion = a.categoria.localeCompare(b.categoria);
                break;
            case 'precioCompra':
                comparacion = a.precioCompra - b.precioCompra;
                break;
            case 'precioActual':
                comparacion = a.precioActual - b.precioActual;
                break;
            case 'cantidad':
                comparacion = (a.cantidad || 1) - (b.cantidad || 1);
                break;
            case 'fechaCompra':
                comparacion = new Date(a.fechaCompra) - new Date(b.fechaCompra);
                break;
            case 'rentabilidad':
                const rentA = parseFloat(calcularRentabilidad(a));
                const rentB = parseFloat(calcularRentabilidad(b));
                comparacion = rentA - rentB;
                break;
            default:
                comparacion = a.nombre.localeCompare(b.nombre);
        }

        return ordenAscendente ? comparacion : -comparacion;
    });

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

    const [modalCategorias, setModalCategorias] = useState({
        visible: false,
        mensaje: null,
        confirmacionEliminar: null
    });
    const [nuevaCategoria, setNuevaCategoria] = useState('');
    const [categoriaEditando, setCategoriaEditando] = useState(null);
    const [nuevoNombreCategoria, setNuevoNombreCategoria] = useState('');
    const [mostrandoVendidas, setMostrandoVendidas] = useState(false);

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

    // Efecto para detectar cambios en el tamaño de pantalla
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
        if (!nuevaInversion.categoria) {
            setMensaje('Debes seleccionar una categoría');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setMensaje('No estás autenticado');
                return;
            }

            const payload = {
                nombre: nuevaInversion.nombre,
                categoria: nuevaInversion.categoria,
                precioCompra: Number(nuevaInversion.precioCompra),
                precioActual: Number(nuevaInversion.precioActual),
                cantidad: Number(nuevaInversion.cantidad),
                fechaCompra: nuevaInversion.fechaCompra,
                notas: nuevaInversion.notas || '',
                estado: nuevaInversion.estado, // Enviar el estado
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
            setMensaje('Inversión creada exitosamente');
            setNuevaInversion({
                nombre: '',
                categoria: categoriasPortafolio[0]?.nombre || '',
                precioCompra: 0,
                precioActual: 0,
                cantidad: 1,
                fechaCompra: format(new Date(), 'yyyy-MM-dd'),
                notas: '',
                estado: 'activa' // Resetear estado
            });
        } catch (error) {
            console.error('Error al agregar inversión:', error);
            setMensaje('Error al agregar inversión');
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

    const agregarCategoria = async () => {
        const nombreCategoria = nuevaCategoria.trim();

        if (!nombreCategoria) {
            setModalCategorias({
                ...modalCategorias,
                mensaje: {
                    texto: 'El nombre de la categoría no puede estar vacío',
                    tipo: 'error'
                }
            });
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('No hay token disponible');

            const response = await axios.post(
                `${process.env.REACT_APP_BACKEND_URL}/api/portafolios/${portafolioId}/categorias`,
                { nombre: nombreCategoria },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const categoriaAgregada = response.data.categoria;
            const nombreCategoriaAgregada = categoriaAgregada.nombre;

            // Actualizar el estado de categorías
            setCategoriasPortafolio(prev => [...prev, categoriaAgregada]);
            setNuevaCategoria('');

            // Mostrar mensaje de éxito
            setModalCategorias({
                ...modalCategorias,
                mensaje: {
                    texto: `Categoría "${nombreCategoriaAgregada}" agregada correctamente`,
                    tipo: 'exito'
                }
            });

            // Actualizar el selector de categorías en el formulario
            setNuevaInversion(prev => ({
                ...prev,
                categoria: nombreCategoriaAgregada
            }));

        } catch (error) {
            let errorMsg = 'Error al agregar categoría';

            if (error.response) {
                if (error.response.status === 409) {
                    errorMsg = 'Ya existe una categoría con ese nombre';
                } else if (error.response.data?.error) {
                    errorMsg = error.response.data.error;
                }
            }

            setModalCategorias({
                ...modalCategorias,
                mensaje: {
                    texto: errorMsg,
                    tipo: 'error'
                }
            });
        }
    };

    const guardarEdicionCategoria = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `${process.env.REACT_APP_BACKEND_URL}/api/portafolios/${portafolioId}/categorias/${categoriaEditando._id}`,
                { nombre: nuevoNombreCategoria.trim() },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Actualizar el estado de categorías
            const nuevasCategorias = categoriasPortafolio.map(cat =>
                cat._id === categoriaEditando._id ? { ...cat, nombre: nuevoNombreCategoria.trim() } : cat
            );

            setCategoriasPortafolio(nuevasCategorias);
            setCategoriaEditando(null);

            setModalCategorias({
                ...modalCategorias,
                mensaje: {
                    texto: 'Categoría actualizada correctamente',
                    tipo: 'exito'
                }
            });

        } catch (error) {
            setModalCategorias({
                ...modalCategorias,
                mensaje: {
                    texto: error.response?.data?.error || 'Error al actualizar categoría',
                    tipo: 'error'
                }
            });
        }
    };

    const eliminarCategoria = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(
                `${process.env.REACT_APP_BACKEND_URL}/api/portafolios/${portafolioId}/categorias/${id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Actualizar el estado de categorías
            const nuevasCategorias = categoriasPortafolio.filter(cat => cat._id !== id);
            setCategoriasPortafolio(nuevasCategorias);

            // Cerrar el modal de confirmación y mostrar mensaje
            setModalCategorias({
                visible: true, // Mantener el modal abierto
                mensaje: {
                    texto: 'Categoría eliminada correctamente',
                    tipo: 'exito'
                },
                confirmacionEliminar: null // Limpiar la confirmación
            });

        } catch (error) {
            setModalCategorias({
                ...modalCategorias,
                mensaje: {
                    texto: error.response?.data?.error || 'Error al eliminar categoría',
                    tipo: 'error'
                },
                confirmacionEliminar: null
            });
        }
    };

    const abrirModalCategorias = (e) => {
        e.stopPropagation();
        setModalCategorias({
            visible: true,
            mensaje: null,
            confirmacionEliminar: null
        });
    };

    const obtenerEstadoInversion = (inversion) => {
        if (inversion.fechaVenta) {
            return 'Vendida';
        }
        return 'Activa';
    };

    // Agregar esta función con las demás funciones del componente
    const venderInversion = async (inversion) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setMensaje('No estás autenticado.');
                return;
            }

            // Validar precioVenta
            if (!inversion.precioActual || inversion.precioActual <= 0) {
                setMensaje('El precio de venta debe ser mayor a 0.');
                return;
            }

            const datosVenta = {
                precioVenta: inversion.precioActual, // Monto a agregar al totalDisponible
                fechaVenta: new Date().toISOString(), // Fecha de venta
            };

            console.log('Datos enviados al servidor:', datosVenta);

            const response = await axios.put(
                `${process.env.REACT_APP_BACKEND_URL}/api/inversiones/${inversion._id}/vender`,
                datosVenta,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            console.log('Venta confirmada:', response.data);

            // Actualizar el estado de la inversión en el frontend
            setInversiones((prev) =>
                prev.map((inv) =>
                    inv._id === inversion._id
                        ? { ...inv, estado: 'vendida', fechaVenta: datosVenta.fechaVenta }
                        : inv
                )
            );

            setMensaje('Inversión vendida correctamente.');
            fetchInversiones(); // Recargar la lista de inversiones
        } catch (error) {
            console.error('Error en la venta:', error);

            let errorMessage = 'No se pudo confirmar la venta.';
            if (error.response && error.response.data && error.response.data.error) {
                errorMessage = error.response.data.error;
            }

            setMensaje(errorMessage);
        }
    };

    // Agregar esta función con las demás funciones del componente
    const confirmarVenta = async () => {
        if (!datosVenta.precioVenta || datosVenta.precioVenta <= 0) {
            setMensaje('El precio de venta debe ser mayor a 0.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(
                `${process.env.REACT_APP_BACKEND_URL}/api/inversiones/${inversionAVender._id}/vender`,
                datosVenta,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            console.log('Venta confirmada:', response.data);
            setMensaje('Inversión vendida correctamente.');
            setMostrarModalVenta(false);
            fetchInversiones(); // Recargar la lista de inversiones
        } catch (error) {
            console.error('Error en la venta:', error);
            setMensaje('No se pudo confirmar la venta.');
        }
    };

    const toggleMenu = (id) => {
        setMenuAbiertoId(menuAbiertoId === id ? null : id);
    };

    const toggleFormulario = () => {
        setMostrarFormulario(!mostrarFormulario);
        // Si estamos cerrando el formulario, limpiamos los campos
        if (mostrarFormulario) {
            setNuevaInversion({
                nombre: '',
                categoria: categoriasPortafolio[0]?.nombre || '',
                precioCompra: 0,
                precioActual: 0,
                cantidad: 1,
                fechaCompra: format(new Date(), 'yyyy-MM-dd'),
                notas: ''
            });
        }
    };

    const renderMobileView = () => (
        <div className="mobile-view-container">
            {/* Formulario desplegable para nueva inversión */}
            <div className={`formulario-movil ${mostrarFormulario ? 'desplegado' : ''}`}>
                <div className="encabezado-formulario" onClick={toggleFormulario}>
                    <h3>Añadir Inversión</h3>
                    <span className="icono-desplegable">
                        {mostrarFormulario ? '▼' : '▼'}
                    </span>
                </div>

                {mostrarFormulario && (
                    <div className="contenido-formulario">
                        <div className="campo-formulario">
                            <label>Nombre</label>
                            <input
                                type="text"
                                name="nombre"
                                value={nuevaInversion.nombre}
                                onChange={manejarCambioNuevaInversion}
                                placeholder="Nombre"
                                required
                            />
                        </div>

                        <div className="campo-formulario">
                            <label>Categoría</label>
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
                        </div>

                        <div className="campo-formulario">
                            <label>Precio Compra</label>
                            <input
                                type="number"
                                name="precioCompra"
                                value={nuevaInversion.precioCompra}
                                onChange={manejarCambioNuevaInversion}
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>

                        <div className="campo-formulario">
                            <label>Precio Actual</label>
                            <input
                                type="number"
                                name="precioActual"
                                value={nuevaInversion.precioActual}
                                onChange={manejarCambioNuevaInversion}
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>

                        <div className="campo-formulario">
                            <label>Cantidad</label>
                            <input
                                type="number"
                                name="cantidad"
                                value={nuevaInversion.cantidad}
                                onChange={manejarCambioNuevaInversion}
                                min="1"
                                step="1"
                                required
                            />
                        </div>

                        <div className="campo-formulario">
                            <label>Fecha Compra</label>
                            <input
                                type="date"
                                name="fechaCompra"
                                value={nuevaInversion.fechaCompra}
                                onChange={manejarCambioNuevaInversion}
                                required
                            />
                        </div>

                        <button
                            className="boton-agregar"
                            onClick={agregarNuevaInversion}
                            disabled={!nuevaInversion.nombre.trim()}
                        >
                            Agregar Inversión
                        </button>
                    </div>
                )}
            </div>

            {/* Lista de inversiones */}
            <div className="inversiones-lista">
                {inversiones.length === 0 ? (
                    <div className="no-inversiones">No hay inversiones registradas.</div>
                ) : (
                    inversiones.map((inversion) => (
                        <div key={inversion._id} className={`inversion-item ${inversionDesplegada === inversion._id ? 'desplegado' : ''}`}>
                            <div
                                className="inversion-header"
                                onClick={() => setInversionDesplegada(inversionDesplegada === inversion._id ? null : inversion._id)}
                            >
                                <div className="inversion-nombre">
                                    {inversion.nombre}
                                    <span className="inversion-categoria">{inversion.categoria}</span>
                                    <span className="inversion-estado">Estado: {obtenerEstadoInversion(inversion)}</span>
                                </div>


                                <div className={`inversion-rentabilidad ${parseFloat(calcularRentabilidad(inversion)) >= 0 ? 'positivo' : 'negativo'}`}>
                                    {calcularRentabilidad(inversion)}%
                                </div>
                                <div className="inversion-flecha">
                                    {inversionDesplegada === inversion._id ? <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-info-circle" viewBox="0 0 16 16">
                                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                                        <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0" />
                                    </svg> : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-info-circle" viewBox="0 0 16 16">
                                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                                        <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0" />
                                    </svg>}
                                </div>
                            </div>

                            {inversionDesplegada === inversion._id && (
                                <div className="inversion-detalles">
                                    <div className="detalle-fila">
                                        <span className="detalle-etiqueta">Estado:</span>
                                        <span className="detalle-valor">{inversion.estado || 'No definido'}</span>
                                    </div>

                                    <div className="detalle-fila">
                                        <span className="detalle-etiqueta">Precio Compra:</span>
                                        {editandoId === inversion._id ? (
                                            <input
                                                type="number"
                                                name="precioCompra"
                                                value={inversion.precioCompra}
                                                onChange={(e) => manejarCambio(e, inversion)}
                                                min="0"
                                                step="0.01"
                                                className="detalle-valor"
                                            />
                                        ) : (
                                            <span className="detalle-valor">${inversion.precioCompra.toFixed(2)}</span>
                                        )}
                                    </div>

                                    <div className="detalle-fila">
                                        <span className="detalle-etiqueta">Precio Actual:</span>
                                        {editandoId === inversion._id ? (
                                            <input
                                                type="number"
                                                name="precioActual"
                                                value={inversion.precioActual}
                                                onChange={(e) => manejarCambio(e, inversion)}
                                                min="0"
                                                step="0.01"
                                                className="detalle-valor"
                                            />
                                        ) : (
                                            <span className="detalle-valor">${inversion.precioActual.toFixed(2)}</span>
                                        )}
                                    </div>

                                    <div className="detalle-fila">
                                        <span className="detalle-etiqueta">Cantidad:</span>
                                        {editandoId === inversion._id ? (
                                            <input
                                                type="number"
                                                name="cantidad"
                                                value={inversion.cantidad || 1}
                                                onChange={(e) => manejarCambio(e, inversion)}
                                                min="1"
                                                step="1"
                                                className="detalle-valor"
                                            />
                                        ) : (
                                            <span className="detalle-valor">{inversion.cantidad || 1}</span>
                                        )}
                                    </div>

                                    <div className="detalle-fila">
                                        <span className="detalle-etiqueta">Monto Total:</span>
                                        <span className="detalle-valor">
                                            ${(inversion.precioActual * (inversion.cantidad || 1)).toFixed(2)}
                                        </span>
                                    </div>

                                    <div className="detalle-fila">
                                        <span className="detalle-etiqueta">Fecha Compra:</span>
                                        {editandoId === inversion._id ? (
                                            <input
                                                type="date"
                                                name="fechaCompra"
                                                value={inversion.fechaCompra?.split('T')[0] || format(new Date(), 'yyyy-MM-dd')}
                                                onChange={(e) => manejarCambio(e, inversion)}
                                                className="detalle-valor"
                                            />
                                        ) : (
                                            <span className="detalle-valor">
                                                {formatearFecha(inversion.fechaCompra)}
                                            </span>
                                        )}
                                    </div>

                                    <div className="inversion-acciones">
                                        {editandoId === inversion._id ? (
                                            <>
                                                <button className="accion-btn guardar" onClick={() => guardarInversion(inversion)}>
                                                    Guardar
                                                </button>
                                                <button className="accion-btn cancelar" onClick={() => setEditandoId(null)}>
                                                    Cancelar
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button className="accion-btn editar" onClick={() => setEditandoId(inversion._id)}>
                                                    Editar
                                                </button>
                                                {inversion.estado !== 'vendida' && (
                                                    <button className="vender" onClick={() => venderInversion(inversion)}>Vender</button>
                                                )}
                                                <button className="accion-btn eliminar" onClick={() => {
                                                    setInversionAEliminar(inversion);
                                                    setMostrarConfirmacion(true);
                                                }}>
                                                    Eliminar
                                                </button>
                                            </>
                                        )}

                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    const renderDesktopView = () => (
        <table className="table">
            <thead>
                <tr>
                    <th onClick={() => ordenarInversiones('nombre')}>
                        Nombre
                        {campoOrdenado === 'nombre' && (
                            <span className="icono-orden">
                                {ordenAscendente ? '↑' : '↓'}
                            </span>
                        )}
                    </th>
                    <th onClick={() => ordenarInversiones('estado')}>
                        Estado
                        {campoOrdenado === 'estado' && (
                            <span className="icono-orden">
                                {ordenAscendente ? '↑' : '↓'}
                            </span>
                        )}
                    </th>
                    <th onClick={() => ordenarInversiones('categoria')}>
                        <div className="categoria-header-container">
                            <div className="categoria-header-content">
                                <span className="categoria-titulo">
                                    Categoría
                                    {campoOrdenado === 'categoria' && (
                                        <span className="icono-orden">
                                            {ordenAscendente ? '↑' : '↓'}
                                        </span>
                                    )}
                                </span>
                            </div>
                            <button
                                className="categoria-menu-button"
                                onClick={abrirModalCategorias}
                                aria-label="Gestionar categorías"
                            >
                                <span className="puntos-verticales">⋮</span>
                            </button>
                        </div>
                    </th>
                    <th onClick={() => ordenarInversiones('precioCompra')}>
                        Precio Compra
                        {campoOrdenado === 'precioCompra' && (
                            <span className="icono-orden">
                                {ordenAscendente ? '↑' : '↓'}
                            </span>
                        )}
                    </th>
                    <th onClick={() => ordenarInversiones('precioActual')}>
                        Precio Actual
                        {campoOrdenado === 'precioActual' && (
                            <span className="icono-orden">
                                {ordenAscendente ? '↑' : '↓'}
                            </span>
                        )}
                    </th>
                    {/* <th onClick={() => ordenarInversiones('cantidad')}>
                        Cantidad
                        {campoOrdenado === 'cantidad' && (
                            <span className="icono-orden">
                                {ordenAscendente ? '↑' : '↓'}
                            </span>
                        )}
                    </th> */}
                    <th>Monto Total</th>
                    <th onClick={() => ordenarInversiones('fechaCompra')}>
                        Fecha Compra
                        {campoOrdenado === 'fechaCompra' && (
                            <span className="icono-orden">
                                {ordenAscendente ? '↑' : '↓'}
                            </span>
                        )}
                    </th>
                    <th onClick={() => ordenarInversiones('rentabilidad')}>
                        Rentabilidad
                        {campoOrdenado === 'rentabilidad' && (
                            <span className="icono-orden">
                                {ordenAscendente ? '↑' : '↓'}
                            </span>
                        )}
                    </th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                {/* Fila para agregar nueva inversión */}
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
                            name="estado"
                            value={nuevaInversion.estado}
                            onChange={manejarCambioNuevaInversion}
                            required
                        >
                            <option value="activa">Activa</option>
                            <option value="vendida">Vendida</option>
                        </select>
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
                        {nuevaInversion.precioCompra > 0
                            ? (
                                ((nuevaInversion.precioActual - nuevaInversion.precioCompra) /
                                    nuevaInversion.precioCompra) *
                                100
                            ).toFixed(2) + '%'
                            : '0.00%'}
                    </td>
                    <td>
                        <button className="agregar" onClick={agregarNuevaInversion}>
                            Agregar
                        </button>
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
                                        name="estado"
                                        value={inversion.estado}
                                        onChange={(e) => manejarCambio(e, inversion)}
                                    >
                                        <option value="activa">Activa</option>
                                        <option value="vendida">Vendida</option>
                                    </select>
                                ) : (
                                    inversion.estado
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
                                        {!inversion.fechaVenta && (
                                            <button className="vender" onClick={() => venderInversion(inversion)}>Vender</button>
                                        )}
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

    );

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
        <div className="lista-movimientos-container">
            <h3>Inversiones del Portafolio</h3>
            {mensaje && (
                <div className={`portfolio-message ${mensaje.includes('Error') ? 'portfolio-message-error' : 'portfolio-message-success'}`}>
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

            {isMobile ? renderMobileView() : renderDesktopView()}

            {/* Modal de confirmación para eliminar */}
            {mostrarConfirmacion && (
                <div className="modal-overlay" onClick={() => setMostrarConfirmacion(false)}>
                    <div className="modal-confirmacion" onClick={(e) => e.stopPropagation()}>
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
                </div>
            )}

            {modalCategorias.visible && (
                <div className="modal-overlay" onClick={() => setModalCategorias({ ...modalCategorias, visible: false })}>
                    <div className="modal-categorias-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-categorias-header">
                            <h3>Gestionar Categorías</h3>
                            <button
                                className="cerrar-modal"
                                onClick={() => setModalCategorias({ ...modalCategorias, visible: false })}
                            >
                                &times;
                            </button>
                        </div>

                        {modalCategorias.mensaje && (
                            <div className={`modal-mensaje ${modalCategorias.mensaje.tipo}`}>
                                {modalCategorias.mensaje.texto}
                            </div>
                        )}

                        {/* Confirmación de eliminación */}
                        {modalCategorias.confirmacionEliminar && (
                            <div className="confirmacion-eliminar">
                                <p>¿Estás seguro de eliminar la categoría "{modalCategorias.confirmacionEliminar.nombre}"?</p>
                                <div className="confirmacion-botones">
                                    <button
                                        className="btn-confirmar"
                                        onClick={() => {
                                            eliminarCategoria(modalCategorias.confirmacionEliminar.id);
                                            setModalCategorias({ ...modalCategorias, confirmacionEliminar: null });
                                        }}
                                    >
                                        Eliminar
                                    </button>
                                    <button
                                        className="btn-cancelar"
                                        onClick={() => setModalCategorias({ ...modalCategorias, confirmacionEliminar: null })}
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Lista de categorías */}
                        <div className="lista-categorias">
                            {categoriasPortafolio.map(categoria => (
                                <div key={categoria._id} className="categoria-item">
                                    {categoriaEditando?._id === categoria._id ? (
                                        <input
                                            type="text"
                                            value={nuevoNombreCategoria}
                                            onChange={(e) => setNuevoNombreCategoria(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && guardarEdicionCategoria()}
                                            autoFocus
                                            className="input-edicion-categoria"
                                        />
                                    ) : (
                                        <span className="categoria-nombre">{categoria.nombre}</span>
                                    )}

                                    <div className="categoria-acciones">
                                        {categoriaEditando?._id === categoria._id ? (
                                            <>
                                                <button
                                                    className="btn-guardar"
                                                    onClick={guardarEdicionCategoria}
                                                    disabled={!nuevoNombreCategoria.trim()}
                                                >
                                                    Guardar
                                                </button>
                                                <button
                                                    className="btn-cancelar"
                                                    onClick={() => setCategoriaEditando(null)}
                                                >
                                                    Cancelar
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    className="btn-editar"
                                                    onClick={() => {
                                                        setCategoriaEditando(categoria);
                                                        setNuevoNombreCategoria(categoria.nombre);
                                                    }}
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    className="btn-eliminar"
                                                    onClick={() => setModalCategorias({
                                                        ...modalCategorias,
                                                        confirmacionEliminar: {
                                                            id: categoria._id,
                                                            nombre: categoria.nombre
                                                        }
                                                    })}
                                                >
                                                    Eliminar
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Formulario para nueva categoría */}
                        <div className="nueva-categoria-form">
                            <input
                                type="text"
                                placeholder="Nueva categoría"
                                value={nuevaCategoria}
                                onChange={(e) => setNuevaCategoria(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && agregarCategoria()}
                                className="input-nueva-categoria"
                            />
                            <button
                                className="btn-agregar"
                                onClick={agregarCategoria}
                                disabled={!nuevaCategoria.trim()}
                            >
                                Agregar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {mostrarModalVenta && (
                <div className="modal-overlay" onClick={() => setMostrarModalVenta(false)}>
                    <div className="modal-confirmacion" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-contenido">
                            <h3>Vender Inversión: {inversionAVender?.nombre}</h3>
                            <p className="info-venta">
                                Monto actual: ${(inversionAVender?.precioActual * (inversionAVender?.cantidad || 1)).toFixed(2)}
                            </p>

                            <div className="campo-formulario">
                                <label>Precio de Venta</label>
                                <input
                                    type="number"
                                    value={datosVenta.precioVenta}
                                    onChange={(e) => setDatosVenta({
                                        ...datosVenta,
                                        precioVenta: parseFloat(e.target.value) || 0
                                    })}
                                    min="0"
                                    step="0.01"
                                />
                            </div>

                            <div className="campo-formulario">
                                <label>Fecha de Venta</label>
                                <input
                                    type="date"
                                    value={datosVenta.fechaVenta}
                                    onChange={(e) => setDatosVenta({
                                        ...datosVenta,
                                        fechaVenta: e.target.value
                                    })}
                                />
                            </div>

                            <div className="resumen-venta">
                                <p>El monto de <strong>${datosVenta.precioVenta.toFixed(2)}</strong> se agregará al disponible del portafolio.</p>
                            </div>

                            <div className="modal-botones">
                                <button onClick={() => setMostrarModalVenta(false)}>Cancelar</button>
                                <button className="confirmar" onClick={confirmarVenta}>
                                    Confirmar Venta
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default ListaInversiones;