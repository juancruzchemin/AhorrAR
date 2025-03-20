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
    fechaCompra: new Date().toISOString().split("T")[0], // Fecha actual en formato YYYY-MM-DD
    precioVenta: 0,
    fechaVenta: new Date().toISOString().split("T")[0], // Fecha actual en formato YYYY-MM-DD
    categoria: "",
    subcategoria: "",
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchInversiones = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/api/inversiones`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
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

    // Si el usuario introduce el "precioCompra", actualizamos automáticamente otros campos
    if (name === "precioCompra") {
      setFormData((prevFormData) => ({
        ...prevFormData,
        [name]: value,
        precioActual: value, // Completar precioActual con el precioCompra
        precioVenta: value, // Completar precioVenta con el precioCompra
      }));
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Agregar una nueva inversión
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/inversiones`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInversiones([...inversiones, response.data]);
      setFormData({
        nombre: "",
        montoActual: 0,
        precioCompra: 0,
        precioActual: 0,
        fechaCompra: new Date().toISOString().split("T")[0], // Restablecer a la fecha actual
        precioVenta: 0,
        fechaVenta: new Date().toISOString().split("T")[0], // Restablecer a la fecha actual
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
      await axios.delete(
        `${process.env.REACT_APP_BACKEND_URL}/api/inversiones/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInversiones(inversiones.filter((inv) => inv._id !== id));
    } catch (error) {
      console.error("Error al eliminar la inversión:", error);
    }
  };

  return (
    <div className="inversiones-container">
      <h1>Gestión de Inversiones</h1>
      <table className="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Monto Actual</th>
            <th>Precio de Compra</th>
            <th>Precio Actual</th>
            <th>Fecha de Compra</th>
            <th>Precio de Venta</th>
            <th>Fecha de Venta</th>
            <th>Categoría</th>
            <th>Subcategoría</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {/* Fila para crear nueva inversión */}
          <tr>
            <td>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Nombre"
                required
              />
            </td>
            <td>
              <input
                type="number"
                name="montoActual"
                value={formData.montoActual}
                onChange={handleChange}
                placeholder="Monto Actual"
                required
              />
            </td>
            <td>
              <input
                type="number"
                name="precioCompra"
                value={formData.precioCompra}
                onChange={handleChange}
                placeholder="Precio de Compra"
                required
              />
            </td>
            <td>
              <input
                type="number"
                name="precioActual"
                value={formData.precioActual}
                onChange={handleChange}
                placeholder="Precio Actual"
              />
            </td>
            <td>
              <input
                type="date"
                name="fechaCompra"
                value={formData.fechaCompra}
                onChange={handleChange}
                required
              />
            </td>
            <td>
              <input
                type="number"
                name="precioVenta"
                value={formData.precioVenta}
                onChange={handleChange}
                placeholder="Precio de Venta"
              />
            </td>
            <td>
              <input
                type="date"
                name="fechaVenta"
                value={formData.fechaVenta}
                onChange={handleChange}
              />
            </td>
            <td>
              <input
                type="text"
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
                placeholder="Categoría"
                required
              />
            </td>
            <td>
              <input
                type="text"
                name="subcategoria"
                value={formData.subcategoria}
                onChange={handleChange}
                placeholder="Subcategoría"
                required
              />
            </td>
            <td>
              <button onClick={handleSubmit} className="agregar">
                Agregar
              </button>
            </td>
          </tr>

          {/* Mostrar inversiones creadas */}
          {inversiones.map((inv) => (
            <tr key={inv._id}>
              <td>{inv.nombre}</td>
              <td>{inv.montoActual}</td>
              <td>{inv.precioCompra}</td>
              <td>{inv.precioActual}</td>
              <td>{inv.fechaCompra.split("T")[0]}</td>
              <td>{inv.precioVenta}</td>
              <td>{inv.fechaVenta.split("T")[0]}</td>
              <td>{inv.categoria}</td>
              <td>{inv.subcategoria}</td>
              <td>
                <button onClick={() => handleDelete(inv._id)} className="eliminar">
                  Eliminar
                </button>
                <button className="editar">Editar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Inversiones;
