import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import '../styles/AsignacionIngresosPortafolios.css';

const AsignacionIngresosPortafolios = ({ mesActual, onUpdate }) => {
  const [portafolios, setPortafolios] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState('');
  const API_URL = process.env.REACT_APP_BACKEND_URL;
  const token = localStorage.getItem('token');

  // Obtener portafolios del mes actual
  useEffect(() => {
    const fetchPortafolios = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/portafolio`, {
          params: {
            fechaInicio: mesActual.fechaInicio,
            fechaFin: mesActual.fechaFin
          },
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setPortafolios(response.data);
        
        // Inicializar asignaciones si no existen
        if (mesActual.asignacionesIngresos) {
          setAsignaciones(mesActual.asignacionesIngresos);
        } else {
          const nuevasAsignaciones = response.data.map(p => ({
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

  if (loading) {
    return <div className="asignacion-loading">Cargando portafolios...</div>;
  }

  return (
    <div className="asignacion-container">
      <h3 className="asignacion-title">Asignación de Ingresos a Portafolios</h3>
      
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
        {portafolios.map((portafolio, index) => {
          const asignacion = asignaciones.find(a => a.portafolioId === portafolio._id) || { monto: 0 };
          
          return (
            <div key={portafolio._id} className="asignacion-item">
              <div className="asignacion-portafolio-info">
                <h4>{portafolio.nombre}</h4>
                <span>Fecha: {format(new Date(portafolio.fecha), 'dd/MM/yyyy')}</span>
              </div>
              
              <div className="asignacion-input-group">
                <label>Monto a asignar:</label>
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
                />
                <span className="asignacion-currency">$</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="asignacion-actions">
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