import React, { useState, useEffect } from 'react';
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
    observation: '',
    user_name: ''
  });

  const [error, setError] = useState('');

  // Reset form when modal opens/closes or editItem changes
  useEffect(() => {
    if (isOpen && editItem) {
      setFormData({
        name: editItem.name || '',
        category_id: editItem.category_id || '',
        department_id: editItem.department_id || '',
        current_quantity: editItem.current_quantity ?? 0,
        minimum_quantity: editItem.minimum_quantity ?? 0
      });
    } else if (!isOpen) {
      // Reset form when modal closes
      setFormData({
        name: '',
        category_id: '',
        department_id: '',
        current_quantity: 0,
        minimum_quantity: 0
      });
      setStockMovement({
        quantity: 0,
        type: 'entrada',
        observation: '',
        user_name: ''
      });
      setError('');
    }
  }, [isOpen, editItem]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      console.log('Iniciando operação de salvamento...', {
        formData,
        stockMovement,
        editItem: editItem ? editItem.id : 'novo'
      });

      if (!formData.name || !formData.category_id || !formData.department_id) {
        setError('Por favor, preencha todos os campos obrigatórios');
        return;
      }

      if (editItem) {
        let newQuantity = formData.current_quantity;

        if (stockMovement.quantity > 0) {
          console.log('Processando movimentação:', {
            tipo: stockMovement.type,
            quantidade: stockMovement.quantity,
            quantidadeAtual: formData.current_quantity
          });

          newQuantity = stockMovement.type === 'entrada'
            ? formData.current_quantity + stockMovement.quantity
            : formData.current_quantity - stockMovement.quantity;

          console.log('Nova quantidade calculada:', newQuantity);

          if (newQuantity < 0) {
            setError('A quantidade não pode ficar negativa');
            return;
          }

          // Primeiro registra o histórico
          const { error: historyError } = await supabase
            .from('inventory_history')
            .insert({
              item_name: formData.name,
              quantity_changed: stockMovement.quantity,
              type: stockMovement.type,
              observation: stockMovement.observation || 'Movimentação de estoque',
              department_id: formData.department_id,
              user_name: stockMovement.user_name || 'Usuário do Sistema',
              created_at: new Date().toISOString()
            });

          if (historyError) {
            console.error('Erro ao registrar histórico:', historyError);
            throw historyError;
          }

          console.log('Histórico registrado com sucesso, atualizando item...');

          // Depois atualiza o item
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

          if (updateError) {
            console.error('Erro ao atualizar item:', updateError);
            throw updateError;
          }

          console.log('Item atualizado com sucesso');
        } else {
          // Se não há movimentação, apenas atualiza os dados do item
          const { error: updateError } = await supabase
            .from('inventory_items')
            .update({
              name: formData.name,
              category_id: formData.category_id,
              department_id: formData.department_id,
              minimum_quantity: formData.minimum_quantity,
              updated_at: new Date().toISOString()
            })
            .eq('id', editItem.id);

          if (updateError) {
            console.error('Erro ao atualizar item:', updateError);
            throw updateError;
          }
        }
      } else {
        // Criar novo item
        const { error: insertError } = await supabase
          .from('inventory_items')
          .insert({
            name: formData.name,
            category_id: formData.category_id,
            department_id: formData.department_id,
            current_quantity: formData.current_quantity,
            minimum_quantity: formData.minimum_quantity,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('Erro ao criar item:', insertError);
          throw insertError;
        }

        // Se houver quantidade inicial, registra no histórico
        if (formData.current_quantity > 0) {
          const { error: historyError } = await supabase
            .from('inventory_history')
            .insert({
              item_name: formData.name,
              quantity_changed: formData.current_quantity,
              type: 'entrada',
              observation: 'Quantidade inicial',
              department_id: formData.department_id,
              user_name: 'Usuário do Sistema',
              created_at: new Date().toISOString()
            });

          if (historyError) {
            console.error('Erro ao registrar histórico inicial:', historyError);
            throw historyError;
          }
        }
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Erro ao salvar:', err);
      setError('Erro ao salvar. Por favor, tente novamente.');
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const value = parseInt(e.target.value) || 0;
    if (field === 'current_quantity' || field === 'minimum_quantity') {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    } else if (field === 'quantity') {
      setStockMovement(prev => ({
        ...prev,
        quantity: value
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {editItem ? 'Editar Item' : 'Adicionar Item'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nome do Item
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Categoria
            </label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              required
            >
              <option value="">Selecione uma categoria</option>
              {categories.map(category => (
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
              value={formData.department_id}
              onChange={(e) => setFormData(prev => ({ ...prev, department_id: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              required
            >
              <option value="">Selecione um departamento</option>
              {departments.map(department => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </div>

          {!editItem && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Quantidade Inicial
              </label>
              <input
                type="number"
                value={formData.current_quantity}
                onChange={(e) => handleNumberChange(e, 'current_quantity')}
                min="0"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Quantidade Mínima
            </label>
            <input
              type="number"
              value={formData.minimum_quantity}
              onChange={(e) => handleNumberChange(e, 'minimum_quantity')}
              min="0"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            />
          </div>

          {editItem && (
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Movimentação de Estoque
              </h3>

              <div className="flex items-center space-x-4 mb-4">
                <button
                  type="button"
                  onClick={() => setStockMovement(prev => ({ ...prev, type: 'entrada' }))}
                  className={`flex items-center px-3 py-2 rounded-md ${
                    stockMovement.type === 'entrada'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Entrada
                </button>
                <button
                  type="button"
                  onClick={() => setStockMovement(prev => ({ ...prev, type: 'saída' }))}
                  className={`flex items-center px-3 py-2 rounded-md ${
                    stockMovement.type === 'saída'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  <Minus className="h-4 w-4 mr-1" />
                  Saída
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Quantidade
                </label>
                <input
                  type="number"
                  value={stockMovement.quantity}
                  onChange={(e) => handleNumberChange(e, 'quantity')}
                  min="0"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">
                  Observação
                </label>
                <textarea
                  value={stockMovement.observation}
                  onChange={(e) => setStockMovement(prev => ({ ...prev, observation: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  rows={3}
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">
                  Nome do Usuário
                </label>
                <input
                  type="text"
                  value={stockMovement.user_name}
                  onChange={(e) => setStockMovement(prev => ({ ...prev, user_name: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="text-red-600 text-sm mt-2">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              {editItem ? 'Salvar' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}