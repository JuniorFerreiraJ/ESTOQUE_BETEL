import React, { useState, useEffect } from 'react';
import { Plus, X, Settings, Trash2, ChevronDown, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import AddEditItemModal from '../components/AddEditItemModal';
import CategoryDepartmentModal from '../components/CategoryDepartmentModal';
import InventoryChart from '../components/InventoryChart';
import InventoryHistory from '../components/InventoryHistory';
import DashboardStats from '../components/DashboardStats';
import DepartmentDistribution from '../components/DepartmentDistribution';

function Dashboard() {
  const [activeTab, setActiveTab] = useState('Todos');
  const [activeDepartment, setActiveDepartment] = useState('Todos');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showChartModal, setShowChartModal] = useState(false);
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

  useEffect(() => {
    fetchCategories();
    fetchDepartments();
    fetchItems();
    fetchHistory();

    // Handle hash change
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || 'dashboard';
      setActiveSection(hash);
    };

    // Set initial section from hash
    handleHashChange();

    // Listen for hash changes
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
    const { data } = await supabase
      .from('inventory_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (data) setHistory(data);
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await supabase
        .from('inventory_items')
        .delete()
        .eq('id', itemId);
      
      setDeleteConfirmation(null);
      fetchItems();
      fetchHistory();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleEditItem = (item: any) => {
    setSelectedItem(item);
    setShowAddModal(true);
  };

  const filteredItems = items.filter(item => {
    const matchesCategory = activeTab === 'Todos' || item.categories.name === activeTab;
    const matchesDepartment = activeDepartment === 'Todos' || (item.departments && item.departments.name === activeDepartment);
    return matchesCategory && matchesDepartment;
  });

  // Close dropdowns when clicking outside
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

  const renderDashboardSection = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardStats items={items} />
        <DepartmentDistribution items={items} departments={departments} />
      </div>

      {lowStockCount > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                Atenção! {lowStockCount} {lowStockCount === 1 ? 'item' : 'itens'} com estoque baixo
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Visão Geral do Estoque</h2>
        <div className="h-[400px]">
          <InventoryChart data={items.slice(0, 10)} />
        </div>
      </div>
    </div>
  );

  const renderInventorySection = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
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
            <div className="absolute z-10 mt-1 w-56 bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
              <div
                className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-green-50"
                onClick={() => {
                  setActiveDepartment('Todos');
                  setShowDepartmentDropdown(false);
                }}
              >
                Todos
              </div>
              {departments.map((dept) => (
                <div
                  key={dept.id}
                  className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-green-50"
                  onClick={() => {
                    setActiveDepartment(dept.name);
                    setShowDepartmentDropdown(false);
                  }}
                >
                  {dept.name}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="relative category-dropdown">
          <button
            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
            className="bg-white border border-gray-300 rounded-md py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
          >
            <div className="flex items-center">
              <span className="block truncate mr-2">Categoria: {activeTab}</span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
          </button>
          {showCategoryDropdown && (
            <div className="absolute z-10 mt-1 w-56 bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
              <div
                className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-green-50"
                onClick={() => {
                  setActiveTab('Todos');
                  setShowCategoryDropdown(false);
                }}
              >
                Todos
              </div>
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-green-50"
                  onClick={() => {
                    setActiveTab(category.name);
                    setShowCategoryDropdown(false);
                  }}
                >
                  {category.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white shadow-lg rounded-lg p-6">
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
              onClick={() => handleEditItem(item)}
            >
              <div>
                <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
                <p className="text-sm text-gray-500">
                  Categoria: {item.categories.name} | 
                  Departamento: {item.departments ? item.departments.name : 'Não definido'}
                </p>
              </div>
              <div className="flex items-center space-x-6">
                <div className="text-right">
                  <p className="text-sm text-gray-500">Quantidade Atual</p>
                  <p className={`text-lg font-semibold ${
                    item.current_quantity <= item.minimum_quantity
                      ? 'text-red-600'
                      : 'text-green-600'
                  }`}>
                    {item.current_quantity}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Mínimo</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {item.minimum_quantity}
                  </p>
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  {deleteConfirmation === item.id ? (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="px-3 py-1 text-sm text-white bg-red-500 rounded hover:bg-red-600"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => setDeleteConfirmation(null)}
                        className="px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmation(item.id)}
                      className="p-2 text-gray-500 hover:text-red-500 transition-colors duration-200"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderHistorySection = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Histórico de Movimentações</h2>
      <div className="bg-white shadow-lg rounded-lg p-6">
        <InventoryHistory 
          history={history} 
          onUpdate={fetchHistory} 
        />
      </div>
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

  return (
    <div>
      {/* Render active section */}
      {activeSection === 'dashboard' && renderDashboardSection()}
      {activeSection === 'inventory' && renderInventorySection()}
      {activeSection === 'history' && renderHistorySection()}
      {activeSection === 'analytics' && renderAnalyticsSection()}
      {activeSection === 'management' && renderManagementSection()}

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