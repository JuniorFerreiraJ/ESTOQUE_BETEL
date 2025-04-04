import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Pencil, Trash2, X, Eye } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface HistoryItem {
  id: string;
  item_name: string;
  quantity_changed: number;
  type: 'entrada' | 'saída';
  observation: string;
  created_at: string;
  department_id: string;
  departments: {
    name: string;
  } | null;
  user_name: string;
}

interface InventoryHistoryProps {
  history: HistoryItem[];
  onUpdate: () => void;
}

export default function InventoryHistory({ history, onUpdate }: InventoryHistoryProps) {
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [editingItem, setEditingItem] = useState<HistoryItem | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('InventoryHistory recebeu histórico:', history);
    if (!history || history.length === 0) {
      setError('Nenhum histórico encontrado');
    } else {
      setError(null);
    }
  }, [history]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('inventory_history').delete().eq('id', id);
      if (error) throw error;
      setDeleteConfirmation(null);
      onUpdate();
    } catch (error) {
      console.error('Error deleting history item:', error);
      setError('Erro ao excluir item do histórico');
    }
  };

  const handleEdit = async (item: HistoryItem) => {
    try {
      const { error } = await supabase
        .from('inventory_history')
        .update({
          observation: item.observation
        })
        .eq('id', item.id);
      
      if (error) throw error;
      setEditingItem(null);
      onUpdate();
    } catch (error) {
      console.error('Error updating history item:', error);
      setError('Erro ao atualizar item do histórico');
    }
  };

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {history && history.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Departamento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantidade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Responsável
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Observação
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {history.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(item.created_at), 'dd/MM/yyyy HH:mm')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.item_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.departments?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.type === 'entrada'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {item.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.quantity_changed}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.user_name || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {editingItem?.id === item.id ? (
                      <input
                        type="text"
                        className="w-full px-2 py-1 border rounded-md"
                        value={editingItem.observation}
                        onChange={(e) =>
                          setEditingItem({ ...editingItem, observation: e.target.value })
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleEdit(editingItem);
                          } else if (e.key === 'Escape') {
                            setEditingItem(null);
                          }
                        }}
                      />
                    ) : (
                      item.observation || '-'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="text-gray-400 hover:text-gray-500"
                        title="Visualizar"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditingItem(item)}
                        className="text-blue-400 hover:text-blue-500"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmation(item.id)}
                        className="text-red-400 hover:text-red-500"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-4 text-center text-gray-500">
          Nenhum histórico encontrado
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Confirmar Exclusão
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Tem certeza que deseja excluir este item do histórico?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmation(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmation)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Detalhes do Histórico
              </h3>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Item
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedItem.item_name}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Departamento
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedItem.departments?.name || '-'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Tipo de Movimentação
                </label>
                <p className="mt-1 text-sm">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedItem.type === 'entrada'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {selectedItem.type}
                  </span>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Quantidade
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedItem.quantity_changed}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Responsável
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedItem.user_name || '-'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Observação
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedItem.observation || '-'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Data e Hora
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {format(new Date(selectedItem.created_at), 'dd/MM/yyyy HH:mm')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}