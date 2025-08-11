import React, { useState, useEffect, useMemo } from 'react';
import { X, Minus, Package, AlertTriangle, User, FileText, Building, Tag, CheckCircle, ArrowRight, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface BulkExitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedItems: Array<{
    id: string;
    name: string;
    current_quantity: number;
    category_id: string;
    department_id: string;
    categories?: { name: string };
    departments?: { name: string };
  }>;
  onRemoveItem?: (itemId: string) => void; // Nova prop para remover itens
}

export default function BulkExitModal({
  isOpen,
  onClose,
  onSuccess,
  selectedItems,
  onRemoveItem
}: BulkExitModalProps) {
  const [formData, setFormData] = useState({
    user_name: '',
    observation: '',
    department_id: ''
  });

  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Criar lista única de departamentos para evitar duplicatas
  const uniqueDepartments = useMemo(() => {
    const deptMap = new Map();
    selectedItems.forEach(item => {
      if (item.department_id && item.departments?.name) {
        deptMap.set(item.department_id, item.departments.name);
      }
    });
    return Array.from(deptMap.entries()).map(([id, name]) => ({ id, name }));
  }, [selectedItems]);

  // Inicializar quantidades quando o modal abre
  useEffect(() => {
    if (isOpen && selectedItems.length > 0) {
      const initialQuantities: Record<string, number> = {};
      selectedItems.forEach(item => {
        initialQuantities[item.id] = 1; // Quantidade padrão 1
      });
      setItemQuantities(initialQuantities);
      
      // Usar o departamento do primeiro item como padrão
      if (selectedItems[0]?.department_id) {
        setFormData(prev => ({ ...prev, department_id: selectedItems[0].department_id }));
      }
    }
  }, [isOpen, selectedItems]);

  const handleQuantityChange = (itemId: string, quantity: number) => {
    const item = selectedItems.find(item => item.id === itemId);
    if (!item) return;

    // Validar se a quantidade não excede o estoque disponível
    if (quantity > item.current_quantity) {
      setError(`Quantidade para "${item.name}" não pode exceder o estoque disponível (${item.current_quantity})`);
      return;
    }

    if (quantity < 0) {
      setError('Quantidade não pode ser negativa');
      return;
    }

    setItemQuantities(prev => ({ ...prev, [itemId]: quantity }));
    setError(''); // Limpar erro quando corrigir
  };

  const handleRemoveItem = (itemId: string) => {
    if (onRemoveItem) {
      onRemoveItem(itemId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.user_name.trim()) {
      setError('Por favor, informe o nome do usuário');
      return;
    }

    if (!formData.department_id) {
      setError('Por favor, selecione um departamento');
      return;
    }

    // Validar se pelo menos um item tem quantidade > 0
    const hasValidQuantity = Object.values(itemQuantities).some(qty => qty > 0);
    if (!hasValidQuantity) {
      setError('Por favor, informe pelo menos uma quantidade para saída');
      return;
    }

    setLoading(true);

    try {
      // Processar cada item selecionado
      for (const item of selectedItems) {
        const quantity = itemQuantities[item.id] || 0;
        
        if (quantity > 0) {
          // Registrar no histórico
          const { error: historyError } = await supabase
            .from('inventory_history')
            .insert({
              item_name: item.name,
              quantity_changed: quantity,
              type: 'saída',
              observation: formData.observation || 'Saída em lote',
              department_id: formData.department_id,
              user_name: formData.user_name,
              created_at: new Date().toISOString()
            });

          if (historyError) throw historyError;

          // Atualizar quantidade do item
          const newQuantity = item.current_quantity - quantity;
          const { error: updateError } = await supabase
            .from('inventory_items')
            .update({
              current_quantity: newQuantity,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id);

          if (updateError) throw updateError;
        }
      }

      onSuccess();
      onClose();
      
      // Reset form
      setFormData({ user_name: '', observation: '', department_id: '' });
      setItemQuantities({});
      
    } catch (error) {
      console.error('Erro ao processar saída em lote:', error);
      setError('Erro ao processar saída em lote. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-gray-100">
        {/* Header com gradiente suave */}
        <div className="relative overflow-hidden rounded-t-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-red-100 via-red-200 to-red-300"></div>
          <div className="relative flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500/10 backdrop-blur-sm rounded-xl border border-red-200/50">
                <Minus className="w-7 h-7 text-red-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Saída em Lote</h2>
                <p className="text-gray-600 flex items-center gap-2">
                  <Package className="w-4 w-4" />
                  {selectedItems.length} item(s) selecionado(s)
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-red-100 rounded-xl transition-all duration-200 hover:scale-110 text-gray-600 hover:text-red-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informações gerais com cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
              <label className="block text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                Nome do Usuário *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.user_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, user_name: e.target.value }))}
                  className="w-full px-4 py-3 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-blue-300"
                  placeholder="Digite o nome do usuário"
                  required
                />
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
              <label className="block text-sm font-semibold text-green-900 mb-3 flex items-center gap-2">
                <Building className="w-4 h-4" />
                Departamento *
              </label>
              <select
                value={formData.department_id}
                onChange={(e) => setFormData(prev => ({ ...prev, department_id: e.target.value }))}
                className="w-full px-4 py-3 bg-white border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                required
              >
                <option value="">Selecione um departamento</option>
                {uniqueDepartments.map(dept => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Observação */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-100">
            <label className="block text-sm font-semibold text-purple-900 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Observação
            </label>
            <textarea
              value={formData.observation}
              onChange={(e) => setFormData(prev => ({ ...prev, observation: e.target.value }))}
              className="w-full px-4 py-3 bg-white border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 placeholder-purple-300 resize-none"
              placeholder="Observação sobre a saída (opcional)"
              rows={3}
            />
          </div>

          {/* Lista de itens com design melhorado */}
          <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-4 rounded-xl border border-gray-200">
            <label className="block text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Itens Selecionados
            </label>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {selectedItems.map((item) => (
                <div key={item.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 text-lg mb-1">{item.name}</div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {item.categories?.name || 'Sem categoria'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building className="w-3 h-3" />
                          {item.departments?.name || 'Sem departamento'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        Estoque atual: <span className="font-semibold text-blue-600">{item.current_quantity}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-medium text-gray-700">Quantidade:</label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max={item.current_quantity}
                          value={itemQuantities[item.id] || 0}
                          onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 0)}
                          className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 font-medium"
                        />
                        <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
                          <ArrowRight className="w-3 h-3 text-red-600" />
                        </div>
                      </div>
                      {/* Botão para remover item */}
                      {onRemoveItem && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200 hover:scale-105"
                          title="Remover item da seleção"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Error message com design melhorado */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <span className="text-sm font-medium text-red-700">{error}</span>
            </div>
          )}

          {/* Actions com design melhorado */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Total de itens: <span className="font-semibold text-gray-700">{selectedItems.length}</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium hover:scale-105"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-3 font-semibold hover:scale-105 shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Confirmar Saída
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
