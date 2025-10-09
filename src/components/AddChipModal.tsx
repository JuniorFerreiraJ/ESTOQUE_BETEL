import React, { useState, useEffect } from 'react';
import { X, Smartphone, Building2, Users, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface AddChipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editChip?: any;
  departments?: string[];
}

interface FormData {
  phoneNumber: string;
  company: string;
  department: string;
  currentUser: string;
  status: string;
  plan: string;
  monthlyCost: string;
}

export default function AddChipModal({ isOpen, onClose, onSuccess, editChip, departments = [] }: AddChipModalProps) {
  const [formData, setFormData] = useState<FormData>({
    phoneNumber: '',
    company: '',
    department: '',
    currentUser: '',
    status: 'ativo',
    plan: '',
    monthlyCost: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const companies = ['Claro', 'Vivo'];
  const statuses = ['ativo', 'inativo', 'bloqueado'];

  // Reset form when modal opens/closes or when editing
  useEffect(() => {
    if (isOpen) {
      if (editChip) {
        setFormData({
          phoneNumber: editChip.phoneNumber || '',
          company: editChip.company || '',
          department: editChip.department || '',
          currentUser: editChip.currentUser || '',
          status: editChip.status || 'ativo',
          plan: editChip.plan || '',
          monthlyCost: editChip.monthlyCost?.toString() || ''
        });
      } else {
        setFormData({
          phoneNumber: '',
          company: '',
          department: '',
          currentUser: '',
          status: 'ativo',
          plan: '',
          monthlyCost: ''
        });
      }
      setError(null);
      setSuccess(false);
      setValidationErrors({});
    }
  }, [isOpen, editChip]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Validar campos obrigatórios
    if (!formData.phoneNumber.trim()) errors.phoneNumber = 'Número do telefone é obrigatório';
    if (!formData.company) errors.company = 'Empresa é obrigatória';
    if (!formData.department.trim()) errors.department = 'Departamento é obrigatório';
    if (!formData.currentUser.trim()) errors.currentUser = 'Usuário é obrigatório';
    if (!formData.plan.trim()) errors.plan = 'Plano é obrigatório';
    if (!formData.monthlyCost || parseFloat(formData.monthlyCost) < 0) {
      errors.monthlyCost = 'Custo mensal deve ser maior ou igual a zero';
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
      const chipData = {
        phone_number: formData.phoneNumber.trim(),
        company: formData.company,
        department: formData.department.trim(),
        current_user_name: formData.currentUser.trim(),
        status: formData.status,
        plan: formData.plan.trim(),
        monthly_cost: parseFloat(formData.monthlyCost),
        last_update: new Date().toISOString().split('T')[0],
        created_by: 'Sistema', // TODO: Pegar do contexto de usuário
        updated_by: 'Sistema'
      };

      if (editChip) {
        // Atualizar chip existente
        const { error } = await supabase
          .from('chips')
          .update(chipData)
          .eq('id', editChip.id);

        if (error) throw error;

        // Registrar no histórico
        await supabase
          .from('chip_history')
          .insert({
            chip_id: editChip.id,
            action: 'update',
            description: `Chip atualizado por Sistema`,
            created_by: 'Sistema'
          });
      } else {
        // Criar novo chip
        const { error } = await supabase
          .from('chips')
          .insert(chipData);

        if (error) throw error;
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess(); // Chamar sem parâmetros
        onClose();
      }, 1500);
    } catch (error: any) {
      console.error('Erro ao salvar chip:', error);
      setError(error.message || 'Erro ao salvar chip');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    
    // Limpar erro de validação quando o usuário digita
    if (validationErrors[e.target.name]) {
      setValidationErrors({
        ...validationErrors,
        [e.target.name]: ''
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-50 to-green-100 px-8 py-6 rounded-t-2xl border-b border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl shadow-lg">
                <Smartphone className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-green-800">
                  {editChip ? 'Editar Chip' : 'Adicionar Novo Chip'}
                </h2>
                <p className="text-green-600 mt-1">
                  {editChip ? 'Edite as informações do chip' : 'Cadastre um novo chip de celular'}
                </p>
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

              {/* Messages */}
              {error && (
                <div className="mx-8 mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                </div>
              )}

              {success && (
                <div className="mx-8 mb-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <p className="text-green-800 text-sm">
                      {editChip ? 'Chip atualizado com sucesso!' : 'Chip adicionado com sucesso!'}
                    </p>
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Número do Telefone */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <Smartphone className="h-4 w-4 inline mr-2" />
                Número do Telefone
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="(11) 99999-9999"
                className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all duration-200 ${
                  validationErrors.phoneNumber 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                }`}
                required
              />
              {validationErrors.phoneNumber && (
                <p className="text-red-600 text-sm mt-1">{validationErrors.phoneNumber}</p>
              )}
            </div>

            {/* Empresa */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <Building2 className="h-4 w-4 inline mr-2" />
                Empresa
              </label>
              <select
                name="company"
                value={formData.company}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                required
              >
                <option value="">Selecione a empresa</option>
                {companies.map(company => (
                  <option key={company} value={company}>{company}</option>
                ))}
              </select>
            </div>

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
                        key={dept}
                        type="button"
                        onClick={() => setFormData({...formData, department: dept})}
                        className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
                      >
                        {dept}
                      </button>
                    ))}
                  </div>
                </div>
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
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                required
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
              >
                {statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            {/* Plano */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Plano
              </label>
              <input
                type="text"
                name="plan"
                value={formData.plan}
                onChange={handleChange}
                placeholder="Ex: Pós-pago 5GB"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                required
              />
            </div>

            {/* Custo Mensal */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <DollarSign className="h-4 w-4 inline mr-2" />
                Custo Mensal (R$)
              </label>
              <input
                type="number"
                name="monthlyCost"
                value={formData.monthlyCost}
                onChange={handleChange}
                placeholder="89.90"
                step="0.01"
                min="0"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                required
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors duration-200 font-semibold"
            >
              Cancelar
            </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-6 py-3 rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl flex items-center justify-center ${
                    loading 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      {editChip ? 'Atualizando...' : 'Adicionando...'}
                    </>
                  ) : (
                    editChip ? 'Atualizar Chip' : 'Adicionar Chip'
                  )}
                </button>
          </div>
        </form>
      </div>
    </div>
  );
}
