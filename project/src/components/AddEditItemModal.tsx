import React, { useState } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface AddEditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: { id: string; name: string }[];
  departments: { id: string; name: string }[];
  editItem?: {
    id: string;
    name: string;
    category_id: string;
    department_id: string;
    current_quantity: number;
    minimum_quantity: number;
  };
}

export default function AddEditItemModal({
  isOpen,
  onClose,
  onSuccess,
  categories,
  departments,
  editItem
}: AddEditItemModalProps) {
  const [formData, setFormData] = useState({
    name: editItem?.name || '',
    category_id: editItem?.category_id || '',
    department_id: editItem?.department_id || '',
    current_quantity: editItem?.current_quantity ?? 0,
    minimum_quantity: editItem?.minimum_quantity ?? 0
  });

  const [stockMovement, setStockMovement] = useState({
    quantity: 0,
    type: 'entrada' as 'entrada' | 'saída',
    observation: ''
  });

  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (editItem) {
        let newQuantity = formData.current_quantity;

        if (stockMovement.quantity > 0) {
          newQuantity = stockMovement.type === 'entrada'
            ? formData.current_quantity + stockMovement.quantity
            : formData.current_quantity - stockMovement.quantity;

          if (newQuantity < 0) {
            setError('A quantidade não pode ficar negativa');
            return;
          }

          // Atualiza o item
          const { error: updateError } = await supabase
            .from('inventory_items')
            .update({
              name: formData.name,
              category_id: formData.category_id,
              department_id: formData.department_id,
              current_quantity: newQuantity,
              minimum_quantity: formData.minimum_quantity,
              updated_at: new Date().toISOString()
            })
            .eq('id', editItem.id);

          if (updateError) throw updateError;

          // Registra o histórico
          const { error: historyError } = await supabase
            .from('inventory_history')
            .insert([{
              item_name: formData.name,
              quantity_changed: stockMovement.quantity,
              type: stockMovement.type,
              observation: stockMovement.observation
            }]);

          if (historyError) throw historyError;
        } else {
          // Se não houver movimentação, apenas atualiza os dados do item
          const { error } = await supabase
            .from('inventory_items')
            .update({
              name: formData.name,
              category_id: formData.category_id,
              department_id: formData.department_id,
              minimum_quantity: formData.minimum_quantity,
              updated_at: new Date().toISOString()
            })
            .eq('id', editItem.id);

          if (error) throw error;
        }
      } else {
        // Criando novo item
        if (formData.current_quantity < 0) {
          setError('A quantidade inicial não pode ser negativa');
          return;
        }

        const { error } = await supabase
          .from('inventory_items')
          .insert([{
            name: formData.name,
            category_id: formData.category_id,
            department_id: formData.department_id,
            current_quantity: formData.current_quantity,
            minimum_quantity: formData.minimum_quantity,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (error) throw error;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar o item');
      console.error('Error saving item:', err);
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const value = parseInt(e.target.value || '0', 10);
    
    if (field === 'movement_quantity') {
      setStockMovement(prev => ({
        ...prev,
        quantity: isNaN(value) ? 0 : Math.max(0, value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: isNaN(value) ? 0 : Math.max(0, value)
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {editItem ? 'Editar Item' : 'Novo Item'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nome
            </label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Categoria
            </label>
            <select
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            >
              <option value="">Selecione uma categoria</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Departamento
            </label>
            <select
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              value={formData.department_id}
              onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
            >
              <option value="">Selecione um departamento</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </div>

          {!editItem ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Quantidade Inicial
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  value={formData.current_quantity}
                  onChange={(e) => handleNumberChange(e, 'current_quantity')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Quantidade Mínima
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  value={formData.minimum_quantity}
                  onChange={(e) => handleNumberChange(e, 'minimum_quantity')}
                />
              </div>
            </>
          ) : (
            <>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Movimentação de Estoque
                </h3>
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setStockMovement(prev => ({ ...prev, type: 'entrada' }))}
                      className={`flex-1 py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center space-x-1 ${
                        stockMovement.type === 'entrada'
                          ? 'bg-green-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300'
                      }`}
                    >
                      <Plus className="h-4 w-4" />
                      <span>Entrada</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStockMovement(prev => ({ ...prev, type: 'saída' }))}
                      className={`flex-1 py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center space-x-1 ${
                        stockMovement.type === 'saída'
                          ? 'bg-red-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300'
                      }`}
                    >
                      <Minus className="h-4 w-4" />
                      <span>Saída</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Quantidade
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                      value={stockMovement.quantity}
                      onChange={(e) => handleNumberChange(e, 'movement_quantity')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Observação
                    </label>
                    <textarea
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                      rows={3}
                      value={stockMovement.observation}
                      onChange={(e) => setStockMovement(prev => ({ ...prev, observation: e.target.value }))}
                      placeholder="Motivo da movimentação..."
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Quantidade Mínima
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  value={formData.minimum_quantity}
                  onChange={(e) => handleNumberChange(e, 'minimum_quantity')}
                />
              </div>
            </>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
            >
              {editItem ? 'Salvar' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}