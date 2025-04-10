import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronDown, BarChart2, Package, AlertTriangle, TrendingUp } from 'lucide-react';
import MovementChart from './MovementChart';

interface AnalyticsSectionProps {
    items: any[];
    departments: any[];
    history: any[];
    onEditItem: (item: any) => void;
}

const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({ items, departments, history, onEditItem }) => {
    const [selectedDepartment, setSelectedDepartment] = useState('Todos');
    const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
    const [movementData, setMovementData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Memoize filtered items and history
    const filteredItems = useMemo(() => {
        return selectedDepartment === 'Todos'
            ? items
            : items.filter(item => item.departments?.name === selectedDepartment);
    }, [items, selectedDepartment]);

    const filteredHistory = useMemo(() => {
        return selectedDepartment === 'Todos'
            ? history
            : history.filter(item => item.departments?.name === selectedDepartment);
    }, [history, selectedDepartment]);

    const totalCategories = useMemo(() => {
        return new Set(filteredItems.map(item => item.categories?.name)).size;
    }, [filteredItems]);

    // Memoize the data processing function
    const processMovementData = useCallback(() => {
        try {
            const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

            // Create a map for faster lookups
            const monthMap = new Map(months.map((month, index) => [index, { entrada: 0, saida: 0 }]));

            // Process history in a single pass
            for (const item of filteredHistory) {
                if (!item?.created_at) continue;

                const itemDate = new Date(item.created_at);
                const monthIndex = itemDate.getMonth();

                const monthData = monthMap.get(monthIndex) || { entrada: 0, saida: 0 };

                if (item.type === 'entrada') {
                    monthData.entrada += item.quantity_changed || 0;
                } else if (item.type === 'saída') {
                    monthData.saida += item.quantity_changed || 0;
                }

                monthMap.set(monthIndex, monthData);
            }

            const processedData = months.map((month, index) => {
                const monthData = monthMap.get(index) || { entrada: 0, saida: 0 };

                return {
                    month,
                    entrada: monthData.entrada,
                    saida: monthData.saida,
                    total: monthData.entrada - monthData.saida
                };
            });

            setMovementData(processedData);
            setIsLoading(false);
        } catch (error) {
            console.error('Erro ao processar dados de movimentação:', error);
            setMovementData([]);
            setIsLoading(false);
        }
    }, [filteredHistory]);

    useEffect(() => {
        processMovementData();
    }, [processMovementData]);

    // Memoize department selection handler
    const handleDepartmentSelect = useCallback((department: string) => {
        setSelectedDepartment(department);
        setShowDepartmentDropdown(false);
    }, []);

    return (
        <div className="space-y-6 p-6 bg-gray-50 rounded-xl">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <BarChart2 className="w-6 h-6 text-green-600" />
                    Análise de Estoque
                </h2>
                <div className="relative department-dropdown">
                    <button
                        onClick={() => setShowDepartmentDropdown(!showDepartmentDropdown)}
                        className="w-64 bg-white border border-gray-200 rounded-lg py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 hover:border-green-300"
                    >
                        <div className="flex items-center justify-between">
                            <span className="block truncate text-gray-700">Departamento: {selectedDepartment}</span>
                            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${showDepartmentDropdown ? 'transform rotate-180' : ''}`} />
                        </div>
                    </button>
                    {showDepartmentDropdown && (
                        <div className="absolute z-10 mt-1 w-64 bg-white shadow-lg max-h-60 rounded-lg py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                            <div
                                className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-green-50 transition-colors duration-150 text-gray-700"
                                onClick={() => {
                                    setSelectedDepartment('Todos');
                                    setShowDepartmentDropdown(false);
                                }}
                            >
                                Todos
                            </div>
                            {departments?.map((department) => (
                                <div
                                    key={department.id}
                                    className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-green-50 transition-colors duration-150 text-gray-700"
                                    onClick={() => {
                                        setSelectedDepartment(department.name);
                                        setShowDepartmentDropdown(false);
                                    }}
                                >
                                    {department.name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Package className="w-6 h-6 text-green-600" />
                        <h3 className="text-lg font-semibold text-gray-800">Total de Itens</h3>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{filteredItems?.length || 0}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <TrendingUp className="w-6 h-6 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-800">Total de Categorias</h3>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{totalCategories || 0}</p>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                        <h3 className="text-lg font-semibold text-gray-800">Itens em Estoque Baixo</h3>
                    </div>
                    <p className="text-3xl font-bold text-red-600">
                        {filteredItems?.filter(item => item.current_quantity <= item.minimum_quantity).length || 0}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Últimas Movimentações</h3>
                    <div className="space-y-3">
                        {filteredHistory?.slice(0, 5).map((item) => (
                            <div
                                key={item.id}
                                className="p-3 bg-gray-50 rounded-lg flex justify-between items-center"
                            >
                                <div>
                                    <p className="font-medium text-gray-900">{item.item_name}</p>
                                    <p className="text-sm text-gray-600">
                                        {item.type === 'entrada' ? 'Entrada' : 'Saída'}: {item.quantity_changed}
                                    </p>
                                </div>
                                <span className="text-sm text-gray-500">
                                    {new Date(item.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Itens em Estoque Baixo</h3>
                    <div className="space-y-3">
                        {filteredItems
                            ?.filter(item => item.current_quantity <= item.minimum_quantity)
                            .slice(0, 5)
                            .map(item => (
                                <div
                                    key={item.id}
                                    className="p-3 bg-gray-50 rounded-lg flex justify-between items-center"
                                >
                                    <div>
                                        <p className="font-medium text-red-700">{item.name}</p>
                                        <p className="text-sm text-red-600">
                                            Atual: {item.current_quantity} | Mínimo: {item.minimum_quantity}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => onEditItem(item)}
                                        className="px-3 py-1 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors duration-200"
                                    >
                                        Ajustar
                                    </button>
                                </div>
                            ))
                        }
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Movimentação Mensal</h3>
                {isLoading ? (
                    <div className="h-[300px] flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-600"></div>
                    </div>
                ) : movementData.length > 0 ? (
                    <MovementChart data={movementData} />
                ) : (
                    <div className="h-[300px] flex items-center justify-center text-gray-500">
                        Nenhum dado disponível
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnalyticsSection; 