import React, { useState } from 'react';
import { X, Plus, Trash2, Building, Tag } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface CategoryDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: { id: string; name: string }[];
  departments: { id: string; name: string }[];
  initialTab: 'categories' | 'departments';
}

export default function CategoryDepartmentModal({
  isOpen,
  onClose,
  onSuccess,
  categories,
  departments,
  initialTab
}: CategoryDepartmentModalProps) {
  const [newCategory, setNewCategory] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newCategory.trim()) {
      setError('Por favor, insira um nome para a categoria');
      return;
    }

    try {
      const { error: supabaseError } = await supabase
        .from('categories')
        .insert([{ name: newCategory.trim().toUpperCase() }]);

      if (supabaseError) throw supabaseError;

      setNewCategory('');
      onSuccess();
    } catch (err) {
      setError('Erro ao adicionar categoria. Verifique se já não existe uma categoria com este nome.');
    }
  };

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newDepartment.trim()) {
      setError('Por favor, insira um nome para o departamento');
      return;
    }

    try {
      const { error: supabaseError } = await supabase
        .from('departments')
        .insert([{ name: newDepartment.trim().toUpperCase() }]);

      if (supabaseError) throw supabaseError;

      setNewDepartment('');
      onSuccess();
    } catch (err) {
      setError('Erro ao adicionar departamento. Verifique se já não existe um departamento com este nome.');
    }
  };

  const handleDelete = async (id: string, type: 'categories' | 'departments') => {
    setIsDeleting(id);
    try {
      const { error } = await supabase
        .from(type)
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-2xl transform transition-all duration-300 scale-100">
        <div className="flex justify-between items-center mb-6">
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
            className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
            {error}
          </div>
        )}

        {initialTab === 'categories' ? (
          <>
            <form onSubmit={handleAddCategory} className="space-y-6">
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  Nova Categoria
                </label>
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-base"
                    placeholder="Nome da categoria"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center px-6 py-3 text-base font-medium text-white bg-gradient-to-r from-green-500 to-green-600 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Adicionar
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
            <form onSubmit={handleAddDepartment} className="space-y-6">
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  Novo Departamento
                </label>
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base"
                    placeholder="Nome do departamento"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center px-6 py-3 text-base font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Adicionar
                  </button>
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
                    <button
                      onClick={() => handleDelete(department.id, 'departments')}
                      disabled={isDeleting === department.id}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors duration-200 opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}