<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
=======
import React, { useState } from 'react';
>>>>>>> b99068829ebc5ecda03e92f55c1e81f8fe2619e7
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
<<<<<<< HEAD
    name: '',
    category_id: '',
    department_id: '',
    current_quantity: 0,
    minimum_quantity: 0
=======
    name: editItem?.name || '',
    category_id: editItem?.category_id || '',
    department_id: editItem?.department_id || '',
    current_quantity: editItem?.current_quantity ?? 0,
    minimum_quantity: editItem?.minimum_quantity ?? 0
>>>>>>> b99068829ebc5ecda03e92f55c1e81f8fe2619e7
  });

  const [stockMovement, setStockMovement] = useState({
    quantity: 0,
<<<<<<< HEAD
    type: 'entrada' as 'entrada' | 'saida',
    observation: '',
    user_name: ''
=======
    type: 'entrada' as 'entrada' | 'saída',
    observation: ''
>>>>>>> b99068829ebc5ecda03e92f55c1e81f8fe2619e7
  });

  const [error, setError] = useState('');

<<<<<<< HEAD
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

=======
>>>>>>> b99068829ebc5ecda03e92f55c1e81f8fe2619e7
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
<<<<<<< HEAD
      console.log('Iniciando operação de salvamento...', {
        formData,
        stockMovement,
        editItem: editItem ? editItem.id : 'novo'
      });

      if (!formData.name || !formData.category_id || !formData.department_id) {
        setError('Por favor, preencha todos os campos obrigatórios');
        return;
      }

=======
>>>>>>> b99068829ebc5ecda03e92f55c1e81f8fe2619e7
      if (editItem) {
        let newQuantity = formData.current_quantity;

        if (stockMovement.quantity > 0) {
<<<<<<< HEAD
          console.log('Processando movimentação:', {
            tipo: stockMovement.type,
            quantidade: stockMovement.quantity,
            quantidadeAtual: formData.current_quantity
          });

=======
>>>>>>> b99068829ebc5ecda03e92f55c1e81f8fe2619e7
          newQuantity = stockMovement.type === 'entrada'
            ? formData.current_quantity + stockMovement.quantity
            : formData.current_quantity - stockMovement.quantity;

<<<<<<< HEAD
          console.log('Nova quantidade calculada:', newQuantity);

=======
>>>>>>> b99068829ebc5ecda03e92f55c1e81f8fe2619e7
          if (newQuantity < 0) {
            setError('A quantidade não pode ficar negativa');
            return;
          }

<<<<<<< HEAD
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
=======
          // Atualiza o item
>>>>>>> b99068829ebc5ecda03e92f55c1e81f8fe2619e7
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

<<<<<<< HEAD
          if (updateError) {
            console.error('Erro ao atualizar item:', updateError);
            throw updateError;
          }

          console.log('Item atualizado com sucesso');
=======
          if (updateError) throw updateError;

          // Registra o histórico
          const { error: historyError } = await supabase
            .from('inventory_history')
            .insert([{
              item_name: formData.name,
              quantity_changed: stockMovement.quantity,
              type: stockMovement.type,
              observation: stockMovement.observation,
              department_id: formData.department_id
            }]);

          if (historyError) throw historyError;
>>>>>>> b99068829ebc5ecda03e92f55c1e81f8fe2619e7
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

<<<<<<< HEAD
          if (error) {
            console.error('Erro ao atualizar item:', error);
            throw error;
          }
        }
      }

      console.log('Operação concluída com sucesso');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar item:', error);
      setError(error.message || 'Erro ao salvar item. Por favor, tente novamente.');
