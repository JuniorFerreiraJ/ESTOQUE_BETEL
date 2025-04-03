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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 pb-4 border-b">
          <h2 className="text-2xl font-semibold text-gray-800">
            {editItem ? 'Editar Item' : 'Adicionar Item'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Item
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 transition-colors duration-200"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoria
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 transition-colors duration-200"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Departamento
              </label>
              <select
                value={formData.department_id}
                onChange={(e) => setFormData(prev => ({ ...prev, department_id: e.target.value }))}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 transition-colors duration-200"
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

            {!editItem ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantidade Inicial
                </label>
                <input
                  type="number"
                  value={formData.current_quantity}
                  onChange={(e) => handleNumberChange(e, 'current_quantity')}
                  min="0"
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 transition-colors duration-200"
                />
              </div>
            ) : null}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantidade Mínima
              </label>
              <input
                type="number"
                value={formData.minimum_quantity}
                onChange={(e) => handleNumberChange(e, 'minimum_quantity')}
                min="0"
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 transition-colors duration-200"
              />
            </div>
          </div>

          {editItem && (
            <div className="mt-8 pt-6 border-t">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Movimentação de Estoque
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2">
                  <div className="flex items-center space-x-4 mb-4 bg-gray-50 p-3 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setStockMovement(prev => ({ ...prev, type: 'entrada' }))}
                      className={`flex-1 flex items-center justify-center px-4 py-2.5 rounded-lg font-medium transition-colors duration-200 ${
                        stockMovement.type === 'entrada'
                          ? 'bg-green-500 text-white shadow-sm'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Entrada
                    </button>
                    <button
                      type="button"
                      onClick={() => setStockMovement(prev => ({ ...prev, type: 'saída' }))}
                      className={`flex-1 flex items-center justify-center px-4 py-2.5 rounded-lg font-medium transition-colors duration-200 ${
                        stockMovement.type === 'saída'
                          ? 'bg-red-500 text-white shadow-sm'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <Minus className="h-5 w-5 mr-2" />
                      Saída
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantidade
                  </label>
                  <input
                    type="number"
                    value={stockMovement.quantity}
                    onChange={(e) => handleNumberChange(e, 'quantity')}
                    min="0"
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 transition-colors duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Usuário
                  </label>
                  <input
                    type="text"
                    value={stockMovement.user_name}
                    onChange={(e) => setStockMovement(prev => ({ ...prev, user_name: e.target.value }))}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 transition-colors duration-200"
                    placeholder="Digite seu nome"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observação
                  </label>
                  <textarea
                    value={stockMovement.observation}
                    onChange={(e) => setStockMovement(prev => ({ ...prev, observation: e.target.value }))}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 transition-colors duration-200"
                    rows={3}
                    placeholder="Adicione uma observação sobre esta movimentação"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors duration-200"
            >
              {editItem ? 'Salvar Alterações' : 'Adicionar Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}