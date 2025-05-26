import React, { useEffect, useState } from 'react';
import { Plus, X, Check, Search, ClipboardList, ArchiveRestore, Trash2, Info, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface Devolucao {
  id: number;
  item_name: string;
  quantity: number;
  reason: string;
  department: string;
  status: 'Pendente' | 'Aprovada' | 'Rejeitada' | 'Concluída';
  date: string;
}

const statusColors: Record<string, string> = {
  Pendente: 'bg-yellow-100 text-yellow-800',
  Aprovada: 'bg-green-100 text-green-800',
  Rejeitada: 'bg-red-100 text-red-800',
  Concluída: 'bg-blue-100 text-blue-800',
};

function NovaDevolucaoModal({ isOpen, onClose, onSuccess, departamentos }: { isOpen: boolean, onClose: () => void, onSuccess: () => void, departamentos: string[] }) {
  const [item_name, setItemName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [department, setDepartment] = useState('');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [itens, setItens] = useState<{ id: string, name: string }[]>([]);

  useEffect(() => {
    if (!isOpen) {
      setItemName('');
      setQuantity(1);
      setReason('');
      setDepartment('');
      setDepartmentId('');
      setErro('');
      setItens([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (department) {
      fetchDepartmentIdAndItens(department);
    } else {
      setItens([]);
      setItemName('');
      setDepartmentId('');
    }
  }, [department]);

  const fetchDepartmentIdAndItens = async (depName: string) => {
    // Buscar o ID do departamento pelo nome
    const { data: depData } = await supabase
      .from('departments')
      .select('id')
      .eq('name', depName)
      .single();
    if (!depData) {
      setItens([]);
      setDepartmentId('');
      return;
    }
    setDepartmentId(depData.id);
    // Buscar itens do inventário por department_id
    const { data: itensData } = await supabase
      .from('inventory_items')
      .select('id, name, department_id')
      .eq('department_id', depData.id);
    if (itensData) setItens(itensData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    if (!item_name || !quantity || !reason || !department) {
      setErro('Preencha todos os campos obrigatórios.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('devolucoes').insert({
        item_name,
        quantity,
        reason,
        department,
        status: 'Pendente',
        date: new Date().toISOString(),
      });
      if (error) throw error;
      onSuccess();
      onClose();
    } catch (err: any) {
      setErro(err.message || 'Erro ao salvar devolução.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Nova Devolução</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><X className="h-6 w-6" /></button>
        </div>
        {erro && <div className="mb-3 p-2 bg-red-50 text-red-600 rounded text-sm">{erro}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Departamento *</label>
            <select className="w-full border rounded px-3 py-2" value={department} onChange={e => setDepartment(e.target.value)} required>
              <option value="">Selecione</option>
              {departamentos.map(dep => <option key={dep} value={dep}>{dep}</option>)}
            </select>
          </div>
          {department && (
            <div>
              <label className="block text-sm font-medium mb-1">Item *</label>
              <select className="w-full border rounded px-3 py-2" value={item_name} onChange={e => setItemName(e.target.value)} required>
                <option value="">Selecione um item</option>
                {itens.map(item => (
                  <option key={item.id} value={item.name}>{item.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Quantidade *</label>
            <input type="number" min={1} className="w-full border rounded px-3 py-2" value={quantity} onChange={e => setQuantity(Number(e.target.value))} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Motivo *</label>
            <input type="text" className="w-full border rounded px-3 py-2" value={reason} onChange={e => setReason(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-100 text-gray-700">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Devolucoes() {
  const [devolucoes, setDevolucoes] = useState<Devolucao[]>([]);
  const [filtroDepartamento, setFiltroDepartamento] = useState('Todos');
  const [filtroStatus, setFiltroStatus] = useState('Todos');
  const [busca, setBusca] = useState('');
  const [departamentos, setDepartamentos] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchDevolucoes();
    fetchDepartamentos();
  }, []);

  const fetchDevolucoes = async () => {
    // Ajuste para buscar da tabela correta no seu banco
    const { data } = await supabase.from('devolucoes').select('*');
    if (data) setDevolucoes(data);
  };

  const fetchDepartamentos = async () => {
    const { data } = await supabase.from('departments').select('name');
    if (data) setDepartamentos(data.map((d: any) => d.name));
  };

  const devolucoesFiltradas = devolucoes.filter((d) => {
    const matchBusca =
      (d.item_name?.toLowerCase() || '').includes(busca.toLowerCase()) ||
      (d.reason?.toLowerCase() || '').includes(busca.toLowerCase());
    const matchDept = filtroDepartamento === 'Todos' || d.department === filtroDepartamento;
    const matchStatus = filtroStatus === 'Todos' || d.status === filtroStatus;
    return matchBusca && matchDept && matchStatus;
  });

  const statusCount = (status: string) => devolucoes.filter(d => d.status === status).length;

  // Função para mover devolução aprovada para o inventário
  const handleMoverParaInventario = async (devolucao: Devolucao) => {
    // Busca o item pelo nome
    const { data: itens, error: fetchError } = await supabase
      .from('inventory_items')
      .select('id, current_quantity, department_id')
      .eq('name', devolucao.item_name)
      .limit(1);
    if (fetchError || !itens || itens.length === 0) {
      alert('Item não encontrado no inventário.');
      return;
    }
    const item = itens[0];
    // Atualiza a quantidade do item
    const { error: updateError } = await supabase
      .from('inventory_items')
      .update({ current_quantity: item.current_quantity + devolucao.quantity })
      .eq('id', item.id);
    if (updateError) {
      alert('Erro ao atualizar inventário.');
      return;
    }
    // Registra no histórico
    const { data: historyData, error: historyError } = await supabase
      .from('inventory_history')
      .insert({
        item_name: devolucao.item_name,
        quantity_changed: devolucao.quantity,
        type: 'entrada',
        observation: 'Devolução aprovada',
        department_id: item.department_id || null,
        created_at: new Date().toISOString(),
      })
      .select();
    console.log('Insert inventory_history:', { data: historyData, error: historyError });
    if (historyError) {
      alert('Erro ao registrar no histórico: ' + historyError.message);
      return;
    }
    if (!historyData || historyData.length === 0) {
      alert('Atenção: O registro não foi criado no histórico.');
    }
    // Marca a devolução como concluída
    const { error: devolucaoError } = await supabase
      .from('devolucoes')
      .update({ status: 'Concluída' })
      .eq('id', devolucao.id);
    if (devolucaoError) {
      alert('Erro ao atualizar status da devolução.');
      return;
    }
    fetchDevolucoes();
    alert('Devolução movida para o inventário e registrada no histórico com sucesso!');
  };

  // Função para aprovar devolução
  const handleAprovarDevolucao = async (devolucao: Devolucao) => {
    const { error } = await supabase
      .from('devolucoes')
      .update({ status: 'Aprovada' })
      .eq('id', devolucao.id);
    if (error) {
      alert('Erro ao aprovar devolução.');
      return;
    }
    fetchDevolucoes();
  };

  // Função para rejeitar devolução
  const handleRejeitarDevolucao = async (devolucao: Devolucao) => {
    const { error } = await supabase
      .from('devolucoes')
      .update({ status: 'Rejeitada' })
      .eq('id', devolucao.id);
    if (error) {
      alert('Erro ao rejeitar devolução.');
      return;
    }
    fetchDevolucoes();
  };

  // Função para deletar devolução
  const handleDeletarDevolucao = async (devolucao: Devolucao) => {
    if (!window.confirm('Tem certeza que deseja apagar esta devolução?')) return;
    const { error } = await supabase
      .from('devolucoes')
      .delete()
      .eq('id', devolucao.id);
    if (error) {
      alert('Erro ao apagar devolução.');
      return;
    }
    fetchDevolucoes();
  };

  return (
    <div className="space-y-8">
      <NovaDevolucaoModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={fetchDevolucoes}
        departamentos={departamentos}
      />
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardList className="w-7 h-7 text-green-600" /> Devoluções
        </h2>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-md"
          onClick={() => setShowModal(true)}
        >
          <Plus className="w-5 h-5" /> Nova Devolução
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
          <span className="text-3xl font-bold">{devolucoes.length}</span>
          <span className="text-gray-600">Total</span>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow p-4 flex flex-col items-center">
          <span className="text-3xl font-bold text-yellow-600">{statusCount('Pendente')}</span>
          <span className="text-yellow-700">Pendentes</span>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-4 flex flex-col items-center">
          <span className="text-3xl font-bold text-green-600">{statusCount('Aprovada')}</span>
          <span className="text-green-700">Aprovadas</span>
        </div>
        <div className="bg-red-50 rounded-lg shadow p-4 flex flex-col items-center">
          <span className="text-3xl font-bold text-red-600">{statusCount('Rejeitada')}</span>
          <span className="text-red-700">Rejeitadas</span>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-4 flex flex-col items-center">
          <span className="text-3xl font-bold text-blue-600">{statusCount('Concluída')}</span>
          <span className="text-blue-700">Concluídas</span>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-4 items-center mb-4">
        <div className="flex-1 flex items-center gap-2 bg-white rounded-lg shadow px-3 py-2">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por item ou motivo..."
            className="flex-1 outline-none bg-transparent text-base"
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>
        <select
          className="bg-white rounded-lg shadow px-3 py-2 text-base"
          value={filtroDepartamento}
          onChange={e => setFiltroDepartamento(e.target.value)}
        >
          <option>Todos</option>
          {departamentos.map(dep => (
            <option key={dep}>{dep}</option>
          ))}
        </select>
        <select
          className="bg-white rounded-lg shadow px-3 py-2 text-base"
          value={filtroStatus}
          onChange={e => setFiltroStatus(e.target.value)}
        >
          <option>Todos</option>
          <option>Pendente</option>
          <option>Aprovada</option>
          <option>Rejeitada</option>
          <option>Concluída</option>
        </select>
      </div>
      <div className="overflow-x-auto rounded-lg shadow bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Item</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Quantidade</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Motivo</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Departamento</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Data</th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {devolucoesFiltradas.map((d, idx) => (
              <tr key={d.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 font-bold text-gray-800">{d.item_name}</td>
                <td className="px-6 py-4">{d.quantity}</td>
                <td className="px-6 py-4">{d.reason}</td>
                <td className="px-6 py-4">{d.department}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[d.status] || ''}`}>{d.status}</span>
                </td>
                <td className="px-6 py-4 text-gray-500">{new Date(d.date).toLocaleString()}</td>
                <td className="px-6 py-4 flex gap-2 justify-center">
                  {d.status === 'Pendente' && (
                    <>
                      <button
                        className="bg-green-100 hover:bg-green-200 p-2 rounded-full"
                        title="Aprovar devolução"
                        onClick={() => handleAprovarDevolucao(d)}
                      >
                        <Check className="w-4 h-4 text-green-600" />
                      </button>
                      <button
                        className="bg-red-100 hover:bg-red-200 p-2 rounded-full"
                        title="Rejeitar devolução"
                        onClick={() => handleRejeitarDevolucao(d)}
                      >
                        <X className="w-4 h-4 text-red-600" />
                      </button>
                    </>
                  )}
                  {d.status === 'Aprovada' && (
                    <button
                      className="bg-green-100 hover:bg-green-200 p-2 rounded-full"
                      title="Mover para Inventário"
                      onClick={() => handleMoverParaInventario(d)}
                    >
                      <ArchiveRestore className="w-4 h-4 text-green-600" />
                    </button>
                  )}
                  <button
                    className="bg-gray-100 hover:bg-gray-200 p-2 rounded-full"
                    title="Apagar devolução"
                    onClick={() => handleDeletarDevolucao(d)}
                  >
                    <Trash2 className="w-4 h-4 text-gray-500" />
                  </button>
                </td>
              </tr>
            ))}
            {devolucoesFiltradas.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-400">Nenhuma devolução encontrada.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 