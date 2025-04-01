import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface DepartmentDistributionProps {
  items: {
    id: string;
    name: string;
    department_id: string;
  }[];
  departments: {
    id: string;
    name: string;
  }[];
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function DepartmentDistribution({ items, departments }: DepartmentDistributionProps) {
  const departmentData = useMemo(() => {
    const deptMap = new Map<string, { id: string, name: string, count: number }>();
    
    // Initialize with all departments
    departments.forEach(dept => {
      deptMap.set(dept.id, { id: dept.id, name: dept.name, count: 0 });
    });
    
    // Count items per department
    items.forEach(item => {
      if (item.department_id) {
        const dept = deptMap.get(item.department_id);
        if (dept) {
          dept.count += 1;
        }
      }
    });
    
    // Convert to array and filter out empty departments
    return Array.from(deptMap.values())
      .filter(dept => dept.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [items, departments]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-md shadow-md border border-gray-200">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-sm">
            <span className="font-semibold">{payload[0].value}</span> itens
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-lg font-semibold mb-4">Distribuição por Departamento</h2>
      <div className="h-[200px]">
        {departmentData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={departmentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                dataKey="count"
                nameKey="name"
              >
                {departmentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend layout="vertical" align="right" verticalAlign="middle" />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            Nenhum dado disponível
          </div>
        )}
      </div>
    </div>
  );
}