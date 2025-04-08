import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, Label } from 'recharts';

interface DepartmentDistributionProps {
  items: {
    id: string;
    name: string;
    department_id: string;
    current_quantity: number;
  }[];
  departments: {
    id: string;
    name: string;
  }[];
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function DepartmentDistribution({ items, departments }: DepartmentDistributionProps) {
  const departmentData = useMemo(() => {
    const deptMap = new Map<string, { id: string, name: string, count: number, totalQuantity: number }>();

    // Initialize with all departments
    departments.forEach(dept => {
      deptMap.set(dept.id, { id: dept.id, name: dept.name, count: 0, totalQuantity: 0 });
    });

    // Count items and total quantity per department
    items.forEach(item => {
      if (item.department_id) {
        const dept = deptMap.get(item.department_id);
        if (dept) {
          dept.count += 1;
          dept.totalQuantity += item.current_quantity;
        }
      }
    });

    // Convert to array and filter out empty departments
    return Array.from(deptMap.values())
      .filter(dept => dept.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [items, departments]);

  const totalItems = items.length;
  const totalQuantity = items.reduce((acc, item) => acc + item.current_quantity, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = ((data.count / totalItems) * 100).toFixed(1);
      const quantityPercentage = ((data.totalQuantity / totalQuantity) * 100).toFixed(1);

      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900 mb-2">{data.name}</p>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium text-gray-600">Itens:</span>{' '}
              <span className="font-semibold">{data.count}</span>
              <span className="text-gray-500 ml-1">({percentage}%)</span>
            </p>
            <p className="text-sm">
              <span className="font-medium text-gray-600">Quantidade Total:</span>{' '}
              <span className="font-semibold">{data.totalQuantity}</span>
              <span className="text-gray-500 ml-1">({quantityPercentage}%)</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const renderCustomizedLabel = ({ cx, cy }: any) => {
    return (
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        className="text-sm font-semibold text-gray-600"
      >
        Total de Itens
      </text>
    );
  };

  return (
    <div className="h-full">
      {departmentData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={departmentData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              innerRadius={60}
              paddingAngle={2}
              dataKey="count"
              nameKey="name"
              label={CustomLabel}
              animationDuration={1000}
              animationBegin={0}
            >
              {departmentData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  stroke="#fff"
                  strokeWidth={2}
                />
              ))}
              <Label content={renderCustomizedLabel} position="center" />
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              formatter={(value, entry: any) => (
                <span className="text-sm text-gray-600">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-full flex items-center justify-center text-gray-500">
          Nenhum dado disponível
        </div>
      )}
    </div>
  );
}