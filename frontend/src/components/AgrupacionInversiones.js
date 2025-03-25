import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/AgrupacionInversiones.css";

const GroupedInvestments = () => {
  const [investments, setInvestments] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchInvestments = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/api/inversiones`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setInvestments(response.data);
      } catch (error) {
        console.error("Error al obtener inversiones:", error);
      }
    };
    fetchInvestments();
  }, []);

  const groupedInvestments = investments.reduce((acc, inv) => {
    if (!acc[inv.categoria]) {
      acc[inv.categoria] = {};
    }
    if (!acc[inv.categoria][inv.subcategoria]) {
      acc[inv.categoria][inv.subcategoria] = [];
    }
    acc[inv.categoria][inv.subcategoria].push(inv);
    return acc;
  }, {});

  return (
    <div>
      <h1>Inversiones Agrupadas</h1>
      {Object.entries(groupedInvestments).map(([categoria, subcategorias]) => (
        <div key={categoria}>
          <h2>{categoria}</h2>
          {Object.entries(subcategorias).map(([subcategoria, inversiones]) => (
            <div key={subcategoria}>
              <h3>{subcategoria}</h3>
              <ul>
                {inversiones.map((inv) => (
                  <li key={inv._id}>
                    {inv.nombre}: {inv.montoActual}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default GroupedInvestments;
