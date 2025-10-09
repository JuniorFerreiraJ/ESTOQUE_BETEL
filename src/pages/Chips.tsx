import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Users,
  Building2,
  Phone,
  DollarSign,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  MoreVertical,
  Eye,
  RefreshCw
} from 'lucide-react';
import AddChipModal from '../components/AddChipModal';
import { supabase } from '../lib/supabaseClient';

interface Chip {
  id: string;
  phoneNumber: string;
  company: string;
  department: string;
  currentUser: string;
  status: 'ativo' | 'inativo' | 'bloqueado';
  plan: string;
  monthlyCost: number;
  lastUpdate: string;
}

export default function Chips() {
  const [chips, setChips] = useState<Chip[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChip, setSelectedChip] = useState<Chip | null>(null);

  const companies = ['Claro', 'Vivo'];
  const [departments, setDepartments] = useState<string[]>([]);
  const statuses = ['ativo', 'inativo', 'bloqueado'];

  // Buscar chips do banco de dados
  const fetchChips = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('chips')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        // Converter dados do banco para o formato da interface
        const formattedChips: Chip[] = data.map(item => ({
          id: item.id,
          phoneNumber: item.phone_number,
          company: item.company,
          department: item.department,
          currentUser: item.current_user_name,
          status: item.status,
          plan: item.plan,
          monthlyCost: item.monthly_cost,
          lastUpdate: item.last_update
        }));
        setChips(formattedChips);
      }
    } catch (error: any) {
      console.error('Erro ao buscar chips:', error);
      setError(error.message || 'Erro ao carregar chips');
    } finally {
      setLoading(false);
    }
  };

  // Buscar departamentos únicos dos chips
  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('chips')
        .select('department')
        .order('department');

      if (error) throw error;
      
      if (data) {
        const uniqueDepartments = Array.from(new Set(data.map(item => item.department)));
        setDepartments(uniqueDepartments);
      }
    } catch (error: any) {
      console.error('Erro ao buscar departamentos:', error);
    }
  };

  // Adicionar departamento à lista local (para aparecer no filtro imediatamente)
  const addDepartmentToList = (newDepartment: string) => {
    if (newDepartment && !departments.includes(newDepartment)) {
      setDepartments([...departments, newDepartment].sort());
    }
  };

  // Carregar dados na inicialização
  useEffect(() => {
    fetchChips();
    fetchDepartments();
  }, []);

  // Função para editar chip
  const handleEditChip = (chip: Chip) => {
    setSelectedChip(chip);
    setShowAddModal(true);
  };

  // Função para excluir chip
  const handleDeleteChip = async (chipId: string) => {
    if (!confirm('Tem certeza que deseja excluir este chip?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('chips')
        .delete()
        .eq('id', chipId);

      if (error) throw error;

      // Recarregar lista
      await fetchChips();
    } catch (error: any) {
      console.error('Erro ao excluir chip:', error);
      alert('Erro ao excluir chip: ' + error.message);
    }
  };

  // Função para sucesso do modal
  const handleModalSuccess = (newDepartment?: string) => {
    fetchChips();
    if (newDepartment) {
      addDepartmentToList(newDepartment);
    } else {
      fetchDepartments(); // Atualizar departamentos também
    }
    setSelectedChip(null);
  };

  // Função para fechar modal
  const handleCloseModal = () => {
    setShowAddModal(false);
    setSelectedChip(null);
  };

  const filteredChips = chips.filter(chip => {
    const matchesSearch = chip.phoneNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         chip.currentUser.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCompany = !filterCompany || chip.company === filterCompany;
    const matchesDepartment = !filterDepartment || chip.department === filterDepartment;
    const matchesStatus = !filterStatus || chip.status === filterStatus;

    return matchesSearch && matchesCompany && matchesDepartment && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'bg-green-100 text-green-800';
      case 'inativo': return 'bg-gray-100 text-gray-800';
      case 'bloqueado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalCost = chips.reduce((sum, chip) => sum + chip.monthlyCost, 0);
  const activeChips = chips.filter(chip => chip.status === 'ativo').length;

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando chips...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Erro ao carregar chips</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchChips}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 via-white to-green-50 rounded-2xl shadow-lg p-8 border border-green-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-2xl shadow-lg">
              <Smartphone className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                Controle de Chips
              </h1>
              <p className="text-gray-600 mt-2 text-lg">Gerencie os chips de celular da empresa</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={fetchChips}
              className="bg-white text-green-600 px-6 py-3 rounded-xl hover:bg-green-50 flex items-center shadow-md hover:shadow-lg transition-all duration-200 border border-green-200"
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Atualizar
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-green-800 flex items-center shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus className="h-5 w-5 mr-2" />
              Novo Chip
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50 rounded-2xl p-4 shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center min-w-0 flex-1">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-xl shadow-md flex-shrink-0">
                <Phone className="h-5 w-5 text-white" />
              </div>
              <div className="ml-3 min-w-0 flex-1">
                <p className="text-xs font-medium text-blue-600">Total de Chips</p>
                <p className="text-2xl font-bold text-blue-800">{chips.length}</p>
              </div>
            </div>
            <TrendingUp className="h-6 w-6 text-blue-300 flex-shrink-0" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 via-white to-green-50 rounded-2xl p-4 shadow-lg border border-green-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center min-w-0 flex-1">
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-2 rounded-xl shadow-md flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <div className="ml-3 min-w-0 flex-1">
                <p className="text-xs font-medium text-green-600">Chips Ativos</p>
                <p className="text-2xl font-bold text-green-800">{activeChips}</p>
              </div>
            </div>
            <TrendingUp className="h-6 w-6 text-green-300 flex-shrink-0" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 via-white to-purple-50 rounded-2xl p-4 shadow-lg border border-purple-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center min-w-0 flex-1">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-2 rounded-xl shadow-md flex-shrink-0">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div className="ml-3 min-w-0 flex-1">
                <p className="text-xs font-medium text-purple-600">Empresas</p>
                <p className="text-2xl font-bold text-purple-800">{companies.length}</p>
              </div>
            </div>
            <TrendingUp className="h-6 w-6 text-purple-300 flex-shrink-0" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 via-white to-yellow-50 rounded-2xl p-4 shadow-lg border border-yellow-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center min-w-0 flex-1">
              <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-2 rounded-xl shadow-md flex-shrink-0">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div className="ml-3 min-w-0 flex-1">
                <p className="text-xs font-medium text-yellow-600">Custo Mensal</p>
                <p className="text-2xl font-bold text-yellow-800 truncate">R$ {totalCost >= 10000 ? `${(totalCost / 1000).toFixed(0)}k` : totalCost.toFixed(2)}</p>
              </div>
            </div>
            <TrendingUp className="h-6 w-6 text-yellow-300 flex-shrink-0" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gradient-to-r from-gray-50 via-white to-gray-50 rounded-2xl shadow-lg p-8 border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-br from-gray-500 to-gray-600 p-2 rounded-lg">
            <Filter className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Filtros e Busca</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Buscar</label>
            <div className="relative">
              <Search className="h-5 w-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Número ou usuário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Empresa</label>
            <select
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
            >
              <option value="">Todas as empresas</option>
              {companies.map(company => (
                <option key={company} value={company}>{company}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Departamento</label>
            <div className="relative">
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md appearance-none cursor-pointer"
              >
                <option value="">Todos os departamentos</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
            >
              <option value="">Todos os status</option>
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Chips Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-gray-500 to-gray-600 p-2 rounded-lg">
                <Phone className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Lista de Chips</h2>
            </div>
            <div className="text-sm text-gray-500">
              {filteredChips.length} de {chips.length} chips
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Chip
                </th>
                <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-2 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-2 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Custo
                </th>
                <th className="px-2 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredChips.map((chip) => (
                <tr key={chip.id} className="hover:bg-blue-50 transition-colors duration-200">
                  <td className="px-2 py-3">
                    <div className="flex items-center">
                      <div className="bg-blue-100 p-1 rounded-lg mr-2 flex-shrink-0">
                        <Phone className="h-3 w-3 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-gray-900 truncate">{chip.phoneNumber}</div>
                        <div className="text-xs text-gray-500 truncate">{chip.plan}</div>
                        <div className="text-xs text-gray-500 truncate">{chip.company} • {chip.department}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex items-center">
                      <div className="bg-gray-100 p-1 rounded-full mr-2 flex-shrink-0">
                        <Users className="h-3 w-3 text-gray-600" />
                      </div>
                      <span className="text-sm text-gray-600 truncate">{chip.currentUser}</span>
                    </div>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(chip.status)}`}>
                      {chip.status === 'ativo' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {chip.status === 'inativo' && <XCircle className="h-3 w-3 mr-1" />}
                      {chip.status === 'bloqueado' && <AlertCircle className="h-3 w-3 mr-1" />}
                      {chip.status}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">R$ {chip.monthlyCost >= 10000 ? `${(chip.monthlyCost / 1000).toFixed(0)}k` : chip.monthlyCost.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">{new Date(chip.lastUpdate).toLocaleDateString('pt-BR')}</div>
                    </div>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <button className="p-1 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-200" title="Visualizar">
                        <Eye className="h-3 w-3" />
                      </button>
                      <button 
                        onClick={() => handleEditChip(chip)}
                        className="p-1 text-green-600 hover:bg-green-100 rounded-lg transition-colors duration-200" 
                        title="Editar"
                      >
                        <Edit className="h-3 w-3" />
                      </button>
                      <button 
                        onClick={() => handleDeleteChip(chip.id)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-200" 
                        title="Excluir"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredChips.length === 0 && (
        <div className="bg-gradient-to-br from-gray-50 via-white to-gray-50 rounded-2xl shadow-lg p-12 text-center border border-gray-100">
          <div className="bg-gray-100 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <Smartphone className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Nenhum chip encontrado</h3>
          <p className="text-gray-500 mb-6">Tente ajustar os filtros ou adicione um novo chip ao sistema.</p>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 flex items-center mx-auto shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="h-5 w-5 mr-2" />
            Adicionar Primeiro Chip
          </button>
        </div>
      )}

      {/* Modal de Adicionar Chip */}
      <AddChipModal
        isOpen={showAddModal}
        onClose={handleCloseModal}
        onSuccess={handleModalSuccess}
        editChip={selectedChip}
        departments={departments}
      />
    </div>
  );
}
