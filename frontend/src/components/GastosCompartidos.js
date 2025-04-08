import React, { useState } from 'react';
import PropTypes from 'prop-types';
import "../styles/GastosCompartidos.css";

const GastosCompartidos = ({ 
  portafolio = { participantes: [], movimientos: [], usuarios: [] }, 
  usuarios = [], 
  onGuardar 
}) => {
  // Estados del componente
  const [nuevoParticipante, setNuevoParticipante] = useState('');
  const [nuevoGasto, setNuevoGasto] = useState({
    descripcion: '',
    cantidad: 0,
    pagador: null,
    reparto: []
  });
  const [mostrarFormPago, setMostrarFormPago] = useState(false);
  const [pagoSeleccionado, setPagoSeleccionado] = useState(null);
  const [portafolioDestino, setPortafolioDestino] = useState('');

  // Función para agregar participante con validaciones
  const agregarParticipante = () => {
    if (!nuevoParticipante.trim()) {
      alert('Por favor ingrese un nombre válido');
      return;
    }

    // Verificar si el participante ya existe
    const existeParticipante = (portafolio.participantes || []).some(
      p => p.nombre.toLowerCase() === nuevoParticipante.toLowerCase()
    );

    if (existeParticipante) {
      alert('Este participante ya está en la lista');
      return;
    }

    // Buscar si es un usuario registrado
    const usuarioRegistrado = usuarios.find(
      u => u.nombreUsuario.toLowerCase() === nuevoParticipante.toLowerCase()
    );

    const participante = usuarioRegistrado 
      ? { usuario: usuarioRegistrado._id, nombre: usuarioRegistrado.nombreUsuario, saldo: 0 }
      : { nombre: nuevoParticipante, saldo: 0 };

    // Actualizar el portafolio
    onGuardar({
      ...portafolio,
      participantes: [...(portafolio.participantes || []), participante]
    });

    // Limpiar el input
    setNuevoParticipante('');
  };

  // Agregar nuevo gasto compartido
  const agregarGasto = () => {
    if (!nuevoGasto.descripcion || !nuevoGasto.cantidad || !nuevoGasto.pagador || nuevoGasto.reparto.length === 0) {
      alert('Por favor complete todos los campos del gasto');
      return;
    }

    const movimiento = {
      tipo: 'reparto',
      cantidad: nuevoGasto.cantidad,
      descripcion: nuevoGasto.descripcion,
      fecha: new Date(),
      creador: nuevoGasto.pagador,
      reparto: nuevoGasto.reparto
    };

    // Actualizar saldos
    const usuariosActualizados = (portafolio.usuarios || []).map(p => {
      const reparto = nuevoGasto.reparto.find(r =>
        (r.usuario && r.usuario === p.usuario) ||
        (r.nombre && r.nombre === p.nombre)
      );

      if (reparto) {
        const cambio = p.usuario === nuevoGasto.pagador
          ? nuevoGasto.cantidad - reparto.cantidad
          : -reparto.cantidad;

        return { ...p, saldo: (p.saldo || 0) + cambio };
      }
      return p;
    });

    onGuardar({
      ...portafolio,
      movimientos: [...(portafolio.movimientos || []), movimiento],
      usuarios: usuariosActualizados
    });

    setNuevoGasto({
      descripcion: '',
      cantidad: 0,
      pagador: null,
      reparto: []
    });
  };

  // Marcar como pagado
  const marcarComoPagado = (movimiento, participante) => {
    const movimientosActualizados = (portafolio.movimientos || []).map(m => {
      if (m._id === movimiento._id) {
        const repartoActualizado = m.reparto.map(r =>
          (r.usuario === participante.usuario || r.nombre === participante.nombre)
            ? { ...r, pagado: true }
            : r
        );
        return { ...m, reparto: repartoActualizado };
      }
      return m;
    });

    setPagoSeleccionado({ movimiento, participante });
    setMostrarFormPago(true);
    onGuardar({ ...portafolio, movimientos: movimientosActualizados });
  };

  // Generar sugerencias de pagos
  const calcularSaldos = () => {
    const saldos = {};
    (portafolio.usuarios || []).forEach(p => {
      const key = p.usuario || p.nombre;
      saldos[key] = p.saldo || 0;
    });

    // Algoritmo simple para equilibrar saldos
    const deudores = Object.entries(saldos)
      .filter(([_, saldo]) => saldo < 0)
      .sort((a, b) => a[1] - b[1]);

    const acreedores = Object.entries(saldos)
      .filter(([_, saldo]) => saldo > 0)
      .sort((a, b) => b[1] - a[1]);

    const transacciones = [];

    while (deudores.length && acreedores.length) {
      const [deudor, deuda] = deudores[0];
      const [acreedor, credito] = acreedores[0];
      const monto = Math.min(-deuda, credito);

      transacciones.push({
        de: deudor,
        a: acreedor,
        cantidad: monto.toFixed(2)
      });

      if (-deuda > credito) {
        deudores[0][1] += monto;
        acreedores.shift();
      } else if (-deuda < credito) {
        acreedores[0][1] -= monto;
        deudores.shift();
      } else {
        acreedores.shift();
        deudores.shift();
      }
    }

    return transacciones;
  };

  // Renderizado seguro de la lista de participantes
  const renderParticipantes = () => {
    if (!portafolio.participantes || portafolio.participantes.length === 0) {
      return <p>No hay participantes aún. Agrega el primero.</p>;
    }

    return (
      <ul className="lista-participantes">
        {portafolio.participantes.map((participante, index) => (
          <li key={participante.usuario || participante.nombre || index}>
            {participante.nombre} - Saldo: ${(participante.saldo || 0).toFixed(2)}
          </li>
        ))}
      </ul>
    );
  };

  // Renderizado seguro de la lista de movimientos
  const renderMovimientos = () => {
    const movimientosReparto = (portafolio.movimientos || []).filter(m => m.tipo === 'reparto');
    
    if (movimientosReparto.length === 0) {
      return <p>No hay gastos compartidos registrados aún.</p>;
    }

    return movimientosReparto.map((mov, i) => (
      <div key={mov._id || i} className="movimiento">
        <div className="movimiento-header">
          <span>{mov.descripcion}</span>
          <span>${mov.cantidad.toFixed(2)}</span>
        </div>
        <div className="movimiento-detalle">
          <p>Pagado por: {(portafolio.usuarios || []).find(p =>
            p.usuario === mov.creador || p.nombre === mov.creador
          )?.nombre}</p>

          <h4>Reparto:</h4>
          <ul>
            {(mov.reparto || []).map((r, j) => (
              <li key={j}>
                {r.nombre}: ${r.cantidad.toFixed(2)}
                {!r.pagado && (
                  <button
                    onClick={() => marcarComoPagado(mov, r)}
                    className="btn-pagado"
                  >
                    Marcar como pagado
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    ));
  };

  return (
    <div className="gastos-compartidos">
      {/* Sección de participantes */}
      <div className="seccion-participantes">
        <h3>Participantes ({(portafolio.participantes || []).length})</h3>
        <div className="agregar-participante">
          <input
            type="text"
            value={nuevoParticipante}
            onChange={(e) => setNuevoParticipante(e.target.value)}
            placeholder="Nombre o usuario"
            onKeyPress={(e) => e.key === 'Enter' && agregarParticipante()}
          />
          <button onClick={agregarParticipante}>Agregar</button>
        </div>
        {renderParticipantes()}
      </div>

      {/* Formulario de nuevo gasto */}
      <div className="nuevo-gasto">
        <h3>Nuevo Gasto Compartido</h3>
        <input
          type="text"
          placeholder="Descripción"
          value={nuevoGasto.descripcion}
          onChange={(e) => setNuevoGasto({ ...nuevoGasto, descripcion: e.target.value })}
        />
        <input
          type="number"
          placeholder="Cantidad"
          value={nuevoGasto.cantidad || ''}
          onChange={(e) => setNuevoGasto({ ...nuevoGasto, cantidad: parseFloat(e.target.value) || 0 })}
        />

        <select
          value={nuevoGasto.pagador || ''}
          onChange={(e) => setNuevoGasto({ ...nuevoGasto, pagador: e.target.value })}
        >
          <option value="">Quién pagó?</option>
          {(portafolio.participantes || []).map((p, i) => (
            <option key={i} value={p.usuario || p.nombre}>
              {p.nombre}
            </option>
          ))}
        </select>

        <h4>Repartir entre:</h4>
        {(portafolio.participantes || []).map((p, i) => (
          <div key={i} className="reparto-item">
            <label>
              <input
                type="checkbox"
                checked={(nuevoGasto.reparto || []).some(r =>
                  (r.usuario && r.usuario === p.usuario) ||
                  (r.nombre && r.nombre === p.nombre)
                )}
                onChange={(e) => {
                  if (e.target.checked) {
                    setNuevoGasto({
                      ...nuevoGasto,
                      reparto: [...(nuevoGasto.reparto || []), {
                        usuario: p.usuario,
                        nombre: p.nombre,
                        cantidad: 0
                      }]
                    });
                  } else {
                    setNuevoGasto({
                      ...nuevoGasto,
                      reparto: (nuevoGasto.reparto || []).filter(r =>
                        !(r.usuario === p.usuario && r.nombre === p.nombre)
                      )
                    });
                  }
                }}
              />
              {p.nombre}
            </label>

            {(nuevoGasto.reparto || []).some(r =>
              (r.usuario && r.usuario === p.usuario) ||
              (r.nombre && r.nombre === p.nombre)
            ) && (
              <input
                type="number"
                placeholder="Cuánto paga"
                value={(nuevoGasto.reparto || []).find(r =>
                  (r.usuario === p.usuario && r.nombre === p.nombre)
                )?.cantidad || 0}
                onChange={(e) => {
                  const repartoActualizado = (nuevoGasto.reparto || []).map(r =>
                    (r.usuario === p.usuario && r.nombre === p.nombre)
                      ? { ...r, cantidad: parseFloat(e.target.value) || 0 }
                      : r
                  );
                  setNuevoGasto({ ...nuevoGasto, reparto: repartoActualizado });
                }}
              />
            )}
          </div>
        ))}

        <button onClick={agregarGasto}>Guardar Gasto</button>
      </div>

      {/* Lista de movimientos */}
      <div className="lista-movimientos">
        <h3>Historial de Gastos</h3>
        {renderMovimientos()}
      </div>

      {/* Sugerencias de pagos */}
      <div className="sugerencias-pago">
        <h3>Sugerencias para equilibrar saldos</h3>
        {calcularSaldos().map((t, i) => (
          <div key={i} className="transaccion">
            {t.de} debe pagar ${t.cantidad} a {t.a}
          </div>
        ))}
      </div>

      {/* Modal para agregar a portafolio */}
      {mostrarFormPago && (
        <div className="modal-pago">
          <div className="modal-contenido">
            <h3>Agregar movimiento a portafolio</h3>
            <p>¿Deseas agregar este pago a algún portafolio?</p>

            <select
              value={portafolioDestino}
              onChange={(e) => setPortafolioDestino(e.target.value)}
            >
              <option value="">Seleccionar portafolio</option>
              {/* Aquí deberías listar tus portafolios disponibles */}
            </select>

            <div className="modal-acciones">
              <button onClick={() => {
                // Lógica para agregar a portafolio
                // Aquí deberías implementar la función para agregar el movimiento al portafolio seleccionado
                setMostrarFormPago(false);
              }}>
                Agregar
              </button>
              <button onClick={() => setMostrarFormPago(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Prop Types para validación
GastosCompartidos.propTypes = {
  portafolio: PropTypes.shape({
    participantes: PropTypes.arrayOf(
      PropTypes.shape({
        usuario: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
        nombre: PropTypes.string.isRequired,
        saldo: PropTypes.number
      })
    ),
    movimientos: PropTypes.arrayOf(
      PropTypes.shape({
        tipo: PropTypes.string,
        cantidad: PropTypes.number,
        descripcion: PropTypes.string,
        fecha: PropTypes.instanceOf(Date),
        creador: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
        reparto: PropTypes.arrayOf(
          PropTypes.shape({
            usuario: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
            nombre: PropTypes.string,
            cantidad: PropTypes.number,
            pagado: PropTypes.bool
          })
        )
      })
    ),
    usuarios: PropTypes.arrayOf(
      PropTypes.shape({
        usuario: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
        nombre: PropTypes.string,
        saldo: PropTypes.number
      })
    ),
    nombre: PropTypes.string,
    tipo: PropTypes.arrayOf(PropTypes.string)
  }),
  usuarios: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
      nombreUsuario: PropTypes.string.isRequired
    })
  ),
  onGuardar: PropTypes.func.isRequired
};

// Valores por defecto
GastosCompartidos.defaultProps = {
  portafolio: {
    participantes: [],
    movimientos: [],
    usuarios: []
  },
  usuarios: []
};

export default GastosCompartidos;