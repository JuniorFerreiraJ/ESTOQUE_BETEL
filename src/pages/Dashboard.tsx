import React, { useState, useEffect } from 'react';
import { Plus, X, Settings, Trash2, ChevronDown, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import AddEditItemModal from '../components/AddEditItemModal';
import CategoryDepartmentModal from '../components/CategoryDepartmentModal';
import InventoryChart from '../components/InventoryChart';
import InventoryHistory from '../components/InventoryHistory';
import DashboardStats from '../components/DashboardStats';
import DepartmentDistribution from '../components/DepartmentDistribution';

interface HistoryItem {
  id: number;
  item_name: string;
  quantity_changed: number;
  type: 'entrada' | 'saida';
  observation: string;
  department_id: number;
  user_name: string;
  created_at: string;
  departments: {
    name: string;
  };
}

function Dashboard() {
  const [activeTab, setActiveTab] = useState('Todos');
  const [activeDepartment, setActiveDepartment] = useState('Todos');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
    fetchDepartments();
    fetchItems();
    fetchHistory();

    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || 'dashboard';
      setActiveSection(hash);
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*');
    if (data) setCategories(data);
  };

  const fetchDepartments = async () => {
    const { data } = await supabase.from('departments').select('*');
    if (data) setDepartments(data);
  };

  const fetchItems = async () => {
    const { data } = await supabase
      .from('inventory_items')
      .select('*, categories(name), departments(name)')
      .order('name');
    
    if (data) {
      setItems(data);
      setLowStockCount(
        data.filter(item => item.current_quantity <= item.minimum_quantity).length
      );
    }
  };

  const fetchHistory = async () => {
    try {
      console.log('Iniciando busca do histórico...');
      
      // Primeiro, vamos verificar se a tabela existe e tem dados
      const { count, error: countError } = await supabase
        .from('inventory_history')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error('Erro ao verificar a tabela:', countError);
        throw countError;
      }

      console.log(`Encontrados ${count} registros no histórico`);

      // Agora vamos buscar os dados com todas as informações necessárias
      const { data, error } = await supabase
        .from('inventory_history')
        .select(`
          *,
          departments (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar histórico:', error);
        throw error;
      }

      if (data) {
        console.log('Histórico carregado com sucesso:', data);
        setHistory(data);
      } else {
        console.log('Nenhum histórico encontrado');
        setHistory([]);
      }
    } catch (error: any) {
      console.error('Erro ao carregar histórico:', error);
      setError(error.message || 'Erro ao carregar histórico');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      
      setDeleteConfirmation(null);
      await fetchItems();
      await fetchHistory();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleEditItem = (item: any) => {
    setSelectedItem(item);
    setShowAddModal(true);
  };

  const handleModalSuccess = async () => {
    await fetchItems();
    await fetchHistory();
    setShowAddModal(false);
    setSelectedItem(null);
  };

  const filteredItems = items.filter(item => {
    const matchesCategory = activeTab === 'Todos' || item.categories?.name === activeTab;
    const matchesDepartment = activeDepartment === 'Todos' || item.departments?.name === activeDepartment;
    return matchesCategory && matchesDepartment;
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.department-dropdown')) {
        setShowDepartmentDropdown(false);
      }
      if (!target.closest('.category-dropdown')) {
        setShowCategoryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const renderDashboardSection = () => {
    const lowStockItems = items.filter(item => item.current_quantity <= item.minimum_quantity);

    return (
      <div className="space-y-6">
        <DashboardStats items={items} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Distribuição por Departamento</h3>
            <div className="h-[300px]">
              <DepartmentDistribution items={items} departments={departments} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Visão Geral do Estoque</h3>
            <div className="h-[300px]">
              <InventoryChart data={items} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderInventorySection = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Inventário</h2>
        <div className="flex space-x-4">
          <button
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
            onClick={() => {
              setSelectedItem(null);
              setShowAddModal(true);
            }}
          >
            <Plus className="h-5 w-5 mr-2" />
            Novo Item
          </button>
        </div>
      </div>

      <div className="flex space-x-4 mb-6">
        <div className="relative department-dropdown">
          <button
            onClick={() => setShowDepartmentDropdown(!showDepartmentDropdown)}
            className="bg-white border border-gray-300 rounded-md py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
          >
            <div className="flex items-center">
              <span className="block truncate mr-2">Departamento: {activeDepartment}</span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
          </button>
          {showDepartmentDropdown && (
            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
              <div
                className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-50"
                onClick={() => {
                  setActiveDepartment('Todos');
                  setShowDepartmentDropdown(false);
                }}
              >
                Todos
              </div>
              {departments.map((department) => (
                <div
                  key={department.id}
                  className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-50"
                  onClick={() => {
                    setActiveDepartment(department.name);
                    setShowDepartmentDropdown(false);
                  }}
                >
                  {department.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoria
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Departamento
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantidade Atual
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantidade Mínima
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{item.categories?.name || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{item.departments?.name || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${
                      item.current_quantity <= item.minimum_quantity
                        ? 'text-red-600'
                        : 'text-green-600'
                    }`}>
                      {item.current_quantity}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{item.minimum_quantity}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-3">
                      <button
                        onClick={() => handleEditItem(item)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Editar
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmation(item.id);
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Confirmar Exclusão
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Tem certeza que deseja excluir este item?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmation(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteItem(deleteConfirmation)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderHistorySection = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Histórico de Movimentações</h2>
      <InventoryHistory history={history} onUpdate={fetchHistory} />
    </div>
  );

  const renderAnalyticsSection = () => (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold">Análise de Dados</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Distribuição por Departamento</h3>
          <div className="h-[400px]">
            <DepartmentDistribution items={items} departments={departments} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Níveis de Estoque</h3>
          <div className="h-[400px]">
            <InventoryChart data={items} />
          </div>
        </div>
      </div>
    </div>
  );

  const renderManagementSection = () => (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold">Gerenciamento</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Categorias e Departamentos</h3>
          <p className="text-gray-600 mb-4">
            Gerencie as categorias e departamentos do sistema para melhor organização do inventário.
          </p>
          <button
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
            onClick={() => setShowCategoryModal(true)}
          >
            <Settings className="h-5 w-5 mr-2" />
            Configurar
          </button>
        </div>

        <div className="bg-white shadow-lg rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Itens em Estoque Baixo</h3>
          <p className="text-gray-600 mb-4">
            {lowStockCount} {lowStockCount === 1 ? 'item precisa' : 'itens precisam'} de reposição.
          </p>
          <div className="space-y-3">
            {items
              .filter(item => item.current_quantity <= item.minimum_quantity)
              .map(item => (
                <div 
                  key={item.id}
                  className="p-3 bg-red-50 rounded-lg flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium text-red-700">{item.name}</p>
                    <p className="text-sm text-red-600">
                      Atual: {item.current_quantity} | Mínimo: {item.minimum_quantity}
                    </p>
                  </div>
                  <button
                    onClick={() => handleEditItem(item)}
                    className="px-3 py-1 text-sm text-white bg-red-600 rounded-md hover:bg-red-700"
                  >
                    Ajustar
                  </button>
                </div>
              ))
            }
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Resumo do Sistema</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Total de Categorias</span>
              <span className="font-semibold">{categories.length}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Total de Departamentos</span>
              <span className="font-semibold">{departments.length}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Total de Itens</span>
              <span className="font-semibold">{items.length}</span>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Ações Rápidas</h3>
          <div className="space-y-3">
            <button
              onClick={() => {
                setSelectedItem(null);
                setShowAddModal(true);
              }}
              className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Adicionar Novo Item
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return renderDashboardSection();
      case 'inventory':
        return renderInventorySection();
      case 'history':
        return renderHistorySection();
      case 'analytics':
        return renderAnalyticsSection();
      case 'management':
        return renderManagementSection();
      default:
        return renderDashboardSection();
    }
  };

  return (
    <div>
      {activeSection === 'dashboard' && renderDashboardSection()}
      {activeSection === 'inventory' && renderInventorySection()}
      {activeSection === 'history' && renderHistorySection()}
      {activeSection === 'analytics' && renderAnalyticsSection()}
      {activeSection === 'management' && renderManagementSection()}

      {showAddModal && (
        <AddEditItemModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setSelectedItem(null);
          }}
          onSuccess={handleModalSuccess}
          categories={categories}
          departments={departments}
          editItem={selectedItem}
        />
      )}

      {showCategoryModal && (
        <CategoryDepartmentModal
          isOpen={showCategoryModal}
          onClose={() => setShowCategoryModal(false)}
          onSuccess={() => {
            fetchCategories();
            fetchDepartments();
          }}
          categories={categories}
          departments={departments}
        />
      )}
    </div>
  );
}

export default Dashboard;