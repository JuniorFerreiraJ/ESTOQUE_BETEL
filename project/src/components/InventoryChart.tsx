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

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Visão Geral do Estoque</h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-sm text-gray-600">Quantidade Atual</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-sm text-gray-600">Quantidade Mínima</span>
            </div>
          </div>
        </div>

        <div className="h-[600px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sortedData}
              layout="vertical"
              margin={{ top: 20, right: 30, left: 150, bottom: 20 }}
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
                dataKey="name"
                type="category"
                tick={{ fill: '#666', fontSize: 12 }}
                width={140}
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
        </div>
      </div>
    </div>
  );
}