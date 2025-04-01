import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface InventoryChartProps {
  data: {
    name: string;
    current_quantity: number;
    minimum_quantity: number;
  }[];
}

const getItemStatus = (name: string, current: number, minimum: number) => {
  if (current <= minimum) {
    return `⚠️ ${name} está com estoque baixo (Mínimo: ${minimum})`;
  }
  if (current >= minimum * 2) {
    return `✅ ${name} está com estoque adequado`;
  }
  return `ℹ️ ${name} está próximo do estoque mínimo`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const current = payload[0].payload.current_quantity;
    const minimum = payload[0].payload.minimum_quantity;

    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
        <p className="font-semibold text-gray-900 mb-2">{label}</p>
        <div className="space-y-2">
          <p className="text-sm">
            <span className="font-medium text-green-600">Quantidade Atual:</span>{' '}
            {current}
          </p>
          <p className="text-sm">
            <span className="font-medium text-red-600">Quantidade Mínima:</span>{' '}
            {minimum}
          </p>
          <p className="text-sm text-gray-600 border-t pt-2 mt-2">
            {getItemStatus(label, current, minimum)}
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export default function InventoryChart({ data }: InventoryChartProps) {
  // Prepare data by sorting it by current quantity in descending order
  const sortedData = [...data]
    .sort((a, b) => b.current_quantity - a.current_quantity)
    .map(item => ({
      ...item,
      name: item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name
    }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={sortedData}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 20
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="name" hide />
        <YAxis
          tick={{ fill: '#666', fontSize: 12 }}
          label={{
            value: 'Quantidade',
            angle: -90,
            position: 'insideLeft',
            style: { fill: '#666' }
          }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar
          dataKey="current_quantity"
          name="Quantidade Atual"
          fill="#10b981"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="minimum_quantity"
          name="Quantidade Mínima"
          fill="#ef4444"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}