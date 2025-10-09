import React, { useState, useEffect } from 'react';
import { X, Laptop, Building2, Users, DollarSign, Calendar, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editAsset?: any;
  departments?: any[];
}

interface FormData {
  assetType: string;
  brand: string;
  model: string;
  serialNumber: string;
  department: string;
  currentUser: string;
  status: string;
  purchaseDate: string;
  purchaseValue: string;
  warrantyExpiry: string;
}

export default function AddAssetModal({ isOpen, onClose, onSuccess, editAsset, departments = [] }: AddAssetModalProps) {
  const [formData, setFormData] = useState<FormData>({
    assetType: 'notebook',
    brand: '',
    model: '',
    serialNumber: '',
    department: '',
    currentUser: '',
    status: 'ativo',
    purchaseDate: '',
    purchaseValue: '',
    warrantyExpiry: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const assetTypes = ['notebook', 'celular', 'tablet', 'outros'];
  const statuses = ['ativo', 'inativo', 'manutencao', 'fora_uso'];

  // Reset form when modal opens/closes or when editing
  useEffect(() => {
    if (isOpen) {
      if (editAsset) {
        setFormData({
          assetType: editAsset.asset_type || 'notebook',
          brand: editAsset.brand || '',
          model: editAsset.model || '',
          serialNumber: editAsset.serial_number || '',
          department: editAsset.department || '',
          currentUser: editAsset.current_user_name || '',
          status: editAsset.status || 'ativo',
          purchaseDate: editAsset.delivery_date || '',
          purchaseValue: editAsset.purchase_value?.toString() || '',
          warrantyExpiry: editAsset.warranty_expiry || ''
        });
      } else {
        setFormData({
          assetType: 'notebook',
          brand: '',
          model: '',
          serialNumber: '',
          department: '',
          currentUser: '',
          status: 'ativo',
          purchaseDate: '',
          purchaseValue: '',
          warrantyExpiry: ''
        });
      }
      setError(null);
      setSuccess(false);
      setValidationErrors({});
    }
  }, [isOpen, editAsset]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Validar campos obrigatórios
    if (!formData.brand.trim()) errors.brand = 'Marca é obrigatória';
    if (!formData.model.trim()) errors.model = 'Modelo é obrigatório';
    if (!formData.serialNumber.trim()) errors.serialNumber = 'Número de série é obrigatório';
    if (!formData.department) errors.department = 'Departamento é obrigatório';
    if (!formData.currentUser.trim()) errors.currentUser = 'Usuário é obrigatório';
    if (!formData.purchaseDate) errors.purchaseDate = 'Data de entrega é obrigatória';
    if (!formData.purchaseValue || parseFloat(formData.purchaseValue) <= 0) {
      errors.purchaseValue = 'Valor de compra deve ser maior que zero';
    }
    if (!formData.warrantyExpiry) errors.warrantyExpiry = 'Vencimento da garantia é obrigatório';

    // Validar datas
    if (formData.purchaseDate && formData.warrantyExpiry) {
      const deliveryDate = new Date(formData.purchaseDate);
      const warrantyDate = new Date(formData.warrantyExpiry);
      
      if (warrantyDate <= deliveryDate) {
        errors.warrantyExpiry = 'Garantia deve ser posterior à data de entrega';
      }
    }

    // Validar data de entrega não pode ser futura
    if (formData.purchaseDate) {
      const deliveryDate = new Date(formData.purchaseDate);
      const today = new Date();
      if (deliveryDate > today) {
        errors.purchaseDate = 'Data de entrega não pode ser futura';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const assetData = {
        asset_type: formData.assetType,
        brand: formData.brand.trim(),
        model: formData.model.trim(),
        serial_number: formData.serialNumber.trim(),
        department: formData.department,
        current_user_name: formData.currentUser.trim(),
        status: formData.status,
        delivery_date: formData.purchaseDate,
        purchase_value: parseFloat(formData.purchaseValue),
        warranty_expiry: formData.warrantyExpiry,
        created_by: 'Sistema', // TODO: Pegar do contexto de usuário
        updated_by: 'Sistema'
      };

      if (editAsset) {
        // Atualizar ativo existente
        const { error } = await supabase
          .from('assets')
          .update(assetData)
          .eq('id', editAsset.id);

        if (error) throw error;

        // Registrar no histórico
        await supabase
          .from('asset_history')
          .insert({
            asset_id: editAsset.id,
            action: 'updated',
            old_values: editAsset,
            new_values: assetData,
            description: `Ativo atualizado por ${assetData.updated_by}`,
            created_by: assetData.updated_by
          });

      } else {
        // Criar novo ativo
        const { data, error } = await supabase
          .from('assets')
          .insert(assetData)
          .select()
          .single();

        if (error) throw error;

        // Registrar no histórico
        await supabase
          .from('asset_history')
          .insert({
            asset_id: data.id,
            action: 'created',
            new_values: assetData,
            description: `Novo ativo criado por ${assetData.created_by}`,
            created_by: assetData.created_by
          });
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess(formData.department.trim()); // Passar o departamento criado
        onClose();
      }, 1500);

    } catch (error: any) {
      console.error('Erro ao salvar ativo:', error);
      setError(error.message || 'Erro ao salvar ativo');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Limpar erro de validação quando o usuário começar a digitar
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-50 to-green-100 px-8 py-6 rounded-t-2xl border-b border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl shadow-lg">
                <Laptop className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-green-800">Adicionar Novo Ativo</h2>
                <p className="text-green-600 mt-1">Cadastre um novo equipamento</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-green-600 hover:bg-green-200 rounded-lg transition-colors duration-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="text-green-800 font-medium">
                {editAsset ? 'Ativo atualizado com sucesso!' : 'Ativo cadastrado com sucesso!'}
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tipo de Ativo */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <Laptop className="h-4 w-4 inline mr-2" />
                Tipo de Ativo
              </label>
              <div className="relative">
                <select
                  name="assetType"
                  value={formData.assetType}
                  onChange={handleChange}
                  className={`w-full border rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 transition-all duration-200 appearance-none cursor-pointer ${
                    validationErrors.assetType 
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                  }`}
                  required
                >
                  <option value="">Selecione o tipo</option>
                  {assetTypes.map(type => (
                    <option key={type} value={type} className="capitalize">
                      {type === 'notebook' ? 'Notebook' : 
                       type === 'celular' ? 'Celular' : 
                       type === 'tablet' ? 'Tablet' : 
                       type === 'outros' ? 'Outros' : type}
                    </option>
                  ))}
                  <option value="custom">+ Adicionar novo tipo</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {validationErrors.assetType && (
                <p className="text-red-600 text-sm mt-1">{validationErrors.assetType}</p>
              )}
            </div>

            {/* Campo para novo tipo (aparece quando "custom" é selecionado) */}
            {formData.assetType === 'custom' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <Laptop className="h-4 w-4 inline mr-2" />
                  Novo Tipo de Ativo
                </label>
                <input
                  type="text"
                  name="customAssetType"
                  placeholder="Ex: Monitor, Impressora, Roteador..."
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                  onChange={(e) => {
                    if (e.target.value) {
                      setFormData(prev => ({
                        ...prev,
                        assetType: e.target.value.toLowerCase()
                      }));
                    }
                  }}
                />
              </div>
            )}

            {/* Departamento */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <Building2 className="h-4 w-4 inline mr-2" />
                Departamento
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="Digite o departamento (ex: TI, Comercial, etc.)"
                className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all duration-200 ${
                  validationErrors.department 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                }`}
                required
              />
              {validationErrors.department && (
                <p className="text-red-600 text-sm mt-1">{validationErrors.department}</p>
              )}
              {departments.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-2">Departamentos existentes:</p>
                  <div className="flex flex-wrap gap-2">
                    {departments.map(dept => (
                      <button
                        key={dept.id}
                        type="button"
                        onClick={() => setFormData({...formData, department: dept.name})}
                        className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
                      >
                        {dept.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Marca */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Marca
              </label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                placeholder="Ex: Dell, Samsung, Apple"
                className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all duration-200 ${
                  validationErrors.brand 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                }`}
                required
              />
              {validationErrors.brand && (
                <p className="text-red-600 text-sm mt-1">{validationErrors.brand}</p>
              )}
            </div>

            {/* Modelo */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Modelo
              </label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleChange}
                placeholder="Ex: Inspiron 15 3000"
                className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all duration-200 ${
                  validationErrors.model 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                }`}
                required
              />
              {validationErrors.model && (
                <p className="text-red-600 text-sm mt-1">{validationErrors.model}</p>
              )}
            </div>

            {/* Número de Série */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Número de Série
              </label>
              <input
                type="text"
                name="serialNumber"
                value={formData.serialNumber}
                onChange={handleChange}
                placeholder="Ex: DL123456789"
                className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all duration-200 ${
                  validationErrors.serialNumber 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                }`}
                required
              />
              {validationErrors.serialNumber && (
                <p className="text-red-600 text-sm mt-1">{validationErrors.serialNumber}</p>
              )}
            </div>

            {/* Usuário Atual */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <Users className="h-4 w-4 inline mr-2" />
                Usuário Atual
              </label>
              <input
                type="text"
                name="currentUser"
                value={formData.currentUser}
                onChange={handleChange}
                placeholder="Nome do usuário"
                className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all duration-200 ${
                  validationErrors.currentUser 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                }`}
                required
              />
              {validationErrors.currentUser && (
                <p className="text-red-600 text-sm mt-1">{validationErrors.currentUser}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Status
              </label>
              <div className="relative">
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 appearance-none cursor-pointer"
                >
                  {statuses.map(status => (
                    <option key={status} value={status} className="capitalize">
                      {status === 'ativo' ? 'Ativo' : 
                       status === 'inativo' ? 'Inativo' : 
                       status === 'manutencao' ? 'Em Manutenção' : 
                       status === 'fora_uso' ? 'Fora de Uso' : status}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Data de Entrega */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <Calendar className="h-4 w-4 inline mr-2" />
                Data de Entrega
              </label>
              <input
                type="date"
                name="purchaseDate"
                value={formData.purchaseDate}
                onChange={handleChange}
                className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all duration-200 ${
                  validationErrors.purchaseDate 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                }`}
                required
              />
              {validationErrors.purchaseDate && (
                <p className="text-red-600 text-sm mt-1">{validationErrors.purchaseDate}</p>
              )}
            </div>

            {/* Valor de Compra */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <DollarSign className="h-4 w-4 inline mr-2" />
                Valor de Compra (R$)
              </label>
              <input
                type="number"
                name="purchaseValue"
                value={formData.purchaseValue}
                onChange={handleChange}
                placeholder="2500.00"
                step="0.01"
                min="0"
                className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all duration-200 ${
                  validationErrors.purchaseValue 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                }`}
                required
              />
              {validationErrors.purchaseValue && (
                <p className="text-red-600 text-sm mt-1">{validationErrors.purchaseValue}</p>
              )}
            </div>

            {/* Vencimento da Garantia */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <Shield className="h-4 w-4 inline mr-2" />
                Vencimento da Garantia
              </label>
              <input
                type="date"
                name="warrantyExpiry"
                value={formData.warrantyExpiry}
                onChange={handleChange}
                className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all duration-200 ${
                  validationErrors.warrantyExpiry 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                }`}
                required
              />
              {validationErrors.warrantyExpiry && (
                <p className="text-red-600 text-sm mt-1">{validationErrors.warrantyExpiry}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              {loading 
                ? 'Salvando...' 
                : success 
                  ? 'Salvo!' 
                  : editAsset 
                    ? 'Atualizar Ativo' 
                    : 'Adicionar Ativo'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
