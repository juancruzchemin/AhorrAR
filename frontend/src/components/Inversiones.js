import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/Inversiones.css";

const Inversiones = () => {
  const [inversiones, setInversiones] = useState([]);
  const [formData, setFormData] = useState({
    nombre: "",
    montoActual: 0,
    precioCompra: 0,
    precioActual: 0,
    fechaCompra: "",
    precioVenta: 0,
    fechaVenta: "",
    categoria: "",
    subcategoria: "",
  });

  const token = localStorage.getItem("token"); // Si usas autenticación

  // Obtener todas las inversiones al cargar el componente
  useEffect(() => {
    const fetchInversiones = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/inversiones`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setInversiones(response.data);
      } catch (error) {
        console.error("Error al obtener inversiones:", error);
      }
    };
    fetchInversiones();
  }, []);

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Agregar una nueva inversión
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/inversiones`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInversiones([...inversiones, response.data]);
      setFormData({
        nombre: "",
        montoActual: 0,
        precioCompra: 0,
        precioActual: 0,
        fechaCompra: "",
        precioVenta: 0,
        fechaVenta: "",
        categoria: "",
        subcategoria: "",
      });
    } catch (error) {
      console.error("Error al agregar la inversión:", error);
    }
  };

  // Eliminar una inversión
  const handleDelete = async (id) => {
    try {
      await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/api/inversiones/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInversiones(inversiones.filter((inv) => inv._id !== id));
    } catch (error) {
      console.error("Error al eliminar la inversión:", error);
    }
  };

  return (
    <div className="inversiones-container">
      <h1>Gestión de Inversiones</h1>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label htmlFor="nombre">Nombre</label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            placeholder="Nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="montoActual">Monto Actual</label>
          <input
            type="number"
            id="montoActual"
            name="montoActual"
            placeholder="Monto Actual"
            value={formData.montoActual}
            onChange={handleChange}
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="precioCompra">Precio de Compra</label>
          <input
            type="number"
            id="precioCompra"
            name="precioCompra"
            placeholder="Precio de Compra"
            value={formData.precioCompra}
            onChange={handleChange}
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="precioActual">Precio Actual</label>
          <input
            type="number"
            id="precioActual"
            name="precioActual"
            placeholder="Precio Actual"
            value={formData.precioActual}
            onChange={handleChange}
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="fechaCompra">Fecha de Compra</label>
          <input
            type="date"
            id="fechaCompra"
            name="fechaCompra"
            value={formData.fechaCompra}
            onChange={handleChange}
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="precioVenta">Precio de Venta</label>
          <input
            type="number"
            id="precioVenta"
            name="precioVenta"
            placeholder="Precio de Venta"
            value={formData.precioVenta}
            onChange={handleChange}
          />
        </div>

        <div className="input-group">
          <label htmlFor="fechaVenta">Fecha de Venta</label>
          <input
            type="date"
            id="fechaVenta"
            name="fechaVenta"
            value={formData.fechaVenta}
            onChange={handleChange}
          />
        </div>

        <div className="input-group">
          <label htmlFor="categoria">Categoría</label>
          <input
            type="text"
            id="categoria"
            name="categoria"
            placeholder="Categoría"
            value={formData.categoria}
            onChange={handleChange}
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="subcategoria">Subcategoría</label>
          <input
            type="text"
            id="subcategoria"
            name="subcategoria"
            placeholder="Subcategoría"
            value={formData.subcategoria}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit">Agregar Inversión</button>
      </form>

      <ul>
        {inversiones.map((inv) => (
          <li key={inv._id}>
            {inv.nombre}{" "}
            <button onClick={() => handleDelete(inv._id)}>Eliminar</button>
          </li>
        ))}
      </ul>
    </div>

  );
};

export default Inversiones;
