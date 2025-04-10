import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface DepartmentDistributionChartProps {
    data: {
        name: string;
        value: number;
    }[];
}

const COLORS = [
    '#10B981', // verde do sistema
    '#60a5fa', // azul suave
    '#fbbf24', // amarelo suave
];

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white px-4 py-3 rounded-xl shadow-lg border border-gray-100">
                <p className="text-sm font-medium text-gray-800">
                    {data.name}
                </p>
                <p className="text-lg font-semibold text-gray-900">
                    {((data.value / payload[0].payload.total) * 100).toFixed(0)}%
                </p>
                <p className="text-xs text-gray-500">
                    {data.value} itens
                </p>
            </div>
        );
    }
    return null;
};

export default function DepartmentDistributionChart({ data }: DepartmentDistributionChartProps) {
    const sortedData = [...data].sort((a, b) => b.value - a.value);
    const total = sortedData.reduce((sum, item) => sum + item.value, 0);
    const dataWithTotal = sortedData.map(item => ({
        ...item,
        total,
        percentage: ((item.value / total) * 100).toFixed(0)
    }));

    return (
        <div className="w-full h-full">
            <div className="h-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={dataWithTotal}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={130}
                            fill="#8884d8"
                            label={({ name, percentage }) => `${name} (${percentage}%)`}
                            labelLine={true}
                            animationBegin={0}
                            animationDuration={1000}
                            animationEasing="ease-out"
                        >
                            {dataWithTotal.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[index % COLORS.length]}
                                    strokeWidth={1}
                                    stroke="#fff"
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            content={<CustomTooltip />}
                            wrapperStyle={{ outline: 'none' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
} 