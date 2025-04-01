import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface CategoryDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: { id: string; name: string }[];
  departments: { id: string; name: string }[];
}

export default function CategoryDepartmentModal({
  isOpen,
  onClose,
  onSuccess,
  categories,
  departments
}: CategoryDepartmentModalProps) {
  const [newCategory, setNewCategory] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [activeTab, setActiveTab] = useState<'categories' | 'departments'>('categories');
  const [error, setError] = useState('');

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md transform transition-all duration-300">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Gerenciar Categorias e Departamentos
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex space-x-2 mb-6">
          <button
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
              activeTab === 'categories'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setActiveTab('categories')}
          >
            Categorias
          </button>
          <button
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
              activeTab === 'departments'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setActiveTab('departments')}
          >
            Departamentos
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
            {error}
          </div>
        )}

        {activeTab === 'categories' ? (
          <>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nova Categoria
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    placeholder="Nome da categoria"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors duration-200"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </button>
                </div>
              </div>
            </form>

            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Categorias Existentes</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="p-2 bg-gray-50 rounded-md text-sm text-gray-700"
                  >
                    {category.name}
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <form onSubmit={handleAddDepartment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Novo Departamento
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    placeholder="Nome do departamento"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors duration-200"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </button>
                </div>
              </div>
            </form>

            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Departamentos Existentes</h3>
              <div className="space-y-2">
                {departments.map((department) => (
                  <div
                    key={department.id}
                    className="p-2 bg-gray-50 rounded-md text-sm text-gray-700"
                  >
                    {department.name}
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