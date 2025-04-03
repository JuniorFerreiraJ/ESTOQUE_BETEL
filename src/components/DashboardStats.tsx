import React from 'react';
import { Package, AlertTriangle, ArrowUp } from 'lucide-react';

interface DashboardStatsProps {
  items: {
    id: string;
    name: string;
    current_quantity: number;
    minimum_quantity: number;
  }[];
}

export default function DashboardStats({ items }: DashboardStatsProps) {
  const totalItems = items.length;
  const totalStock = items.reduce((sum, item) => sum + item.current_quantity, 0);
  const lowStockItems = items.filter(item => item.current_quantity <= item.minimum_quantity);
  const lowStockCount = lowStockItems.length;
  const lowStockPercentage = totalItems > 0 ? Math.round((lowStockCount / totalItems) * 100) : 0;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-lg font-semibold mb-4">Resumo do Estoque</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 mr-4">
              <Package className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-green-600 font-medium">Total de Itens</p>
              <p className="text-2xl font-bold text-green-800">{totalItems}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 mr-4">
              <ArrowUp className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-blue-600 font-medium">Quantidade Total</p>
              <p className="text-2xl font-bold text-blue-800">{totalStock}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 mr-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-red-600 font-medium">Estoque Baixo</p>
              <p className="text-2xl font-bold text-red-800">{lowStockCount} <span className="text-sm font-normal">({lowStockPercentage}%)</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}