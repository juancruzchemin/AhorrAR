// src/components/Inversiones.js
import React, { useState } from 'react';
import Inversion from '../models/Inversion';
import '../styles/Inversiones.css'; // Asegúrate de crear este archivo CSS

const Inversiones = () => {
  const [inversiones, setInversiones] = useState([]);
  const [formData, setFormData] = useState({
    nombre: '',
    montoActual: 0,
    precioCompra: 0,
    precioActual: 0,
    fechaCompra: '',
    precioVenta: 0,
    fechaVenta: '',
    categoria: '',
    subcategoria: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const nuevaInversion = new Inversion(
      formData.nombre,
      parseFloat(formData.montoActual),
      parseFloat(formData.precioCompra),
      parseFloat(formData.precioActual),
      formData.fechaCompra,
      parseFloat(formData.precioVenta),
      formData.fechaVenta,
      formData.categoria,
      formData.subcategoria
    );

    setInversiones((prevInversiones) => {
      const existingInversion = prevInversiones.find(inv => inv.nombre === nuevaInversion.nombre);
      if (existingInversion) {
        existingInversion.montoActual += nuevaInversion.montoActual; // Acumular monto
        return [...prevInversiones];
      }
      return [...prevInversiones, nuevaInversion];
    });

    setFormData({
      nombre: '',
      montoActual: 0,
      precioCompra: 0,
      precioActual: 0,
      fechaCompra: '',
      precioVenta: 0,
      fechaVenta: '',
      categoria: '',
      subcategoria: ''
    });
  };

  const handleDelete = (nombre) => {
    setInversiones(inversiones.filter(inv => inv.nombre !== nombre));
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
      <h2>Lista de Inversiones</h2>
      <ul>
        {inversiones.map((inversion, index) => (
          <li key={index}>
            {inversion.nombre} - Monto: {inversion.montoActual} - <button onClick={() => handleDelete(inversion.nombre)}>Eliminar</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Inversiones;