import React, { useState, useEffect, useMemo } from 'react';
import { Plus, X, Settings, Trash2, ChevronDown, AlertTriangle, ChevronLeft, ChevronRight, Search, Package, TrendingUp, BarChart2, Users, ShoppingCart, LogOut, Home, List, FileText, ClipboardList, Calendar, Tag, Building, Database, Activity, AlertCircle, PieChart, History, Layers, ArrowUpCircle, ArrowDownCircle, HardDrive, Minus, CheckSquare, Square } from 'lucide-react';
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
import BulkExitModal from '../components/BulkExitModal';

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
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showBulkExitModal, setShowBulkExitModal] = useState(false);

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

  // Filtrar categorias baseado no departamento selecionado
  const filteredCategories = useMemo(() => {
    if (activeDepartment === 'Todos') {
      return categories;
    }
    
    // Buscar itens que pertencem ao departamento selecionado
    const departmentItems = items.filter(item => 
      item.departments?.name === activeDepartment
    );
    
    // Extrair categorias únicas desses itens
    const departmentCategoryIds = new Set(
      departmentItems.map(item => item.category_id)
    );
    
    return categories.filter(category => 
      departmentCategoryIds.has(category.id)
    );
  }, [categories, items, activeDepartment]);

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

  // Resetar categoria quando departamento mudar
  const handleDepartmentChange = (departmentName: string) => {
    setActiveDepartment(departmentName);
    setShowDepartmentDropdown(false);
    
    // Se a categoria atual não existe no novo departamento, resetar para "Todos"
    if (departmentName !== 'Todos' && activeCategory !== 'Todos') {
      const departmentItems = items.filter(item => 
        item.departments?.name === departmentName
      );
      const departmentCategoryIds = new Set(
        departmentItems.map(item => item.category_id)
      );
      const currentCategory = categories.find(cat => cat.name === activeCategory);
      
      if (currentCategory && !departmentCategoryIds.has(currentCategory.id)) {
        setActiveCategory('Todos');
      }
    }
  };

  const handleSelectItem = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map(item => item.id));
    }
  };

  const handleBulkExit = () => {
    if (selectedItems.length === 0) return;
    setShowBulkExitModal(true);
  };

  const handleBulkExitSuccess = () => {
    setSelectedItems([]);
    fetchItems();
    fetchHistory();
  };

  const fetchUsers = async () => {
    try {
      // Buscando usuários únicos do histórico de movimentações
      const { data: historyData, error } = await supabase
        .from('inventory_history')
        .select('user_name')
        .not('user_name', 'is', null)
        .order('user_name');

      if (error) {
        console.error('Erro ao buscar usuários:', error);
        return;
      }

      if (historyData) {
        // Criando um Set para garantir valores únicos
        const uniqueUsers = new Set(historyData.map(h => h.user_name));
        // Convertendo para array e criando objetos com a estrutura necessária
        const usersArray = Array.from(uniqueUsers).map(name => ({ user_name: name }));
        
        // Debug: Mostrar os usuários únicos encontrados
        console.log('Usuários únicos encontrados:', Array.from(uniqueUsers));
        console.log('Total de usuários:', uniqueUsers.size);
        
        setUsers(usersArray);
      }
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
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-xl shadow-lg">
        <div className="flex items-center gap-4">
          <Layers className="w-10 h-10 text-green-600" />
          <h2 className="text-2xl font-bold text-gray-900">Inventário</h2>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-sm hover:shadow-md"
              onClick={() => {
                setSelectedItem(null);
                setShowAddModal(true);
              }}
            >
              <Plus className="h-5 w-5 mr-2" />
              Novo Item
            </button>

            {selectedItems.length > 0 && (
              <button
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors duration-200 shadow-sm hover:shadow-md"
                onClick={handleBulkExit}
              >
                <Minus className="h-5 w-5 mr-2" />
                Saída em Lote ({selectedItems.length})
              </button>
            )}
          </div>

          <div className="flex-1 flex flex-col md:flex-row gap-4">
            {/* Filtro por Departamento */}
            <div className="relative flex-1 department-dropdown">
              <button
                onClick={() => setShowDepartmentDropdown(!showDepartmentDropdown)}
                className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 hover:border-green-300"
              >
                <div className="flex items-center justify-between">
                  <span className="block truncate">Departamento: {activeDepartment}</span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>
              </button>
              {showDepartmentDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-lg py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                  <div
                    className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-green-50 transition-colors duration-150"
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
                      className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-green-50 transition-colors duration-150"
                      onClick={() => handleDepartmentChange(department.name)}
                    >
                      {department.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Filtro por Categoria */}
            <div className="relative flex-1 category-dropdown">
              <button
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 hover:border-green-300"
              >
                <div className="flex items-center justify-between">
                  <span className="block truncate">Categoria: {activeCategory}</span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>
              </button>
              {showCategoryDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-lg py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                  <div
                    className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-green-50 transition-colors duration-150"
                    onClick={() => {
                      setActiveCategory('Todos');
                      setShowCategoryDropdown(false);
                    }}
                  >
                    Todos
                  </div>
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map((category) => (
                      <div
                        key={category.id}
                        className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-green-50 transition-colors duration-150"
                        onClick={() => {
                          setActiveCategory(category.name);
                          setShowCategoryDropdown(false);
                        }}
                      >
                        {category.name}
                      </div>
                    ))
                  ) : (
                    <div className="py-2 pl-3 pr-9 text-sm text-gray-500 italic">
                      Nenhuma categoria disponível
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Campo de busca */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar por nome do item..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg py-2 pl-10 pr-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 hover:border-green-300"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    <button
                      onClick={handleSelectAll}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      {selectedItems.length === filteredItems.length && filteredItems.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-green-600" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </th>
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
                    <button
                      onClick={() => handleSelectItem(item.id)}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      {selectedItems.includes(item.id) ? (
                        <CheckSquare className="w-4 h-4 text-green-600" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </td>
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
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                      item.current_quantity <= item.minimum_quantity
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
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Nenhum item encontrado</p>
            <p className="text-gray-400 text-sm mt-1">Tente ajustar os filtros ou adicionar um novo item</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderHistorySection = () => (
    <div className="w-full">
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg shadow">
          <div className="flex items-center gap-4">
            <History className="w-10 h-10 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-900">Histórico</h2>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <InventoryHistory history={history} onUpdate={fetchHistory} />
        </div>
      </div>
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
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 via-white to-green-50 rounded-2xl shadow-lg p-8 border border-green-100">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl shadow-md">
            <Settings className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
              Gerenciamento do Sistema
            </h2>
          </div>
        </div>
      </div>

      {/* Cards de Gerenciamento */}
      <div className="grid grid-cols-1 gap-8">
        {/* Card de Departamentos */}
        <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50 rounded-2xl p-8 border border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-md">
              <Building className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Departamentos</h3>
              <p className="text-gray-600 mt-1">Gerencie a estrutura organizacional do sistema</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-blue-100">
              <div className="flex items-center gap-3 mb-2">
                <Building className="w-5 h-5 text-blue-600" />
                <h4 className="text-lg font-medium text-blue-800">Departamentos Ativos</h4>
              </div>
              <p className="text-3xl font-bold text-blue-600">{departments.length}</p>
              <p className="text-sm text-blue-600/80 mt-1">Total de departamentos cadastrados</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-blue-100">
              <div className="flex items-center gap-3 mb-2">
                <Package className="w-5 h-5 text-blue-600" />
                <h4 className="text-lg font-medium text-blue-800">Itens por Departamento</h4>
              </div>
              <p className="text-3xl font-bold text-blue-600">
                {Math.round(items.length / (departments.length || 1))}
              </p>
              <p className="text-sm text-blue-600/80 mt-1">Média de itens por departamento</p>
            </div>
          </div>

          <button
            onClick={() => handleOpenCategoryModal('departments')}
            className="inline-flex items-center px-6 py-3 text-base font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Settings className="h-5 w-5 mr-2" />
            Gerenciar Departamentos
          </button>
        </div>

        {/* Card de Categorias */}
        <div className="bg-gradient-to-br from-green-50 via-white to-green-50 rounded-2xl p-8 border border-green-100 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl shadow-md">
              <Tag className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Categorias</h3>
              <p className="text-gray-600 mt-1">Organize seus itens por categorias</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-green-100">
              <div className="flex items-center gap-3 mb-2">
                <Tag className="w-5 h-5 text-green-600" />
                <h4 className="text-lg font-medium text-green-800">Categorias Ativas</h4>
              </div>
              <p className="text-3xl font-bold text-green-600">{categories.length}</p>
              <p className="text-sm text-green-600/80 mt-1">Total de categorias cadastradas</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-green-100">
              <div className="flex items-center gap-3 mb-2">
                <Package className="w-5 h-5 text-green-600" />
                <h4 className="text-lg font-medium text-green-800">Itens por Categoria</h4>
              </div>
              <p className="text-3xl font-bold text-green-600">
                {Math.round(items.length / (categories.length || 1))}
              </p>
              <p className="text-sm text-green-600/80 mt-1">Média de itens por categoria</p>
            </div>
          </div>

          <button
            onClick={() => handleOpenCategoryModal('categories')}
            className="inline-flex items-center px-6 py-3 text-base font-medium text-white bg-gradient-to-r from-green-600 to-green-700 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Settings className="h-5 w-5 mr-2" />
            Gerenciar Categorias
          </button>
        </div>

        {/* Card de Estatísticas */}
        <div className="bg-gradient-to-br from-purple-50 via-white to-purple-50 rounded-2xl p-8 border border-purple-100 shadow-lg">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl shadow-md">
              <BarChart2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Estatísticas do Sistema</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-purple-100">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-purple-600" />
                <h4 className="text-lg font-medium text-purple-800">Usuários Ativos</h4>
              </div>
              <p className="text-3xl font-bold text-purple-600">{users.length}</p>
              <p className="text-sm text-purple-600/80 mt-1">Usuários que realizaram movimentações</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-purple-100">
              <div className="flex items-center gap-3 mb-2">
                <History className="w-5 h-5 text-purple-600" />
                <h4 className="text-lg font-medium text-purple-800">Movimentações</h4>
              </div>
              <p className="text-3xl font-bold text-purple-600">{history.length}</p>
              <p className="text-sm text-purple-600/80 mt-1">Total de registros no histórico</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-purple-100">
              <div className="flex items-center gap-3 mb-2">
                <Package className="w-5 h-5 text-purple-600" />
                <h4 className="text-lg font-medium text-purple-800">Total de Itens</h4>
              </div>
              <p className="text-3xl font-bold text-purple-600">{items.length}</p>
              <p className="text-sm text-purple-600/80 mt-1">Itens cadastrados no sistema</p>
            </div>
          </div>
        </div>

        {/* Card de Banco de Dados */}
        <div className="bg-gradient-to-br from-indigo-50 via-white to-indigo-50 rounded-2xl p-8 border border-indigo-100 shadow-lg">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-3 rounded-xl shadow-md">
              <Database className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Uso do Banco de Dados</h3>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-indigo-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-indigo-600" />
                  <h4 className="text-lg font-medium text-indigo-800">Total de Registros</h4>
                </div>
                <span className="text-sm font-medium text-indigo-600">
                  {databaseStats.totalRows} / 50.000
                </span>
              </div>
              <div className="h-2.5 bg-indigo-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-300"
                  style={{ width: `${(databaseStats.totalRows / 50000) * 100}%` }}
                />
              </div>
              <p className="text-sm text-indigo-600/80 mt-2">
                {Math.round((databaseStats.totalRows / 50000) * 100)}% do limite do plano gratuito
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-indigo-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <HardDrive className="w-5 h-5 text-indigo-600" />
                  <h4 className="text-lg font-medium text-indigo-800">Armazenamento</h4>
                </div>
                <span className="text-sm font-medium text-indigo-600">
                  {databaseStats.storageUsed} / 500MB
                </span>
              </div>
              <div className="h-2.5 bg-indigo-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-300"
                  style={{ width: `${(databaseStats.storageUsed / 500) * 100}%` }}
                />
              </div>
              <p className="text-sm text-indigo-600/80 mt-2">
                {Math.round((databaseStats.storageUsed / 500) * 100)}% do limite do plano gratuito
              </p>
            </div>
          </div>

          {databaseStats.totalRows > 40000 && (
            <div className="mt-6 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <p className="text-sm font-medium text-yellow-800">Atenção: Limite do Plano Gratuito</p>
              </div>
              <p className="text-sm text-yellow-700 mt-2">
                Você está próximo do limite de registros. Considere fazer backup dos dados antigos ou fazer upgrade do plano.
              </p>
            </div>
          )}
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
          initialTab={modalInitialTab}
        />
      )}

      {/* Modal de Saída em Lote */}
      <BulkExitModal
        isOpen={showBulkExitModal}
        onClose={() => setShowBulkExitModal(false)}
        onSuccess={handleBulkExitSuccess}
        selectedItems={filteredItems.filter(item => selectedItems.includes(item.id))}
        onRemoveItem={(itemId) => {
          setSelectedItems(prev => prev.filter(id => id !== itemId));
        }}
      />

      {/* Modal de Confirmação de Exclusão */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                Confirmar exclusão
              </h3>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Tem certeza que deseja excluir este item do inventário? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmation(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteItem(deleteConfirmation)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;