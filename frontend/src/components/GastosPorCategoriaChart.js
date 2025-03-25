import React, { useEffect, useState } from 'react';
import { 
  PieChart, 
  Pie, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  Legend
} from 'recharts';
import axios from 'axios';
import '../styles/GastosPorCategoriaChart.css';

const COLORS = [
  '#4CAF50', '#66BB6A', '#81C784', '#A5D6A7', 
  '#C8E6C9', '#388E3C', '#2E7D32', '#1B5E20',
  '#FF9800', '#FFA726', '#FFB74D', '#FFCC80',
  '#F57C00', '#E65100', '#FF5722', '#E64A19'
];

const GastosPorCategoriaChart = ({ portafolioId }) => {
    const [gastosPorCategoria, setGastosPorCategoria] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState(null);
    const [hiddenCategories, setHiddenCategories] = useState([]);

    useEffect(() => {
        const fetchGastosPorCategoria = async () => {
            const token = localStorage.getItem("token");
            if (!token) return;

            try {
                const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/movimientos/${portafolioId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const movimientos = response.data;
                const gastosPorCategoriaTemp = {};

                movimientos.forEach(movimiento => {
                    if (movimiento.tipo === 'gasto') {
                        if (!movimiento.categoria || movimiento.categoria.length === 0) {
                            gastosPorCategoriaTemp["Sin Categoría"] = 
                                (gastosPorCategoriaTemp["Sin Categoría"] || 0) + movimiento.monto;
                        } else {
                            movimiento.categoria.forEach(cat => {
                                gastosPorCategoriaTemp[cat] = 
                                    (gastosPorCategoriaTemp[cat] || 0) + movimiento.monto;
                            });
                        }
                    }
                });

                const data = Object.keys(gastosPorCategoriaTemp)
                  .map(cat => ({
                    categoria: cat,
                    monto: gastosPorCategoriaTemp[cat],
                  }))
                  .sort((a, b) => b.monto - a.monto);
                
                setGastosPorCategoria(data);
            } catch (error) {
                console.error("Error al obtener gastos por categoría:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchGastosPorCategoria();
    }, [portafolioId]);

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const percentage = (payload[0].value / 
              gastosPorCategoria.reduce((sum, item) => sum + item.monto, 0)) * 100;
            
            return (
                <div className="portfolio-chart-tooltip">
                    <p className="portfolio-chart-tooltip-label">{data.categoria}</p>
                    <p className="portfolio-chart-tooltip-value">
                        ${payload[0].value.toFixed(2)} ({percentage.toFixed(1)}%)
                    </p>
                </div>
            );
        }
        return null;
    };

    const handlePieEnter = (_, index) => {
        setActiveIndex(index);
    };

    const handlePieLeave = () => {
        setActiveIndex(null);
    };

    const toggleCategory = (category) => {
        setHiddenCategories(prev => 
          prev.includes(category) 
            ? prev.filter(c => c !== category) 
            : [...prev, category]
        );
    };

    const filteredData = gastosPorCategoria.filter(
      item => !hiddenCategories.includes(item.categoria)
    );

    const renderCustomizedLabel = ({
        cx,
        cy,
        midAngle,
        innerRadius,
        outerRadius,
        percent,
        index,
        categoria
    }) => {
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text
                x={x}
                y={y}
                fill="white"
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={12}
                fontWeight="bold"
            >
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    if (loading) {
        return (
            <div className="portfolio-categories-chart">
                <h3 className="portfolio-categories-title">Distribución de Gastos</h3>
                <div className="portfolio-chart-loading">
                    Cargando datos del gráfico...
                </div>
            </div>
        );
    }

    if (gastosPorCategoria.length === 0) {
        return (
            <div className="portfolio-categories-chart">
                <h3 className="portfolio-categories-title">Distribución de Gastos</h3>
                <div className="portfolio-no-data">
                    No hay datos de gastos disponibles para mostrar
                </div>
            </div>
        );
    }

    return (
        <div className="portfolio-categories-chart portfolio-chart-animate">
            <h3 className="portfolio-categories-title">Distribución de Gastos</h3>
            
            <div className="portfolio-chart-wrapper">
                <div className="portfolio-chart-container">
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={filteredData}
                                dataKey="monto"
                                nameKey="categoria"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                innerRadius={40}
                                fill="#8884d8"
                                label={renderCustomizedLabel}
                                labelLine={false}
                                animationBegin={100}
                                animationDuration={800}
                                animationEasing="ease-out"
                                onMouseEnter={handlePieEnter}
                                onMouseLeave={handlePieLeave}
                                activeIndex={activeIndex}
                                activeShape={{
                                    outerRadius: 90,
                                    fillOpacity: 0.8
                                }}
                            >
                                {filteredData.map((entry, index) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={COLORS[index % COLORS.length]} 
                                        stroke="#fff"
                                        strokeWidth={1}
                                    />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="portfolio-chart-legend">
                {gastosPorCategoria.map((entry, index) => (
                    <div 
                        key={`legend-${index}`}
                        className="portfolio-legend-item"
                        onClick={() => toggleCategory(entry.categoria)}
                        style={{
                            opacity: hiddenCategories.includes(entry.categoria) ? 0.5 : 1
                        }}
                    >
                        <div 
                            className="portfolio-legend-color"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="portfolio-legend-text">
                            {entry.categoria}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GastosPorCategoriaChart;