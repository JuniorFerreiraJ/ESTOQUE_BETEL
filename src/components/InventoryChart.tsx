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
  ReferenceLine
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
    const percentage = ((current / minimum) * 100).toFixed(1);

    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
        <p className="font-semibold text-gray-900 mb-2">{label}</p>
        <div className="space-y-2">
          <p className="text-sm">
            <span className="font-medium text-green-600">Quantidade Atual:</span>{' '}
            <span className="font-semibold">{current}</span>
          </p>
          <p className="text-sm">
            <span className="font-medium text-red-600">Quantidade Mínima:</span>{' '}
            <span className="font-semibold">{minimum}</span>
          </p>
          <p className="text-sm">
            <span className="font-medium text-blue-600">Porcentagem:</span>{' '}
            <span className="font-semibold">{percentage}%</span>
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
    .slice(0, 10) // Mostrar apenas os 10 itens com maior quantidade
    .map(item => ({
      ...item,
      name: item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name
    }));

  // Calcular a média de quantidade mínima para a linha de referência
  const averageMinimum = data.reduce((acc, item) => acc + item.minimum_quantity, 0) / data.length;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={sortedData}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="name"
          hide
        />
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
        <Legend
          formatter={(value, entry: any) => (
            <span className="text-sm text-gray-600">{value}</span>
          )}
        />
        <ReferenceLine
          y={averageMinimum}
          stroke="#ef4444"
          strokeDasharray="3 3"
          label={{
            value: 'Média Mínima',
            position: 'right',
            fill: '#ef4444',
            fontSize: 12
          }}
        />
        <Bar
          dataKey="current_quantity"
          name="Quantidade Atual"
          fill="#10b981"
          radius={[4, 4, 0, 0]}
          animationDuration={1000}
          animationBegin={0}
        />
        <Bar
          dataKey="minimum_quantity"
          name="Quantidade Mínima"
          fill="#ef4444"
          radius={[4, 4, 0, 0]}
          animationDuration={1000}
          animationBegin={0}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}