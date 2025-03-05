import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Label
} from 'recharts';

interface InventoryChartProps {
  data: {
    name: string;
    current_quantity: number;
    minimum_quantity: number;
  }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
        <p className="font-semibold text-gray-900 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm flex items-center space-x-2">
            <span
              className="w-3 h-3 rounded-full inline-block"
              style={{ backgroundColor: entry.color }}
            />
            <span>
              {entry.name}: <strong>{entry.value}</strong>
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function InventoryChart({ data }: InventoryChartProps) {
  // Prepare data by sorting it by current quantity in descending order
  const sortedData = [...data].sort((a, b) => b.current_quantity - a.current_quantity);
  
  // Truncate long names for better display
  const processedData = sortedData.map(item => ({
    ...item,
    displayName: item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={processedData}
        layout="vertical"
        margin={{ top: 20, right: 30, left: 120, bottom: 20 }}
        barGap={8}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
        <XAxis type="number">
          <Label
            value="Quantidade"
            position="bottom"
            offset={-10}
            style={{ fill: '#666', fontSize: '14px' }}
          />
        </XAxis>
        <YAxis
          dataKey="displayName"
          type="category"
          tick={{ fill: '#666', fontSize: 12 }}
          width={110}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar
          dataKey="current_quantity"
          name="Quantidade Atual"
          fill="#10b981"
          radius={[0, 4, 4, 0]}
          maxBarSize={30}
        />
        <Bar
          dataKey="minimum_quantity"
          name="Quantidade Mínima"
          fill="#ef4444"
          radius={[0, 4, 4, 0]}
          maxBarSize={30}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}