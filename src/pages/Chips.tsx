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
  const [isCompanyOpen, setIsCompanyOpen] = useState(false);
  const [isDeptOpen, setIsDeptOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
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

  // Filtrar departamentos baseado na empresa selecionada
  const getFilteredDepartments = () => {
    if (!filterCompany) return departments;
    return departments.filter(dept => {
      // Verificar se existe pelo menos um chip com essa empresa e departamento
      return chips.some(chip => chip.company === filterCompany && chip.department === dept);
    });
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

  // Limpar filtro de departamento quando empresa mudar
  useEffect(() => {
    if (filterDepartment && !getFilteredDepartments().includes(filterDepartment)) {
      setFilterDepartment('');
    }
  }, [filterCompany, filterDepartment, departments, chips]);

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

  // Calcular estatísticas baseadas no filtro de empresa
  const getFilteredChips = () => {
    if (!filterCompany) return chips;
    return chips.filter(chip => chip.company === filterCompany);
  };

  const filteredChipsForStats = getFilteredChips();
  const totalCost = filteredChipsForStats.reduce((sum, chip) => sum + chip.monthlyCost, 0);
  const activeChips = filteredChipsForStats.filter(chip => chip.status === 'ativo').length;
  const totalChips = filteredChipsForStats.length;
  
  // Estatísticas por empresa
  const claroChips = chips.filter(chip => chip.company === 'Claro');
  const vivoChips = chips.filter(chip => chip.company === 'Vivo');
  const claroCost = claroChips.reduce((sum, chip) => sum + chip.monthlyCost, 0);
  const vivoCost = vivoChips.reduce((sum, chip) => sum + chip.monthlyCost, 0);

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50 rounded-xl p-7 shadow-md border border-blue-100 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center min-w-0 flex-1">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-1.5 rounded-lg shadow-sm flex-shrink-0">
                <Phone className="h-4 w-4 text-white" />
              </div>
              <div className="ml-2 min-w-0 flex-1">
                <p className="text-xs font-medium text-blue-600">
                  {filterCompany ? 'Chips' : 'Total de Chips'}
                </p>
                <p className="text-lg font-bold text-blue-800">{totalChips}</p>
                {filterCompany && (
                  <p className="text-xs text-blue-500">
                    {filterCompany === 'Claro' ? `${claroChips.length} total` : `${vivoChips.length} total`}
                  </p>
                )}
              </div>
            </div>
            <TrendingUp className="h-4 w-4 text-blue-300 flex-shrink-0" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 via-white to-green-50 rounded-xl p-5 shadow-md border border-green-100 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center min-w-0 flex-1">
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-1.5 rounded-lg shadow-sm flex-shrink-0">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
              <div className="ml-2 min-w-0 flex-1">
                <p className="text-xs font-medium text-green-600">
                  {filterCompany ? 'Ativos' : 'Chips Ativos'}
                </p>
                <p className="text-lg font-bold text-green-800">{activeChips}</p>
                {filterCompany && (
                  <p className="text-xs text-green-500">
                    {filterCompany === 'Claro' 
                      ? `${claroChips.filter(c => c.status === 'ativo').length} ativos` 
                      : `${vivoChips.filter(c => c.status === 'ativo').length} ativos`
                    }
                  </p>
                )}
              </div>
            </div>
            <TrendingUp className="h-4 w-4 text-green-300 flex-shrink-0" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 via-white to-green-50 rounded-xl p-5 shadow-md border border-green-100 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center min-w-0 flex-1">
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-1.5 rounded-lg shadow-sm flex-shrink-0">
                <Building2 className="h-4 w-4 text-white" />
              </div>
              <div className="ml-2 min-w-0 flex-1">
                <p className="text-xs font-medium text-green-600">
                  {filterCompany ? 'Departamentos' : 'Empresas'}
                </p>
                <p className="text-lg font-bold text-green-800">
                  {filterCompany 
                    ? Array.from(new Set(filteredChipsForStats.map(c => c.department))).length
                    : companies.length
                  }
                </p>
                {filterCompany && (
                  <p className="text-xs text-green-500 truncate">
                    {Array.from(new Set(filteredChipsForStats.map(c => c.department))).join(', ') || 'Nenhum'}
                  </p>
                )}
              </div>
            </div>
            <TrendingUp className="h-4 w-4 text-green-300 flex-shrink-0" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 via-white to-yellow-50 rounded-xl p-5 shadow-md border border-yellow-100 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center min-w-0 flex-1">
              <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-1.5 rounded-lg shadow-sm flex-shrink-0">
                <DollarSign className="h-4 w-4 text-white" />
              </div>
              <div className="ml-2 min-w-0 flex-1">
                <p className="text-xs font-medium text-yellow-600">
                  {filterCompany ? 'Custo' : 'Custo Mensal'}
                </p>
                <p className="text-lg font-bold text-yellow-800 truncate">
                  R$ {totalCost >= 10000 ? `${(totalCost / 1000).toFixed(0)}k` : totalCost.toFixed(2)}
                </p>
                {filterCompany && (
                  <p className="text-xs text-yellow-500">
                    {filterCompany === 'Claro' 
                      ? `R$ ${claroCost >= 10000 ? `${(claroCost / 1000).toFixed(0)}k` : claroCost.toFixed(2)} total`
                      : `R$ ${vivoCost >= 10000 ? `${(vivoCost / 1000).toFixed(0)}k` : vivoCost.toFixed(2)} total`
                    }
                  </p>
                )}
              </div>
            </div>
            <TrendingUp className="h-4 w-4 text-yellow-300 flex-shrink-0" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gradient-to-r from-gray-50 via-white to-gray-50 rounded-2xl shadow-lg p-8 border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl shadow-md">
            <Filter className="h-6 w-6 text-white" />
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
            <div
              className="relative"
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsCompanyOpen(false);
              }}
            >
              <button
                type="button"
                onClick={() => setIsCompanyOpen(!isCompanyOpen)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between bg-white shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <span className={`flex items-center gap-2 ${filterCompany ? 'text-gray-900' : 'text-gray-500'}`}>
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow ring-1 ring-purple-400/30">
                    <Building2 className="w-4 h-4" />
                  </span>
                  {filterCompany || 'Todas as empresas'}
                </span>
                <svg
                  className={`w-5 h-5 text-gray-400 transform transition-transform ${isCompanyOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isCompanyOpen && (
                <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                  <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                    <button
                      type="button"
                      className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition ${filterCompany === '' ? 'bg-green-50' : ''}`}
                      onClick={() => { setFilterCompany(''); setIsCompanyOpen(false); }}
                    >
                      <span className="flex items-center gap-2 text-gray-700">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow ring-1 ring-purple-400/30">
                          <Building2 className="w-4 h-4" />
                        </span>
                        Todas as empresas
                      </span>
                      {filterCompany === '' && (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                    </button>

                    {companies.map((company) => (
                      <button
                        key={company}
                        type="button"
                        className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition ${filterCompany === company ? 'bg-green-50' : ''}`}
                        title={company}
                        onClick={() => { setFilterCompany(company); setIsCompanyOpen(false); }}
                      >
                        <span className="flex items-center gap-2 text-gray-700">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow ring-1 ring-purple-400/30">
                            <Building2 className="w-4 h-4" />
                          </span>
                          <span className="truncate">{company}</span>
                        </span>
                        {filterCompany === company && (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Departamento</label>
            <div
              className="relative"
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDeptOpen(false);
              }}
            >
              <button
                type="button"
                onClick={() => setIsDeptOpen(!isDeptOpen)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between bg-white shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <span className={`flex items-center gap-2 ${filterDepartment ? 'text-gray-900' : 'text-gray-500'}`}>
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow ring-1 ring-orange-400/30">
                    <Users className="w-4 h-4" />
                  </span>
                  {filterDepartment || 'Todos os departamentos'}
                </span>
                <svg
                  className={`w-5 h-5 text-gray-400 transform transition-transform ${isDeptOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isDeptOpen && (
                <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                  <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                    <button
                      type="button"
                      className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition ${filterDepartment === '' ? 'bg-green-50' : ''}`}
                      onClick={() => { setFilterDepartment(''); setIsDeptOpen(false); }}
                    >
                      <span className="flex items-center gap-2 text-gray-700">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow ring-1 ring-orange-400/30">
                          <Users className="w-4 h-4" />
                        </span>
                        Todos os departamentos
                      </span>
                      {filterDepartment === '' && (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                    </button>

                    {getFilteredDepartments().map((dept) => (
                      <button
                        key={dept}
                        type="button"
                        className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition ${filterDepartment === dept ? 'bg-green-50' : ''}`}
                        title={dept}
                        onClick={() => { setFilterDepartment(dept); setIsDeptOpen(false); }}
                      >
                        <span className="flex items-center gap-2 text-gray-700">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow ring-1 ring-orange-400/30">
                            <Users className="w-4 h-4" />
                          </span>
                          <span className="truncate">{dept}</span>
                        </span>
                        {filterDepartment === dept && (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Status</label>
            <div
              className="relative"
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsStatusOpen(false);
              }}
            >
              <button
                type="button"
                onClick={() => setIsStatusOpen(!isStatusOpen)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between bg-white shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <span className={`flex items-center gap-2 ${filterStatus ? 'text-gray-900' : 'text-gray-500'}`}>
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow ring-1 ring-emerald-400/30">
                    <CheckCircle className="w-4 h-4" />
                  </span>
                  {filterStatus || 'Todos os status'}
                </span>
                <svg
                  className={`w-5 h-5 text-gray-400 transform transition-transform ${isStatusOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isStatusOpen && (
                <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                  <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                    <button
                      type="button"
                      className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition ${filterStatus === '' ? 'bg-green-50' : ''}`}
                      onClick={() => { setFilterStatus(''); setIsStatusOpen(false); }}
                    >
                      <span className="flex items-center gap-2 text-gray-700">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow ring-1 ring-emerald-400/30">
                          <CheckCircle className="w-4 h-4" />
                        </span>
                        Todos os status
                      </span>
                      {filterStatus === '' && (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                    </button>

                    {statuses.map((status) => (
                      <button
                        key={status}
                        type="button"
                        className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition ${filterStatus === status ? 'bg-green-50' : ''}`}
                        title={status}
                        onClick={() => { setFilterStatus(status); setIsStatusOpen(false); }}
                      >
                        <span className="flex items-center gap-2 text-gray-700">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow ring-1 ring-emerald-400/30">
                            <CheckCircle className="w-4 h-4" />
                          </span>
                          <span className="truncate capitalize">{status}</span>
                        </span>
                        {filterStatus === status && (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chips Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-md">
                <Phone className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Lista de Chips</h2>
            </div>
            <div className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
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
