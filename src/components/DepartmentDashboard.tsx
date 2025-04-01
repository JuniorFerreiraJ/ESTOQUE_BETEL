import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

interface DepartmentDashboardProps {
  department: {
    id: string;
    name: string;
  };
  history: {
    id: string;
    item_name: string;
    quantity_changed: number;
    type: 'entrada' | 'saída';
    created_at: string;
    user_id: string;
  }[];
  items: {
    id: string;
    name: string;
    current_quantity: number;
    minimum_quantity: number;
  }[];
}

export default function DepartmentDashboard({ department, history, items }: DepartmentDashboardProps) {
  const { hasPermission } = useAuth();
  const canManage = hasPermission(department.id, 'manager');

  // Calculate movement statistics
  const movementStats = history.reduce((acc, curr) => {
    const date = format(new Date(curr.created_at), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = { date, entrada: 0, saída: 0 };
    }
    acc[date][curr.type] += curr.quantity_changed;
    return acc;
  }, {} as Record<string, { date: string; entrada: number; saída: number }>);

  const chartData = Object.values(movementStats).sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const lowStockItems = items.filter(item => 
    item.current_quantity <= item.minimum_quantity
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">
          Dashboard do Departamento: {department.name}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">Total de Itens</p>
            <p className="text-2xl font-bold text-blue-800">{items.length}</p>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-sm text-yellow-600 font-medium">Movimentações Hoje</p>
            <p className="text-2xl font-bold text-yellow-800">
              {history.filter(h => 
                format(new Date(h.created_at), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
              ).length}
            </p>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-sm text-red-600 font-medium">Itens com Estoque Baixo</p>
            <p className="text-2xl font-bold text-red-800">{lowStockItems.length}</p>
          </div>
        </div>

        <div className="h-[300px] mb-6">
          <h3 className="text-lg font-medium mb-4">Movimentação de Estoque</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="entrada" fill="#10b981" name="Entradas" />
              <Bar dataKey="saída" fill="#ef4444" name="Saídas" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {lowStockItems.length > 0 && (
          <div className="bg-red-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-red-700 mb-3">
              Alerta de Estoque Baixo
            </h3>
            <div className="space-y-2">
              {lowStockItems.map(item => (
                <div key={item.id} className="flex justify-between items-center p-2 bg-white rounded">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">
                      Atual: {item.current_quantity} | Mínimo: {item.minimum_quantity}
                    </p>
                  </div>
                  {canManage && (
                    <button className="px-3 py-1 text-sm text-white bg-red-600 rounded hover:bg-red-700">
                      Ajustar
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}