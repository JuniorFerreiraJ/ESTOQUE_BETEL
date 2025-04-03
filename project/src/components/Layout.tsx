import React, { useState } from 'react';
import { 
  Package, 
  BarChart2, 
  LogOut, 
  Menu, 
  X, 
  Settings, 
  Home, 
  Layers, 
  History, 
  ChevronRight,
  Users
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div 
        className={`bg-green-700 text-white transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'w-64' : 'w-20'
        } fixed inset-y-0 left-0 z-30 flex flex-col`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-green-600">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-white" />
            {sidebarOpen && (
              <span className="ml-2 text-white text-xl font-semibold">
                Estoque
              </span>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 rounded-md text-green-200 hover:text-white hover:bg-green-600"
          >
            {sidebarOpen ? <ChevronRight className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <nav className="px-2 space-y-1">
            <a
              href="#dashboard"
              className="flex items-center px-3 py-3 text-sm font-medium rounded-md text-green-100 hover:bg-green-600 hover:text-white"
            >
              <Home className={`h-5 w-5 ${!sidebarOpen && 'mx-auto'}`} />
              {sidebarOpen && <span className="ml-3">Dashboard</span>}
            </a>
            <a
              href="#inventory"
              className="flex items-center px-3 py-3 text-sm font-medium rounded-md text-green-100 hover:bg-green-600 hover:text-white"
            >
              <Layers className={`h-5 w-5 ${!sidebarOpen && 'mx-auto'}`} />
              {sidebarOpen && <span className="ml-3">Inventário</span>}
            </a>
            <a
              href="#history"
              className="flex items-center px-3 py-3 text-sm font-medium rounded-md text-green-100 hover:bg-green-600 hover:text-white"
            >
              <History className={`h-5 w-5 ${!sidebarOpen && 'mx-auto'}`} />
              {sidebarOpen && <span className="ml-3">Histórico</span>}
            </a>
            <a
              href="#analytics"
              className="flex items-center px-3 py-3 text-sm font-medium rounded-md text-green-100 hover:bg-green-600 hover:text-white"
            >
              <BarChart2 className={`h-5 w-5 ${!sidebarOpen && 'mx-auto'}`} />
              {sidebarOpen && <span className="ml-3">Análise</span>}
            </a>
            <a
              href="#management"
              className="flex items-center px-3 py-3 text-sm font-medium rounded-md text-green-100 hover:bg-green-600 hover:text-white"
            >
              <Users className={`h-5 w-5 ${!sidebarOpen && 'mx-auto'}`} />
              {sidebarOpen && <span className="ml-3">Gerenciamento</span>}
            </a>
          </nav>
        </div>

        <div className="p-4 border-t border-green-600">
          <button
            onClick={handleSignOut}
            className={`flex items-center px-3 py-2 text-sm font-medium rounded-md text-green-100 hover:bg-green-600 hover:text-white w-full ${
              !sidebarOpen && 'justify-center'
            }`}
          >
            <LogOut className="h-5 w-5" />
            {sidebarOpen && <span className="ml-2">Sair</span>}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900">Sistema de Controle de Estoque</h1>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}