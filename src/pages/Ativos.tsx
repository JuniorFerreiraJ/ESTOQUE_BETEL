import { useState, useEffect } from 'react';
import { 
  Laptop,
  Smartphone,
  Tablet,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Users,
  DollarSign,
  Shield,
  TrendingUp,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Clock,
  AlertCircle,
  KeyRound
} from 'lucide-react';
import AddAssetModal from '../components/AddAssetModal';
import { supabase } from '../lib/supabaseClient';

interface Asset {
  id: string;
  assetType: 'notebook' | 'celular' | 'tablet' | 'outros';
  brand: string;
  model: string;
  serialNumber: string;
  department: string;
  currentUser: string;
  status: 'ativo' | 'inativo' | 'manutencao' | 'fora_uso';
  purchaseDate: string;
  purchaseValue: number;
  warrantyExpiry: string;
  lastUpdate: string;
  password?: string;
}

export default function Ativos() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [isDeptOpen, setIsDeptOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [viewAsset, setViewAsset] = useState<Asset | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const assetTypes = ['notebook', 'celular', 'tablet', 'outros'];
  const [departments, setDepartments] = useState<string[]>([]);
  const statuses = ['ativo', 'inativo', 'manutencao', 'fora_uso'];

  // Buscar ativos do banco de dados
  const fetchAssets = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        // Converter dados do banco para o formato da interface
        const formattedAssets: Asset[] = data.map(item => ({
          id: item.id,
          assetType: item.asset_type,
          brand: item.brand,
          model: item.model,
          serialNumber: item.serial_number,
          department: item.department,
          currentUser: item.current_user_name,
          status: item.status,
          purchaseDate: item.delivery_date,
          purchaseValue: item.purchase_value,
          warrantyExpiry: item.warranty_expiry,
          lastUpdate: item.updated_at,
          password: item.password ?? undefined
        }));
        setAssets(formattedAssets);
      }
    } catch (error: any) {
      console.error('Erro ao buscar ativos:', error);
      setError(error.message || 'Erro ao carregar ativos');
    } finally {
      setLoading(false);
    }
  };

  // Buscar departamentos únicos dos ativos (igual ao chips)
  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('assets')
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

  // Carregar dados na inicialização
  useEffect(() => {
    fetchAssets();
    fetchDepartments();
  }, []);

  // Função para editar ativo
  const handleEditAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setShowAddModal(true);
  };

  // Função para excluir ativo
  const handleDeleteAsset = async (assetId: string) => {
    if (!confirm('Tem certeza que deseja excluir este ativo?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', assetId);

      if (error) throw error;

      // Recarregar lista
      await fetchAssets();
    } catch (error: any) {
      console.error('Erro ao excluir ativo:', error);
      alert('Erro ao excluir ativo: ' + error.message);
    }
  };

  // (não utilizado)

  // Função para sucesso do modal
  const handleModalSuccess = () => {
    fetchAssets();
    fetchDepartments(); // Recarregar departamentos do banco
    setSelectedAsset(null);
  };

  // Função para fechar modal
  const handleCloseModal = () => {
    setShowAddModal(false);
    setSelectedAsset(null);
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.currentUser.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || asset.assetType === filterType;
    const matchesDepartment = !filterDepartment || asset.department === filterDepartment;
    const matchesStatus = !filterStatus || asset.status === filterStatus;

    return matchesSearch && matchesType && matchesDepartment && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'bg-green-100 text-green-800';
      case 'inativo': return 'bg-gray-100 text-gray-800';
      case 'manutencao': return 'bg-yellow-100 text-yellow-800';
      case 'fora_uso': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'notebook': return <Laptop className="h-5 w-5" />;
      case 'celular': return <Smartphone className="h-5 w-5" />;
      case 'tablet': return <Tablet className="h-5 w-5" />;
      default: return <Laptop className="h-5 w-5" />;
    }
  };

  // Calcular estatísticas baseadas nos filtros
  const getFilteredAssets = () => {
    let filtered = assets;
    
    if (filterType) {
      filtered = filtered.filter(asset => asset.assetType === filterType);
    }
    
    if (filterDepartment) {
      filtered = filtered.filter(asset => asset.department === filterDepartment);
    }
    
    if (filterStatus) {
      filtered = filtered.filter(asset => asset.status === filterStatus);
    }
    
    return filtered;
  };

  const filteredAssetsForStats = getFilteredAssets();
  const totalValue = filteredAssetsForStats.reduce((sum, asset) => sum + asset.purchaseValue, 0);
  const activeAssets = filteredAssetsForStats.filter(asset => asset.status === 'ativo').length;
  const maintenanceAssets = filteredAssetsForStats.filter(asset => asset.status === 'manutencao').length;
  const outOfUseAssets = filteredAssetsForStats.filter(asset => asset.status === 'fora_uso').length;
  const totalAssets = filteredAssetsForStats.length;

  // Check warranty expiry (within 30 days)
  const warrantyExpiringSoon = assets.filter(asset => {
    if (!asset.warrantyExpiry) return false;
    const expiryDate = new Date(asset.warrantyExpiry);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  }).length;

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando ativos...</p>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Erro ao carregar ativos</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchAssets}
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
              <Laptop className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                Controle de Ativos
              </h1>
              <p className="text-gray-600 mt-2 text-lg">Gerencie notebooks, celulares e outros equipamentos</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="bg-white text-green-600 px-6 py-3 rounded-xl hover:bg-green-50 flex items-center shadow-md hover:shadow-lg transition-all duration-200 border border-green-200">
              <RefreshCw className="h-5 w-5 mr-2" />
              Atualizar
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-green-800 flex items-center shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus className="h-5 w-5 mr-2" />
              Novo Ativo
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50 rounded-xl p-5 shadow-md border border-blue-100 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center min-w-0 flex-1">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-1.5 rounded-lg shadow-sm flex-shrink-0">
                <Laptop className="h-4 w-4 text-white" />
              </div>
              <div className="ml-2 min-w-0 flex-1">
                <p className="text-xs font-medium text-blue-600">
                  {filterType ? 'Ativos' : 'Total de Ativos'}
                </p>
                <p className="text-lg font-bold text-blue-800">{totalAssets}</p>
                {filterType && (
                  <p className="text-xs text-blue-500">
                    {assets.filter(a => a.assetType === filterType).length} total
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
                  {filterStatus ? 'Ativos' : 'Ativos Ativos'}
                </p>
                <p className="text-lg font-bold text-green-800">{activeAssets}</p>
                {filterStatus && (
                  <p className="text-xs text-green-500">
                    {assets.filter(a => a.status === 'ativo').length} total
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
                <Clock className="h-4 w-4 text-white" />
              </div>
              <div className="ml-2 min-w-0 flex-1">
                <p className="text-xs font-medium text-yellow-600">
                  {filterStatus ? 'Manutenção' : 'Em Manutenção'}
                </p>
                <p className="text-lg font-bold text-yellow-800">{maintenanceAssets}</p>
                {filterStatus && (
                  <p className="text-xs text-yellow-500">
                    {assets.filter(a => a.status === 'manutencao').length} total
                  </p>
                )}
              </div>
            </div>
            <TrendingUp className="h-4 w-4 text-yellow-300 flex-shrink-0" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 via-white to-red-50 rounded-xl p-5 shadow-md border border-red-100 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center min-w-0 flex-1">
              <div className="bg-gradient-to-br from-red-500 to-red-600 p-1.5 rounded-lg shadow-sm flex-shrink-0">
                <XCircle className="h-4 w-4 text-white" />
              </div>
              <div className="ml-2 min-w-0 flex-1">
                <p className="text-xs font-medium text-red-600">
                  {filterStatus ? 'Fora de Uso' : 'Fora de Uso'}
                </p>
                <p className="text-lg font-bold text-red-800">{outOfUseAssets}</p>
                {filterStatus && (
                  <p className="text-xs text-red-500">
                    {assets.filter(a => a.status === 'fora_uso').length} total
                  </p>
                )}
              </div>
            </div>
            <TrendingUp className="h-4 w-4 text-red-300 flex-shrink-0" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 via-white to-purple-50 rounded-xl p-5 shadow-md border border-purple-100 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center min-w-0 flex-1">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-1.5 rounded-lg shadow-sm flex-shrink-0">
                <DollarSign className="h-4 w-4 text-white" />
              </div>
              <div className="ml-2 min-w-0 flex-1">
                <p className="text-xs font-medium text-purple-600">
                  {filterType || filterDepartment || filterStatus ? 'Valor' : 'Valor Total'}
                </p>
                <p className="text-lg font-bold text-purple-800 truncate">R$ {totalValue >= 10000 ? `${(totalValue / 1000).toFixed(0)}k` : totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                {(filterType || filterDepartment || filterStatus) && (
                  <p className="text-xs text-purple-500">
                    R$ {assets.reduce((sum, a) => sum + a.purchaseValue, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} total
                  </p>
                )}
              </div>
            </div>
            <TrendingUp className="h-4 w-4 text-purple-300 flex-shrink-0" />
          </div>
        </div>
      </div>

      {/* Warranty Alert */}
      {warrantyExpiringSoon > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 via-yellow-100 to-yellow-50 border border-yellow-200 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-3 rounded-xl shadow-md">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-yellow-800">Atenção: Garantias Expirando</h3>
              <p className="text-yellow-700 mt-1">
                {warrantyExpiringSoon} ativo(s) com garantia expirando em até 30 dias. Verifique a necessidade de renovação.
              </p>
            </div>
          </div>
        </div>
      )}

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
                placeholder="Marca, modelo, serial ou usuário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Tipo</label>
            <div
              className="relative"
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsTypeOpen(false);
              }}
            >
              <button
                type="button"
                onClick={() => setIsTypeOpen(!isTypeOpen)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between bg-white shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
              >
                <span className={`flex items-center gap-2 ${filterType ? 'text-gray-900' : 'text-gray-500'}`}>
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow ring-1 ring-blue-400/30">
                    <Laptop className="w-4 h-4" />
                  </span>
                  {filterType ? (
                    filterType === 'notebook' ? 'Notebook' : 
                    filterType === 'celular' ? 'Celular' : 
                    filterType === 'tablet' ? 'Tablet' : 
                    filterType === 'outros' ? 'Outros' : filterType
                  ) : 'Todos os tipos'}
                </span>
                <svg
                  className={`w-5 h-5 text-gray-400 transform transition-transform ${isTypeOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isTypeOpen && (
                <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                  <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                    <button
                      type="button"
                      className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition ${filterType === '' ? 'bg-green-50' : ''}`}
                      onClick={() => { setFilterType(''); setIsTypeOpen(false); }}
                    >
                      <span className="flex items-center gap-2 text-gray-700">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow ring-1 ring-blue-400/30">
                          <Laptop className="w-4 h-4" />
                        </span>
                        Todos os tipos
                      </span>
                      {filterType === '' && (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                    </button>

                    {assetTypes.map((type) => (
                      <button
                        key={type}
                        type="button"
                        className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition ${filterType === type ? 'bg-green-50' : ''}`}
                        title={type}
                        onClick={() => { setFilterType(type); setIsTypeOpen(false); }}
                      >
                        <span className="flex items-center gap-2 text-gray-700">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow ring-1 ring-blue-400/30">
                            {type === 'notebook' && <Laptop className="w-4 h-4" />}
                            {type === 'celular' && <Smartphone className="w-4 h-4" />}
                            {type === 'tablet' && <Tablet className="w-4 h-4" />}
                            {type === 'outros' && <Laptop className="w-4 h-4" />}
                          </span>
                          <span className="truncate capitalize">
                            {type === 'notebook' ? 'Notebook' : 
                             type === 'celular' ? 'Celular' : 
                             type === 'tablet' ? 'Tablet' : 
                             type === 'outros' ? 'Outros' : type}
                          </span>
                        </span>
                        {filterType === type && (
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
                className="w-full border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between bg-white shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
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

                    {departments.map((dept) => (
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
                className="w-full border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between bg-white shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
              >
                <span className={`flex items-center gap-2 ${filterStatus ? 'text-gray-900' : 'text-gray-500'}`}>
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow ring-1 ring-emerald-400/30">
                    <CheckCircle className="w-4 h-4" />
                  </span>
                  {filterStatus ? (
                    filterStatus === 'ativo' ? 'Ativo' : 
                    filterStatus === 'inativo' ? 'Inativo' : 
                    filterStatus === 'manutencao' ? 'Em Manutenção' : 
                    filterStatus === 'fora_uso' ? 'Fora de Uso' : filterStatus
                  ) : 'Todos os status'}
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
                          <span className="truncate capitalize">
                            {status === 'ativo' ? 'Ativo' : 
                             status === 'inativo' ? 'Inativo' : 
                             status === 'manutencao' ? 'Em Manutenção' : 
                             status === 'fora_uso' ? 'Fora de Uso' : status}
                          </span>
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

      {/* Assets Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl shadow-md">
                <Laptop className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Lista de Ativos</h2>
            </div>
            <div className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
              {filteredAssets.length} de {assets.length} ativos
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Equipamento
                </th>
                <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-2 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-2 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-2 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Garantia
                </th>
                <th className="px-2 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredAssets.map((asset) => {
                const hasWarranty = !!asset.warrantyExpiry;
                const warrantyExpiry = hasWarranty ? new Date(asset.warrantyExpiry) : null;
                const today = new Date();
                const diffTime = warrantyExpiry ? (warrantyExpiry.getTime() - today.getTime()) : 0;
                const diffDays = warrantyExpiry ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 0;
                const isWarrantyExpired = hasWarranty ? diffDays <= 0 : false;
                const isWarrantyExpiringSoon = hasWarranty ? (diffDays <= 30 && diffDays > 0) : false;

                return (
                  <tr key={asset.id} className="hover:bg-green-50 transition-colors duration-200">
                    <td className="px-2 py-3">
                      <div className="flex items-center">
                        <div className="bg-green-100 p-1 rounded-lg mr-2 flex-shrink-0">
                          {getAssetIcon(asset.assetType)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-gray-900 truncate">{asset.brand} {asset.model}</div>
                          <div className="text-xs text-gray-500 truncate">{asset.serialNumber}</div>
                          <div className="text-xs text-gray-500 truncate">{asset.department}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center">
                        <div className="bg-gray-100 p-1 rounded-full mr-2 flex-shrink-0">
                          <Users className="h-3 w-3 text-gray-600" />
                        </div>
                        <span className="text-sm text-gray-600 truncate">{asset.currentUser}</span>
                      </div>
                    </td>
                    <td className="px-2 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(asset.status)}`}>
                        {asset.status === 'ativo' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {asset.status === 'inativo' && <XCircle className="h-3 w-3 mr-1" />}
                        {asset.status === 'manutencao' && <Clock className="h-3 w-3 mr-1" />}
                        {asset.status === 'fora_uso' && <AlertCircle className="h-3 w-3 mr-1" />}
                        {asset.status}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-center">
                      <span className="text-sm font-semibold text-gray-900">R$ {asset.purchaseValue >= 10000 ? `${(asset.purchaseValue / 1000).toFixed(0)}k` : asset.purchaseValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </td>
                    <td className="px-2 py-3 text-center">
                      <div className="flex flex-col items-center">
                        {hasWarranty ? (
                          <span className={`text-xs font-medium ${
                            isWarrantyExpired ? 'text-red-600' : 
                            isWarrantyExpiringSoon ? 'text-yellow-600' : 
                            'text-gray-600'
                          }`}>
                            {warrantyExpiry && warrantyExpiry.toLocaleDateString('pt-BR')}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">Desconhecida</span>
                        )}
                        {isWarrantyExpired && (
                          <span className="text-xs text-red-600 font-medium">Expirada</span>
                        )}
                        {isWarrantyExpiringSoon && !isWarrantyExpired && (
                          <span className="text-xs text-yellow-600 font-medium">{diffDays}d</span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => {
                            setViewAsset(asset);
                            setShowPassword(false);
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                          title="Visualizar detalhes e senha"
                        >
                          <Eye className="h-3 w-3" />
                        </button>
                        <button 
                          onClick={() => handleEditAsset(asset)}
                          className="p-1 text-green-600 hover:bg-green-100 rounded-lg transition-colors duration-200" 
                          title="Editar"
                        >
                          <Edit className="h-3 w-3" />
                        </button>
                        <button 
                          onClick={() => handleDeleteAsset(asset.id)}
                          className="p-1 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-200" 
                          title="Excluir"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredAssets.length === 0 && (
        <div className="bg-gradient-to-br from-gray-50 via-white to-gray-50 rounded-2xl shadow-lg p-12 text-center border border-gray-100">
          <div className="bg-gray-100 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <Laptop className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Nenhum ativo encontrado</h3>
          <p className="text-gray-500 mb-6">Tente ajustar os filtros ou adicione um novo ativo ao sistema.</p>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-green-800 flex items-center mx-auto shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="h-5 w-5 mr-2" />
            Adicionar Primeiro Ativo
          </button>
        </div>
      )}

      {/* Modal de Visualizar Ativo (detalhes + senha) */}
      {viewAsset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500 p-2 rounded-xl">
                  <Eye className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-blue-900">Detalhes do Ativo</h2>
              </div>
              <button
                onClick={() => { setViewAsset(null); setShowPassword(false); }}
                className="p-2 text-blue-600 hover:bg-blue-200 rounded-lg transition-colors"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500 block">Equipamento</span>
                  <span className="font-medium text-gray-900">{viewAsset.brand} {viewAsset.model}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Serial</span>
                  <span className="font-medium text-gray-900">{viewAsset.serialNumber}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Usuário</span>
                  <span className="font-medium text-gray-900">{viewAsset.currentUser}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Departamento</span>
                  <span className="font-medium text-gray-900">{viewAsset.department}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Status</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(viewAsset.status)}`}>
                    {viewAsset.status}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">Valor</span>
                  <span className="font-medium text-gray-900">R$ {viewAsset.purchaseValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                {viewAsset.warrantyExpiry && (
                  <div>
                    <span className="text-gray-500 block">Garantia</span>
                    <span className="font-medium text-gray-900">{new Date(viewAsset.warrantyExpiry).toLocaleDateString('pt-BR')}</span>
                  </div>
                )}
              </div>
              <div className="pt-4 border-t border-gray-200">
                <span className="text-gray-500 block text-sm mb-2 flex items-center gap-2">
                  <KeyRound className="h-4 w-4" />
                  Senha do ativo
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-mono text-gray-800">
                    {viewAsset.password
                      ? (showPassword ? viewAsset.password : '••••••••••••')
                      : '— Não cadastrada'}
                  </div>
                  {viewAsset.password && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-2 rounded-xl bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                      title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Adicionar Ativo */}
      <AddAssetModal
        isOpen={showAddModal}
        onClose={handleCloseModal}
        onSuccess={handleModalSuccess}
        editAsset={selectedAsset}
        departments={departments}
      />
    </div>
  );
}
