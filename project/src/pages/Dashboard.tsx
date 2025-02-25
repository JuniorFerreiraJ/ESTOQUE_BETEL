import React, { useState, useEffect } from 'react';
import { Package, BarChart2, LogOut, Plus, X, Settings, Trash2, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import AddEditItemModal from '../components/AddEditItemModal';
import CategoryDepartmentModal from '../components/CategoryDepartmentModal';
import InventoryChart from '../components/InventoryChart';
import InventoryHistory from '../components/InventoryHistory';

export default function Dashboard() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
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

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  useEffect(() => {
    fetchCategories();
    fetchDepartments();
    fetchItems();
    fetchHistory();
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

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-green-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-white" />
              <span className="ml-2 text-white text-xl font-semibold">
                Controle de Estoque
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                className="flex items-center px-4 py-2 text-sm text-white bg-green-500 rounded-md hover:bg-green-400 transition-colors duration-200"
                onClick={() => setShowCategoryModal(true)}
              >
                <Settings className="h-5 w-5 mr-2" />
                Configurações
              </button>
              <button
                className="flex items-center px-4 py-2 text-sm text-white bg-green-500 rounded-md hover:bg-green-400 transition-colors duration-200"
                onClick={() => setShowChartModal(true)}
              >
                <BarChart2 className="h-5 w-5 mr-2" />
                Ver Gráficos
              </button>
              <button
                className="flex items-center px-4 py-2 text-sm text-white bg-green-500 rounded-md hover:bg-green-400 transition-colors duration-200"
                onClick={() => {
                  setSelectedItem(null);
                  setShowAddModal(true);
                }}
              >
                <Plus className="h-5 w-5 mr-2" />
                Novo Item
              </button>
              <button
                className="flex items-center px-4 py-2 text-sm text-white bg-red-500 rounded-md hover:bg-red-400 transition-colors duration-200"
                onClick={handleSignOut}
              >
                <LogOut className="h-5 w-5 mr-2" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {lowStockCount > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-r-md shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-9v4a1 1 0 11-2 0v-4a1 1 0 112 0zm0-4a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  Atenção! {lowStockCount} {lowStockCount === 1 ? 'item' : 'itens'} com estoque baixo
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Departamentos Dropdown */}
          <div className="relative department-dropdown">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Departamento
            </label>
            <button
              onClick={() => setShowDepartmentDropdown(!showDepartmentDropdown)}
              className="w-full bg-white border border-gray-300 rounded-md py-2 px-3 text-left shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
            >
              <div className="flex items-center justify-between">
                <span className="block truncate">{activeDepartment}</span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
            </button>
            {showDepartmentDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
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

          {/* Categorias Dropdown */}
          <div className="relative category-dropdown">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoria
            </label>
            <button
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className="w-full bg-white border border-gray-300 rounded-md py-2 px-3 text-left shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
            >
              <div className="flex items-center justify-between">
                <span className="block truncate">{activeTab}</span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
            </button>
            {showCategoryDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
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

        <div className="mt-6 bg-white shadow-lg rounded-lg p-6">
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

      {/* Modals */}
      {showAddModal && (
        <AddEditItemModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setSelectedItem(null);
          }}
          onSuccess={() => {
            fetchItems();
            fetchHistory();
          }}
          categories={categories}
          departments={departments}
          editItem={selectedItem}
        />
      )}

      {showChartModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowChartModal(false);
          }}
        >
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out scale-100 opacity-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Análise de Estoque</h2>
              <button
                onClick={() => setShowChartModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-8">
              <InventoryChart data={items} />
              <InventoryHistory
                history={history}
                onUpdate={fetchHistory}
              />
            </div>
          </div>
        </div>
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