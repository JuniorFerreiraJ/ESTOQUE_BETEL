import React, { useState, useEffect } from 'react';
import { Plus, X, Settings, Trash2, ChevronDown, AlertTriangle, ChevronLeft, ChevronRight, Search, Package, TrendingUp, BarChart2, Users, ShoppingCart, LogOut, Home, List, FileText, ClipboardList, Calendar, Tag, Building, Database, Activity, AlertCircle, PieChart } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import AddEditItemModal from '../components/AddEditItemModal';
import CategoryDepartmentModal from '../components/CategoryDepartmentModal';
import InventoryChart from '../components/InventoryChart';
import InventoryHistory from '../components/InventoryHistory';
import DashboardStats from '../components/DashboardStats';
import DepartmentDistribution from '../components/DepartmentDistribution';
import MovementChart from '../components/MovementChart';
import AnalyticsSection from '../components/AnalyticsSection';
import DepartmentDistributionChart from '../components/DepartmentDistributionChart';
import Devolucoes from './Devolucoes';

interface HistoryItem {
  id: number;
  item_name: string;
  quantity_changed: number;
  type: 'entrada' | 'saída';
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
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [modalInitialTab, setModalInitialTab] = useState<'categories' | 'departments'>('categories');
  const [categories, setCategories] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [showLowStockAlert, setShowLowStockAlert] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAnalyticsDepartment, setSelectedAnalyticsDepartment] = useState('Todos');
  const [showAnalyticsDepartmentDropdown, setShowAnalyticsDepartmentDropdown] = useState(false);
  const [movementData, setMovementData] = useState<any[]>([]);
  const [dailyMovements, setDailyMovements] = useState({ entries: 0, exits: 0 });
  const [databaseStats, setDatabaseStats] = useState({
    totalRows: 0,
    storageUsed: 0
  });
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchCategories();
    fetchDepartments();
    fetchItems();
    fetchHistory();
    calculateDailyMovements();
    fetchUsers();

    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || 'dashboard';
      setActiveSection(hash);
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    const fetchDatabaseStats = async () => {
      try {
        // Contagem total de linhas
        const tables = ['inventory_items', 'inventory_history', 'departments', 'categories'];
        let totalRows = 0;

        for (const table of tables) {
          const { count } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

          totalRows += count || 0;
        }

        setDatabaseStats(prev => ({
          ...prev,
          totalRows
        }));

      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
      }
    };

    fetchDatabaseStats();
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

  const calculateDailyMovements = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log('Calculando movimentações do dia:', {
      today: today.toISOString(),
      tomorrow: tomorrow.toISOString(),
      historyLength: history.length
    });

    const todayMovements = history.filter(item => {
      const itemDate = new Date(item.created_at);
      return itemDate >= today && itemDate < tomorrow;
    });

    console.log('Movimentações de hoje:', todayMovements);

    const entries = todayMovements
      .filter(item => item.type === 'entrada')
      .reduce((sum, item) => sum + (item.quantity_changed || 0), 0);

    const exits = todayMovements
      .filter(item => item.type === 'saída')
      .reduce((sum, item) => sum + (item.quantity_changed || 0), 0);

    console.log('Resultados:', { entries, exits });

    setDailyMovements({ entries, exits });
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
    calculateDailyMovements();
    setShowAddModal(false);
    setSelectedItem(null);
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = activeDepartment === 'Todos' || item.departments?.name === activeDepartment;
    const matchesCategory = activeCategory === 'Todos' || item.categories?.name === activeCategory;
    return matchesSearch && matchesDepartment && matchesCategory;
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

  const handleOpenCategoryModal = (tab: 'categories' | 'departments') => {
    setModalInitialTab(tab);
    setShowCategoryModal(true);
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    }
  };

  const renderDashboardSection = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Package className="w-8 h-8 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-800">Total de Itens</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{items.length}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Building className="w-8 h-8 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">Total de Departamentos</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{departments.length}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-8 h-8 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-800">Movimentações Hoje</h3>
          </div>
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-600">Entradas</p>
              <p className="text-2xl font-bold text-green-600">{dailyMovements.entries}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Saídas</p>
              <p className="text-2xl font-bold text-red-600">{dailyMovements.exits}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Distribuição por Departamento</h3>
          <div className="h-[400px]">
            <DepartmentDistributionChart
              data={Object.entries(
                items.reduce((acc, item) => {
                  const dept = item.departments?.name || 'Sem Departamento';
                  acc[dept] = (acc[dept] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              ).map(([name, value]) => ({ name, value: value as number }))}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-8 h-8 text-indigo-600" />
            <h3 className="text-lg font-semibold">Resumo do Mês</h3>
          </div>
          <div className="space-y-6">
            <div className="p-4 bg-indigo-50 rounded-lg">
              <h4 className="text-sm font-medium text-indigo-800 mb-2">Média de Movimentações Diárias</h4>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-indigo-600 mb-1">Entradas</p>
                  <p className="text-2xl font-bold text-indigo-700">
                    {Math.round(history.filter(h => h.type === 'entrada').length / 30)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-indigo-600 mb-1">Saídas</p>
                  <p className="text-2xl font-bold text-indigo-700">
                    {Math.round(history.filter(h => h.type === 'saída').length / 30)}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-indigo-50 rounded-lg">
              <h4 className="text-sm font-medium text-indigo-800 mb-2">Departamentos mais Ativos</h4>
              <div className="space-y-2">
                {departments
                  .map(dept => ({
                    ...dept,
                    movements: history.filter(h => h.department_id === dept.id).length
                  }))
                  .sort((a, b) => b.movements - a.movements)
                  .slice(0, 3)
                  .map((dept, index) => (
                    <div key={dept.id} className="flex justify-between items-center">
                      <span className="text-sm text-indigo-600">{dept.name}</span>
                      <span className="text-sm font-medium text-indigo-800">{dept.movements} mov.</span>
                    </div>
                  ))}
              </div>
            </div>
            <div className="p-4 bg-indigo-50 rounded-lg">
              <h4 className="text-sm font-medium text-indigo-800 mb-2">Status do Estoque</h4>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-indigo-600 mb-1">Itens OK</p>
                  <p className="text-2xl font-bold text-green-600">
                    {items.filter(item => item.current_quantity > item.minimum_quantity).length}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-indigo-600 mb-1">Itens Baixos</p>
                  <p className="text-2xl font-bold text-red-600">
                    {items.filter(item => item.current_quantity <= item.minimum_quantity).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Visão Geral do Estoque</h2>
        <div className="h-[500px]">
          <InventoryChart data={items.slice(0, 10)} />
        </div>
      </div>
    </div>
  );

  const renderInventorySection = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg flex items-center gap-4">
        <Package className="w-8 h-8 text-green-600" />
        <h2 className="text-2xl font-semibold text-gray-900">Inventário</h2>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Inventário</h2>
        <div className="flex space-x-4">
          <button
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors duration-200"
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

      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-6">
        {/* Filtro por Departamento */}
        <div className="relative w-full md:w-64 department-dropdown">
          <button
            onClick={() => setShowDepartmentDropdown(!showDepartmentDropdown)}
            className="w-full bg-white border border-gray-300 rounded-md py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <span className="block truncate">Departamento: {activeDepartment}</span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
          </button>
          {showDepartmentDropdown && (
            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
              <div
                className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-50 transition-colors duration-150"
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
                  className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-50 transition-colors duration-150"
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

        {/* Filtro por Categoria */}
        <div className="relative w-full md:w-64 category-dropdown">
          <button
            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
            className="w-full bg-white border border-gray-300 rounded-md py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <span className="block truncate">Categoria: {activeCategory}</span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
          </button>
          {showCategoryDropdown && (
            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
              <div
                className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-50 transition-colors duration-150"
                onClick={() => {
                  setActiveCategory('Todos');
                  setShowCategoryDropdown(false);
                }}
              >
                Todos
              </div>
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-50 transition-colors duration-150"
                  onClick={() => {
                    setActiveCategory(category.name);
                    setShowCategoryDropdown(false);
                  }}
                >
                  {category.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Campo de busca por itens */}
        <div className="w-full md:w-96">
          <input
            type="text"
            placeholder="Buscar por nome do item..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-md py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
          />
        </div>
      </div>

      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
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
                <tr
                  key={item.id}
                  className="hover:bg-gray-50 transition-colors duration-150"
                >
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
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${item.current_quantity <= item.minimum_quantity
                      ? 'bg-red-100 text-red-800'
                      : 'bg-green-100 text-green-800'
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
                        className="text-green-600 hover:text-green-900 transition-colors duration-150"
                      >
                        Editar
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmation(item.id);
                        }}
                        className="text-red-600 hover:text-red-900 transition-colors duration-150"
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

        {filteredItems.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Nenhum item encontrado
          </div>
        )}
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
      <div className="bg-gray-50 p-4 rounded-lg flex items-center gap-4">
        <ClipboardList className="w-8 h-8 text-green-600" />
        <h2 className="text-2xl font-semibold text-gray-900">Histórico de Movimentações</h2>
      </div>
      <InventoryHistory history={history} onUpdate={fetchHistory} />
    </div>
  );

  const renderAnalyticsSection = () => (
    <div className="space-y-6">
      <AnalyticsSection
        items={items}
        departments={departments}
        history={history}
        onEditItem={handleEditItem}
      />
    </div>
  );

  const renderSystemStatsSection = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-8 h-8 text-green-600" />
            <h3 className="text-lg font-semibold">Usuários Ativos</h3>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-900">{users.length}</p>
              <p className="text-sm text-gray-500">Usuários cadastrados</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-8 h-8 text-blue-600" />
            <h3 className="text-lg font-semibold">Itens no Histórico</h3>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-900">{history.length}</p>
              <p className="text-sm text-gray-500">Movimentações registradas</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Package className="w-8 h-8 text-purple-600" />
            <h3 className="text-lg font-semibold">Itens Criados</h3>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-900">{items.length}</p>
              <p className="text-sm text-gray-500">Itens cadastrados</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Database className="w-8 h-8 text-indigo-600" />
          <h3 className="text-lg font-semibold">Uso do Banco de Dados</h3>
        </div>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">Total de Registros</span>
              <span className="text-sm font-medium text-gray-700">{databaseStats.totalRows} / 50.000</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-indigo-600 h-2.5 rounded-full"
                style={{ width: `${(databaseStats.totalRows / 50000) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {Math.round((databaseStats.totalRows / 50000) * 100)}% do limite do plano gratuito
            </p>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">Armazenamento</span>
              <span className="text-sm font-medium text-gray-700">{databaseStats.storageUsed} / 500MB</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-indigo-600 h-2.5 rounded-full"
                style={{ width: `${(databaseStats.storageUsed / 500) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {Math.round((databaseStats.storageUsed / 500) * 100)}% do limite do plano gratuito
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Activity className="w-8 h-8 text-indigo-600" />
          <h3 className="text-lg font-semibold">Movimentações do Mês</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Entradas</h4>
            <p className="text-3xl font-bold text-green-600">
              {history.filter(h => h.type === 'entrada').length}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Saídas</h4>
            <p className="text-3xl font-bold text-red-600">
              {history.filter(h => h.type === 'saída').length}
            </p>
          </div>
        </div>
      </div>

      {databaseStats.totalRows > 40000 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <h3 className="text-sm font-medium text-yellow-800">Atenção: Limite do Plano Gratuito</h3>
          </div>
          <p className="text-sm text-yellow-700 mt-2">
            Você está próximo do limite de registros do plano gratuito. Considere fazer backup dos dados antigos ou fazer upgrade do plano.
          </p>
        </div>
      )}
    </div>
  );

  const renderManagementSection = () => (
    <div className="space-y-8">
      <div className="bg-gray-50 p-4 rounded-lg flex items-center gap-4">
        <Settings className="w-8 h-8 text-green-600" />
        <h2 className="text-2xl font-semibold text-gray-900">Gerenciamento do Sistema</h2>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Card de Departamentos */}
        <div className="bg-white shadow-lg rounded-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <Building className="w-8 h-8 text-blue-600" />
            <h3 className="text-2xl font-semibold">Departamentos</h3>
          </div>
          <p className="text-gray-600 mb-6 text-lg">
            Gerencie os departamentos do sistema. Adicione, edite ou remova departamentos conforme necessário.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-lg font-medium text-blue-800 mb-2">Departamentos Ativos</h4>
              <p className="text-3xl font-bold text-blue-600">{departments.length}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-lg font-medium text-blue-800 mb-2">Itens por Departamento</h4>
              <p className="text-3xl font-bold text-blue-600">
                {Math.round(items.length / (departments.length || 1))}
              </p>
            </div>
          </div>
          <button
            className="inline-flex items-center px-6 py-3 text-base font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors duration-200"
            onClick={() => handleOpenCategoryModal('departments')}
          >
            <Settings className="h-6 w-6 mr-2" />
            Gerenciar Departamentos
          </button>
        </div>

        {/* Card de Categorias */}
        <div className="bg-white shadow-lg rounded-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <Tag className="w-8 h-8 text-green-600" />
            <h3 className="text-2xl font-semibold">Categorias</h3>
          </div>
          <p className="text-gray-600 mb-6 text-lg">
            Gerencie as categorias dos itens. Crie novas categorias ou remova as existentes.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="text-lg font-medium text-green-800 mb-2">Categorias Ativas</h4>
              <p className="text-3xl font-bold text-green-600">{categories.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="text-lg font-medium text-green-800 mb-2">Itens por Categoria</h4>
              <p className="text-3xl font-bold text-green-600">
                {Math.round(items.length / (categories.length || 1))}
              </p>
            </div>
          </div>
          <button
            className="inline-flex items-center px-6 py-3 text-base font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors duration-200"
            onClick={() => handleOpenCategoryModal('categories')}
          >
            <Settings className="h-6 w-6 mr-2" />
            Gerenciar Categorias
          </button>
        </div>

        {/* Card de Estatísticas */}
        <div className="bg-white shadow-lg rounded-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <BarChart2 className="w-8 h-8 text-purple-600" />
            <h3 className="text-2xl font-semibold">Estatísticas do Sistema</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="text-lg font-medium text-purple-800 mb-2">Total de Usuários Ativos</h4>
              <p className="text-3xl font-bold text-purple-600">{users.length}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="text-lg font-medium text-purple-800 mb-2">Total de Itens no Histórico</h4>
              <p className="text-3xl font-bold text-purple-600">{history.length}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="text-lg font-medium text-purple-800 mb-2">Total de Itens Criados</h4>
              <p className="text-3xl font-bold text-purple-600">{items.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Card de Uso do Banco de Dados */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Database className="w-8 h-8 text-indigo-600" />
          <h3 className="text-lg font-semibold">Uso do Banco de Dados</h3>
        </div>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">Total de Registros</span>
              <span className="text-sm font-medium text-gray-700">{databaseStats.totalRows} / 50.000</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-indigo-600 h-2.5 rounded-full"
                style={{ width: `${(databaseStats.totalRows / 50000) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {Math.round((databaseStats.totalRows / 50000) * 100)}% do limite do plano gratuito
            </p>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">Armazenamento</span>
              <span className="text-sm font-medium text-gray-700">{databaseStats.storageUsed} / 500MB</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-indigo-600 h-2.5 rounded-full"
                style={{ width: `${(databaseStats.storageUsed / 500) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {Math.round((databaseStats.storageUsed / 500) * 100)}% do limite do plano gratuito
            </p>
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
      case 'system-stats':
        return renderSystemStatsSection();
      case 'devolucoes':
        return <Devolucoes />;
      default:
        return renderDashboardSection();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {renderContent()}

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
    </div>
  );
}

export default Dashboard;