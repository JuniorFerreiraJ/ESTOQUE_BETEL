import React, { useState } from 'react';
import { X, Plus, Trash2, Building, Tag, Pencil, Check, Ban } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface CategoryDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: { id: string; name: string }[];
  departments: { id: string; name: string }[];
  initialTab: 'categories' | 'departments';
  departmentTable?: 'departments' | 'asset_departments';
}

export default function CategoryDepartmentModal({
  isOpen,
  onClose,
  onSuccess,
  categories,
  departments,
  initialTab,
  departmentTable = 'departments'
}: CategoryDepartmentModalProps) {
  const [newCategory, setNewCategory] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editingDepartmentId, setEditingDepartmentId] = useState<string | null>(null);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newCategory.trim()) {
      setError('Por favor, insira um nome para a categoria');
      return;
    }

    setIsSaving(true);
    try {
      const { error: supabaseError } = await supabase
        .from('categories')
        .insert([{ name: newCategory.trim().toUpperCase() }]);

      if (supabaseError) throw supabaseError;

      setNewCategory('');
      onSuccess();
    } catch (err) {
      setError('Erro ao adicionar categoria. Verifique se já não existe uma categoria com este nome.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const departmentName = newDepartment.trim().replace(/\s+/g, ' ').toUpperCase();

    if (!departmentName) {
      setError('Por favor, insira um nome para o departamento');
      return;
    }

    setIsSaving(true);
    try {
      const request = editingDepartmentId
        ? supabase
          .from(departmentTable)
          .update({ name: departmentName })
          .eq('id', editingDepartmentId)
        : supabase
          .from(departmentTable)
          .insert([{ name: departmentName }]);

      const { error: supabaseError } = await request;

      if (supabaseError) throw supabaseError;

      if (editingDepartmentId && departmentTable === 'asset_departments') {
        const previousDepartment = departments.find(department => department.id === editingDepartmentId);
        if (previousDepartment && previousDepartment.name !== departmentName) {
          const { error: assetsError } = await supabase
            .from('assets')
            .update({ department: departmentName })
            .eq('department', previousDepartment.name);

          if (assetsError) throw assetsError;
        }
      }

      setNewDepartment('');
      setEditingDepartmentId(null);
      onSuccess();
    } catch (err: any) {
      setError(err?.code === '23505'
        ? 'Este departamento já existe.'
        : `Erro ao ${editingDepartmentId ? 'editar' : 'adicionar'} departamento.`);
    } finally {
      setIsSaving(false);
    }
  };

  const startEditingDepartment = (department: { id: string; name: string }) => {
    setError('');
    setNewDepartment(department.name);
    setEditingDepartmentId(department.id);
  };

  const cancelEditingDepartment = () => {
    setNewDepartment('');
    setEditingDepartmentId(null);
    setError('');
  };

  const handleDelete = async (id: string, type: 'categories' | 'departments') => {
    if (type === 'departments' && !confirm('Tem certeza que deseja remover este departamento?')) {
      return;
    }

    setError('');
    setIsDeleting(id);
    try {
      if (type === 'departments') {
        const relationTable = departmentTable === 'asset_departments' ? 'assets' : 'inventory_items';
        const relationColumn = departmentTable === 'asset_departments' ? 'department' : 'department_id';
        const departmentValue = departments.find(department => department.id === id);
        const relationQuery = supabase
          .from(relationTable)
          .select('id', { count: 'exact', head: true })
          .eq(relationColumn, departmentTable === 'asset_departments' ? departmentValue?.name : id);

        const { count, error: relationError } = await relationQuery;

        if (relationError) throw relationError;
        if (count && count > 0) {
          setError('Não é possível remover este departamento enquanto houver itens vinculados a ele.');
          return;
        }

      }

      const { error } = await supabase
        .from(type === 'departments' ? departmentTable : type)
        .delete()
        .eq('id', id);

      if (error) throw error;
      onSuccess();
    } catch (err) {
      setError(`Erro ao remover ${type === 'categories' ? 'categoria' : 'departamento'}.`);
    } finally {
      setIsDeleting(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            {initialTab === 'categories' ? (
              <Tag className="h-8 w-8 text-green-600" />
            ) : (
              <Building className="h-8 w-8 text-blue-600" />
            )}
            <h2 className="text-2xl font-semibold text-gray-900">
              Gerenciar {initialTab === 'categories' ? 'Categorias' : 'Departamentos'}
            </h2>
          </div>
          <button
            onClick={onClose}
            type="button"
            aria-label="Fechar gerenciamento"
            className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5 sm:px-8 sm:py-6">
          {error && (
            <div className="mb-6 rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          {initialTab === 'categories' ? (
            <>
              <form onSubmit={handleAddCategory} className="space-y-4">
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">
                    Nova Categoria
                  </label>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-base"
                      placeholder="Nome da categoria"
                    />
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="inline-flex shrink-0 items-center justify-center rounded-lg bg-green-600 px-5 py-3 text-base font-medium text-white shadow-sm transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      {isSaving ? 'Salvando...' : 'Adicionar'}
                    </button>
                  </div>
                </div>
              </form>

              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-700 mb-4">Categorias Existentes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="group p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg flex items-center justify-between transition-all duration-200 hover:shadow-md"
                    >
                      <span className="text-gray-700 font-medium">{category.name}</span>
                      <button
                        onClick={() => handleDelete(category.id, 'categories')}
                        type="button"
                        aria-label={`Excluir categoria ${category.name}`}
                        disabled={isDeleting === category.id}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors duration-200 opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <form onSubmit={handleAddDepartment} className="space-y-4">
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">
                    Novo Departamento
                  </label>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      type="text"
                      value={newDepartment}
                      onChange={(e) => setNewDepartment(e.target.value)}
                      className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base"
                      placeholder="Nome do departamento"
                    />
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="inline-flex shrink-0 items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-base font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      {isSaving ? 'Salvando...' : editingDepartmentId ? 'Salvar alteração' : 'Adicionar'}
                    </button>
                    {editingDepartmentId && (
                      <button
                        type="button"
                        onClick={cancelEditingDepartment}
                        className="inline-flex shrink-0 items-center justify-center rounded-lg border border-gray-300 px-5 py-3 text-base font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <Ban className="mr-2 h-5 w-5" />
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              </form>

              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-700 mb-4">Departamentos Existentes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {departments.map((department) => (
                    <div
                      key={department.id}
                      className="group p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg flex items-center justify-between transition-all duration-200 hover:shadow-md"
                    >
                      <span className="text-gray-700 font-medium">{department.name}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEditingDepartment(department)}
                          type="button"
                          aria-label={`Editar departamento ${department.name}`}
                          disabled={isSaving || isDeleting === department.id}
                          className="p-2 text-gray-400 hover:text-blue-600"
                        >
                          {editingDepartmentId === department.id ? <Check className="h-5 w-5" /> : <Pencil className="h-5 w-5" />}
                        </button>
                        <button
                          onClick={() => handleDelete(department.id, 'departments')}
                          type="button"
                          aria-label={`Excluir departamento ${department.name}`}
                          disabled={isDeleting === department.id || isSaving}
                          className="p-2 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}