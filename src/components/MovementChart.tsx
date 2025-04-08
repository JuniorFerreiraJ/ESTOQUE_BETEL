import React, { useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface MovementData {
    month: string;
    entrada: number;
    saida: number;
    total: number;
}

interface MovementChartProps {
    data: MovementData[];
}

const MovementChart: React.FC<MovementChartProps> = ({ data }) => {
    const chartRef = useRef<any>(null);

    useEffect(() => {
        if (chartRef.current) {
            const chart = chartRef.current;
            const ctx = chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 400);
            gradient.addColorStop(0, 'rgba(34, 197, 94, 0.2)');
            gradient.addColorStop(1, 'rgba(34, 197, 94, 0)');

            chart.data.datasets[0].backgroundColor = gradient;
            chart.update();
        }
    }, [data]);

    const chartData = {
        labels: data.map(item => item.month),
        datasets: [
            {
                label: 'Entrada',
                data: data.map(item => item.entrada),
                borderColor: 'rgb(34, 197, 94)',
                backgroundColor: 'rgba(34, 197, 94, 0.2)',
                tension: 0.4,
                fill: true,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: 'rgb(34, 197, 94)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
            },
            {
                label: 'Saída',
                data: data.map(item => item.saida),
                borderColor: 'rgb(239, 68, 68)',
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                tension: 0.4,
                fill: true,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: 'rgb(239, 68, 68)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
            },
            {
                label: 'Total',
                data: data.map(item => item.total),
                borderColor: 'rgb(99, 102, 241)',
                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                tension: 0.4,
                fill: true,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: 'rgb(99, 102, 241)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 2000,
            easing: 'easeInOutQuart' as const
        },
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    usePointStyle: true,
                    padding: 20,
                    font: {
                        size: 12,
                        family: 'Inter, sans-serif'
                    }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                titleColor: '#1f2937',
                bodyColor: '#1f2937',
                borderColor: '#e5e7eb',
                borderWidth: 1,
                padding: 12,
                boxPadding: 4,
                usePointStyle: true,
                callbacks: {
                    label: function (context: any) {
                        return `${context.dataset.label}: ${context.parsed.y}`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)',
                    drawBorder: false
                },
                ticks: {
                    font: {
                        family: 'Inter, sans-serif'
                    }
                }
            },
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    font: {
                        family: 'Inter, sans-serif'
                    }
                }
            }
        }
    };

    return (
        <div className="h-[300px] w-full">
            <Line
                ref={chartRef}
                data={chartData}
                options={options}
            />
        </div>
    );
};

export default MovementChart; 