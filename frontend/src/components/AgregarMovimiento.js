import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/AgregarMovimiento.css'; // Asegúrate de que la ruta sea correcta

const AgregarMovimiento = ({ portafolioId, onMovimientoAgregado }) => {
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState(''); // Cambiar a string para un solo valor
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState('');
  const [fijo, setFijo] = useState(false);
  const [tipo, setTipo] = useState('gasto'); // Estado para el tipo de movimiento
  const [mensaje, setMensaje] = useState('');
  const [isOpen, setIsOpen] = useState(false); // Estado para controlar el desplegable
  const [categoriasDisponibles, setCategoriasDisponibles] = useState([]); // Estado para las categorías

  useEffect(() => {
    const fetchCategorias = async () => {
      const token = localStorage.getItem('token'); // Obtener el token del localStorage
      if (!token) {
        setMensaje('No hay sesión activa. Por favor, inicia sesión.');
        return;
      }

      try {
        const response = await axios.get(`http://localhost:5000/api/portafolios/${portafolioId}/categorias`, {
          headers: {
            Authorization: `Bearer ${token}` // Enviar el token en el encabezado
          }
        });
        setCategoriasDisponibles(response.data); // Almacenar las categorías en el estado
      } catch (error) {
        console.error('Error al obtener las categorías:', error);
        setMensaje('Error al obtener las categorías: ' + (error.response?.data.error || 'Error desconocido'));
      }
    };

    fetchCategorias();
  }, [portafolioId]);

  const agregarMovimiento = async (e) => {
    e.preventDefault(); // Evitar el comportamiento por defecto del formulario
  
    const token = localStorage.getItem('token'); // Obtener el token del localStorage
    if (!token) {
      setMensaje('No hay sesión activa. Por favor, inicia sesión.');
      return;
    }
  
    const movimientoData = {
      nombre,
      categoria,
      monto: parseFloat(monto), // Asegúrate de convertir el monto a número
      fecha,
      fijo,
      tipo, // Agregar el tipo de movimiento
      portafolio: portafolioId // Asegúrate de que este campo esté presente
    };
  
    try {
      const response = await axios.post('http://localhost:5000/api/movimientos', movimientoData, {
        headers: {
          Authorization: `Bearer ${token}` // Enviar el token en el encabezado
        }
      });
      setMensaje('Movimiento agregado exitosamente');
      onMovimientoAgregado(response.data); // Llama a la función para actualizar la lista de movimientos
    } catch (error) {
      console.error('Error al agregar el movimiento:', error);
      setMensaje('Error al agregar el movimiento: ' + (error.response?.data.error || 'Error desconocido'));
    }
  };
  
  return (
    <div className="agregar-movimiento-container">
      <h3 onClick={() => setIsOpen(!isOpen)} style={{ cursor: 'pointer' }}>
        {isOpen ? 'Ocultar Formulario' : 'Agregar Movimiento'}
      </h3>
      {isOpen && ( // Mostrar el formulario solo si isOpen es true
        <form onSubmit={agregarMovimiento}>
          <input
            type="text"
            placeholder="Nombre del Movimiento"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="gasto">Gasto</option>
            <option value="ingreso">Ingreso</option>
          </select>
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            <option value="">Selecciona una categoría</option>
            {categoriasDisponibles.map((cat, index) => (
              <option key={index} value={cat.nombre}>{cat.nombre}</option> // Asegúrate de usar el nombre de la categoría
            ))}
          </select>
          <input
            type="number"
            placeholder="Monto"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            required
          />
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            required
          />
          <div className="checkbox-group">
            <label>
              Gasto Fijo
              <input
                type="checkbox"
                checked={fijo}
                onChange={(e) => setFijo(e.target.checked)}
              />              
            </label>
          </div>
          <button type="submit">Agregar Movimiento</button>
        </form>
      )}
      {mensaje && <p>{mensaje}</p>} {/* Mostrar mensaje si existe */}
    </div>
  );
};

export default AgregarMovimiento;
