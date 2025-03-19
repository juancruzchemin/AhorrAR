import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Tooltip, Cell } from 'recharts';
import axios from 'axios';
import '../styles/GastosPorCategoriaChart.css';

const COLORS = ['#4CAF50', '#66BB6A', '#81C784', '#A5D6A7', '#C8E6C9', '#388E3C', '#2E7D32', '#1B5E20'];

const GastosPorCategoriaChart = ({ portafolioId }) => {
    const [gastosPorCategoria, setGastosPorCategoria] = useState([]);

    useEffect(() => {
        const fetchGastosPorCategoria = async () => {
            const token = localStorage.getItem("token");
            if (!token) return;

            try {
                const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/movimientos/${portafolioId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const movimientos = response.data;

                const gastosPorCategoriaTemp = {};
                movimientos.forEach(movimiento => {
                    if (movimiento.tipo === 'gasto') {
                        movimiento.categoria.forEach(cat => {
                            gastosPorCategoriaTemp[cat] = (gastosPorCategoriaTemp[cat] || 0) + movimiento.monto;
                        });
                    }
                });

                const data = Object.keys(gastosPorCategoriaTemp).map(cat => ({
                    categoria: cat,
                    monto: gastosPorCategoriaTemp[cat],
                }));
                setGastosPorCategoria(data);
            } catch (error) {
                console.error("Error al obtener gastos por categoría:", error);
            }
        };

        fetchGastosPorCategoria();
    }, [portafolioId]);

    return (
        <div className="gastos-por-categoria-chart-container">
            <h3>Distribución de Gastos por Categoría</h3>
            <PieChart width={500} height={300}>
                <Pie
                    data={gastosPorCategoria}
                    dataKey="monto"
                    nameKey="categoria"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    label={({ categoria }) => `${categoria}`} // Mostrar categoría y monto dentro del gráfico
                    labelLine={false} // Opcional: Oculta la línea que conecta la etiqueta con el segmento
                >
                    {
                        gastosPorCategoria.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))
                    }
                </Pie>
                <Tooltip
                    formatter={(value) => `$${value.toFixed(2)}`} // Tooltip con 2 decimales
                />
            </PieChart>
        </div>
    );
};

export default GastosPorCategoriaChart;