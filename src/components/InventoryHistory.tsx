import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { Pencil, Trash2, X, Eye, Search, ArrowUpCircle, ArrowDownCircle, Filter, ChevronDown, Building, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'todos' | 'entrada' | 'saída'>('todos');
  const [filterDepartment, setFilterDepartment] = useState<string>('todos');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20); // 20 itens por página

  // Memoizar departamentos únicos para evitar recálculos
  const departments = useMemo(() => 
    Array.from(new Set(history.map(item => item.departments?.name || 'Sem Departamento'))),
    [history]
  );

  // Memoizar histórico filtrado
  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      const matchesSearch =
        item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.observation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.user_name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = filterType === 'todos' || item.type === filterType;
      const matchesDepartment = filterDepartment === 'todos' || item.departments?.name === filterDepartment;

      return matchesSearch && matchesType && matchesDepartment;
    });
  }, [history, searchTerm, filterType, filterDepartment]);

  // Calcular dados da paginação
  const paginationData = useMemo(() => {
    const totalItems = filteredHistory.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = filteredHistory.slice(startIndex, endIndex);

    return {
      totalItems,
      totalPages,
      currentItems,
      startIndex: startIndex + 1,
      endIndex: Math.min(endIndex, totalItems),
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1
    };
  }, [filteredHistory, currentPage, itemsPerPage]);

  // Resetar página quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, filterDepartment]);

  useEffect(() => {
    if (!history || history.length === 0) {
      setError('Nenhum histórico encontrado');
    } else {
      setError(null);
    }
  }, [history]);

  // Otimizar handlers com useCallback
  const handleTypeFilter = useCallback((type: 'todos' | 'entrada' | 'saída') => {
    setFilterType(type);
    setShowTypeDropdown(false);
  }, []);

  const handleDepartmentFilter = useCallback((dept: string) => {
    setFilterDepartment(dept);
    setShowDepartmentDropdown(false);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('inventory_history').delete().eq('id', id);
      if (error) throw error;
      setDeleteConfirmation(null);
      onUpdate();
    } catch (error) {
      console.error('Error deleting history item:', error);
      setError('Erro ao excluir item do histórico');
    }
  }, [onUpdate]);

  const handleEdit = useCallback(async (item: HistoryItem) => {
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
  }, [onUpdate]);

  // Handlers de paginação
  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const goToNextPage = useCallback(() => {
    if (paginationData.hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  }, [paginationData.hasNextPage]);

  const goToPrevPage = useCallback(() => {
    if (paginationData.hasPrevPage) {
      setCurrentPage(prev => prev - 1);
    }
  }, [paginationData.hasPrevPage]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.type-dropdown')) {
        setShowTypeDropdown(false);
      }
      if (!target.closest('.department-dropdown')) {
        setShowDepartmentDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-3 w-full sm:w-auto">
              {/* Filtro por Tipo - Melhorado */}
              <div className="relative flex-1 sm:w-48 type-dropdown">
                <button
                  onClick={() => setShowTypeDropdown(prev => !prev)}
                  className="w-full bg-white border border-gray-200 rounded-lg py-2.5 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 hover:border-green-300 hover:shadow-md flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <span className="block truncate">
                      {filterType === 'todos' ? 'Todos os tipos' : 
                       filterType === 'entrada' ? 'Entradas' : 'Saídas'}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400 transition-transform duration-200" />
                </button>
                {showTypeDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-lg py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm border border-gray-100">
                    <div
                      className="cursor-pointer select-none relative py-2.5 pl-3 pr-9 hover:bg-green-50 transition-colors duration-150 flex items-center gap-2"
                      onClick={() => handleTypeFilter('todos')}
                    >
                      <Filter className="h-4 w-4 text-gray-500" />
                      Todos os tipos
                    </div>
                    <div
                      className="cursor-pointer select-none relative py-2.5 pl-3 pr-9 hover:bg-green-50 transition-colors duration-150 flex items-center gap-2"
                      onClick={() => handleTypeFilter('entrada')}
                    >
                      <ArrowUpCircle className="h-4 w-4 text-green-500" />
                      Entradas
                    </div>
                    <div
                      className="cursor-pointer select-none relative py-2.5 pl-3 pr-9 hover:bg-green-50 transition-colors duration-150 flex items-center gap-2"
                      onClick={() => handleTypeFilter('saída')}
                    >
                      <ArrowDownCircle className="h-4 w-4 text-red-500" />
                      Saídas
                    </div>
                  </div>
                )}
              </div>

              {/* Filtro por Departamento - Melhorado */}
              <div className="relative flex-1 sm:w-48 department-dropdown">
                <button
                  onClick={() => setShowDepartmentDropdown(prev => !prev)}
                  className="w-full bg-white border border-gray-200 rounded-lg py-2.5 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 hover:border-green-300 hover:shadow-md flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-500" />
                    <span className="block truncate">
                      {filterDepartment === 'todos' ? 'Todos os departamentos' : filterDepartment}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400 transition-transform duration-200" />
                </button>
                {showDepartmentDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-lg py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm border border-gray-100">
                    <div
                      className="cursor-pointer select-none relative py-2.5 pl-3 pr-9 hover:bg-green-50 transition-colors duration-150 flex items-center gap-2"
                      onClick={() => handleDepartmentFilter('todos')}
                    >
                      <Building className="h-4 w-4 text-gray-500" />
                      Todos os departamentos
                    </div>
                    {departments.map(dept => (
                      <div
                        key={dept}
                        className="cursor-pointer select-none relative py-2.5 pl-3 pr-9 hover:bg-green-50 transition-colors duration-150 flex items-center gap-2"
                        onClick={() => handleDepartmentFilter(dept)}
                      >
                        <Building className="h-4 w-4 text-blue-500" />
                        {dept}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Campo de busca */}
            <div className="relative flex-1 sm:max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar por item, observação ou responsável..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors hover:border-green-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Info da paginação */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Mostrando {paginationData.startIndex} a {paginationData.endIndex} de {paginationData.totalItems} registros
            </span>
            <span>
              Página {currentPage} de {paginationData.totalPages}
            </span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Data
                  </th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Item
                  </th>
                  <th scope="col" className="hidden md:table-cell px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Departamento
                  </th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Tipo
                  </th>
                  <th scope="col" className="hidden sm:table-cell px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Quantidade
                  </th>
                  <th scope="col" className="hidden lg:table-cell px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Responsável
                  </th>
                  <th scope="col" className="hidden xl:table-cell px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Observação
                  </th>
                  <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginationData.currentItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(item.created_at), 'dd/MM/yyyy HH:mm')}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.item_name}</div>
                    </td>
                    <td className="hidden md:table-cell px-3 py-2 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.departments?.name || '-'}</div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          item.type === 'entrada'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {item.type}
                      </span>
                    </td>
                    <td className="hidden sm:table-cell px-3 py-2 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.quantity_changed}</div>
                    </td>
                    <td className="hidden lg:table-cell px-3 py-2 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.user_name || '-'}</div>
                    </td>
                    <td className="hidden xl:table-cell px-3 py-2">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {item.observation || '-'}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => setSelectedItem(item)}
                          className="text-gray-400 hover:text-gray-500 p-1"
                          title="Visualizar"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingItem(item)}
                          className="text-blue-400 hover:text-blue-500 p-1"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmation(item.id)}
                          className="text-red-400 hover:text-red-500 p-1"
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
        </div>
      </div>

      {/* Controles de paginação */}
      {paginationData.totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">
                Itens por página:
              </span>
              <span className="text-sm font-medium text-gray-900">
                {itemsPerPage}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Botão anterior */}
              <button
                onClick={goToPrevPage}
                disabled={!paginationData.hasPrevPage}
                className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {/* Números das páginas */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, paginationData.totalPages) }, (_, i) => {
                  let pageNumber;
                  if (paginationData.totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= paginationData.totalPages - 2) {
                    pageNumber = paginationData.totalPages - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNumber}
                      onClick={() => goToPage(pageNumber)}
                      className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                        pageNumber === currentPage
                          ? 'bg-green-600 text-white'
                          : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
              </div>

              {/* Botão próximo */}
              <button
                onClick={goToNextPage}
                disabled={!paginationData.hasNextPage}
                className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {filteredHistory.length === 0 && (
        <div className="p-8 text-center">
          <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Nenhum resultado encontrado</p>
          <p className="text-gray-400 text-sm mt-1">Tente ajustar os filtros ou a busca</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Confirmar exclusão
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Tem certeza que deseja excluir este item do histórico? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmation(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmation)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                Detalhes da Movimentação
              </h3>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Data e Hora
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {format(new Date(selectedItem.created_at), 'dd/MM/yyyy HH:mm')}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Item
                </label>
                <p className="mt-1 text-sm text-gray-900">{selectedItem.item_name}</p>
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
                  Responsável
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedItem.user_name || '-'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Tipo de Movimentação
                </label>
                <div className="mt-1 flex items-center">
                  {selectedItem.type === 'entrada' ? (
                    <ArrowUpCircle className="h-5 w-5 text-green-500 mr-1.5" />
                  ) : (
                    <ArrowDownCircle className="h-5 w-5 text-red-500 mr-1.5" />
                  )}
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedItem.type === 'entrada'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                      }`}
                  >
                    {selectedItem.type}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Quantidade
                </label>
                <p className="mt-1 text-sm text-gray-900">{selectedItem.quantity_changed}</p>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-500">
                  Observação
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedItem.observation || '-'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                Editar Observação
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Observação
                </label>
                <textarea
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  rows={4}
                  value={editingItem.observation || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, observation: e.target.value })}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleEdit(editingItem)}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}