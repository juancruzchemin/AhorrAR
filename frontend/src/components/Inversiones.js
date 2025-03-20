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
        <input type="text" name="nombre" placeholder="Nombre" value={formData.nombre} onChange={handleChange} required />
        <input type="number" name="montoActual" placeholder="Monto Actual" value={formData.montoActual} onChange={handleChange} required />
        <input type="number" name="precioCompra" placeholder="Precio de Compra" value={formData.precioCompra} onChange={handleChange} required />
        <input type="number" name="precioActual" placeholder="Precio Actual" value={formData.precioActual} onChange={handleChange} required />
        <input type="date" name="fechaCompra" value={formData.fechaCompra} onChange={handleChange} required />
        <input type="number" name="precioVenta" placeholder="Precio de Venta" value={formData.precioVenta} onChange={handleChange} />
        <input type="date" name="fechaVenta" value={formData.fechaVenta} onChange={handleChange} />
        <input type="text" name="categoria" placeholder="Categoría" value={formData.categoria} onChange={handleChange} required />
        <input type="text" name="subcategoria" placeholder="Subcategoría" value={formData.subcategoria} onChange={handleChange} required />
        <button type="submit">Agregar Inversión</button>
      </form>
      <ul>
        {inversiones.map((inv) => (
          <li key={inv._id}>{inv.nombre} - <button onClick={() => handleDelete(inv._id)}>Eliminar</button></li>
        ))}
      </ul>
    </div>
  );
};

export default Inversiones;