=======
          if (error) throw error;
        }
      } else {
        // Criando novo item
        if (formData.current_quantity < 0) {
          setError('A quantidade inicial não pode ser negativa');
          return;
        }

        const { error: itemError, data: newItem } = await supabase
          .from('inventory_items')
          .insert([{
            name: formData.name,
            category_id: formData.category_id,
            department_id: formData.department_id,
            current_quantity: formData.current_quantity,
            minimum_quantity: formData.minimum_quantity,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (itemError) throw itemError;

        // Registra o histórico da criação inicial
        if (formData.current_quantity > 0) {
          const { error: historyError } = await supabase
            .from('inventory_history')
            .insert([{
              item_name: formData.name,
              quantity_changed: formData.current_quantity,
              type: 'entrada',
              observation: 'Estoque inicial',
              department_id: formData.department_id
            }]);

          if (historyError) throw historyError;
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar o item');
      console.error('Error saving item:', err);
>>>>>>> b99068829ebc5ecda03e92f55c1e81f8fe2619e7
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

<<<<<<< HEAD
  const handleClose = () => {
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-800">
            {editItem ? 'Editar Item' : 'Novo Item'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
=======
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
>>>>>>> b99068829ebc5ecda03e92f55c1e81f8fe2619e7
          >
            <X className="h-6 w-6" />
          </button>
        </div>

<<<<<<< HEAD
        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-center">
              <span className="flex-1">{error}</span>
              <button onClick={() => setError('')} className="ml-2">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} id="editForm" className="space-y-6">
            {/* Basic Information Section */}
            <div className="bg-white rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria
                  </label>
                  <select
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Departamento
                  </label>
                  <select
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantidade Mínima
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    value={formData.minimum_quantity}
                    onChange={(e) => handleNumberChange(e, 'minimum_quantity')}
                  />
                </div>
              </div>
            </div>

            {/* Stock Movement Section */}
            {editItem && (
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Movimentação de Estoque
                </h3>
                <div className="space-y-4">
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={() => setStockMovement(prev => ({ ...prev, type: 'entrada' }))}
                      className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium flex items-center justify-center space-x-2 transition-colors ${
                        stockMovement.type === 'entrada'
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <Plus className="h-5 w-5" />
=======
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
>>>>>>> b99068829ebc5ecda03e92f55c1e81f8fe2619e7
                      <span>Entrada</span>
                    </button>
                    <button
                      type="button"
<<<<<<< HEAD
                      onClick={() => setStockMovement(prev => ({ ...prev, type: 'saida' }))}
                      className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium flex items-center justify-center space-x-2 transition-colors ${
                        stockMovement.type === 'saida'
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <Minus className="h-5 w-5" />
=======
                      onClick={() => setStockMovement(prev => ({ ...prev, type: 'saída' }))}
                      className={`flex-1 py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center space-x-1 ${
                        stockMovement.type === 'saída'
                          ? 'bg-red-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300'
                      }`}
                    >
                      <Minus className="h-4 w-4" />
>>>>>>> b99068829ebc5ecda03e92f55c1e81f8fe2619e7
                      <span>Saída</span>
                    </button>
                  </div>

<<<<<<< HEAD
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantidade
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        value={stockMovement.quantity}
                        onChange={(e) => handleNumberChange(e, 'movement_quantity')}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Responsável
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        value={stockMovement.user_name}
                        onChange={(e) => setStockMovement(prev => ({ ...prev, user_name: e.target.value }))}
                        placeholder="Nome do responsável"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Observação
                    </label>
                    <textarea
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
=======
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
>>>>>>> b99068829ebc5ecda03e92f55c1e81f8fe2619e7
                      rows={3}
                      value={stockMovement.observation}
                      onChange={(e) => setStockMovement(prev => ({ ...prev, observation: e.target.value }))}
                      placeholder="Motivo da movimentação..."
                    />
                  </div>
                </div>
              </div>
<<<<<<< HEAD
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            {editItem ? 'Salvar' : 'Adicionar'}
          </button>
        </div>
=======

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
>>>>>>> b99068829ebc5ecda03e92f55c1e81f8fe2619e7
      </div>
    </div>
  );
}