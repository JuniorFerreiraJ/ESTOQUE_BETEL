import React, { useState, useEffect } from 'react';
import {
  Package,
  BarChart2,
  Menu,
  LogOut,
  ChevronRight,
  Home,
  Layers,
  History,
  Settings,
  ClipboardList
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
  const [activeSection, setActiveSection] = useState('dashboard');

  useEffect(() => {
    // Get initial active section from URL hash
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    setActiveSection(hash);

    // Listen for hash changes
    const handleHashChange = () => {
      const newHash = window.location.hash.replace('#', '') || 'dashboard';
      setActiveSection(newHash);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleNavigation = (section: string) => {
    window.location.hash = section;
    setActiveSection(section);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div
        className={`bg-green-700 text-white transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-64' : 'w-20'
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
            <button
              onClick={() => handleNavigation('dashboard')}
              className={`flex items-center px-3 py-3 text-sm font-medium rounded-md w-full ${activeSection === 'dashboard'
                ? 'bg-green-600 text-white'
                : 'text-green-100 hover:bg-green-600 hover:text-white'
                }`}
            >
              <Home className="h-5 w-5 mr-3" />
              {sidebarOpen && 'Dashboard'}
            </button>

            <button
              onClick={() => handleNavigation('inventory')}
              className={`flex items-center px-3 py-3 text-sm font-medium rounded-md w-full ${activeSection === 'inventory'
                ? 'bg-green-600 text-white'
                : 'text-green-100 hover:bg-green-600 hover:text-white'
                }`}
            >
              <Layers className="h-5 w-5 mr-3" />
              {sidebarOpen && 'Inventário'}
            </button>

            <button
              onClick={() => handleNavigation('history')}
              className={`flex items-center px-3 py-3 text-sm font-medium rounded-md w-full ${activeSection === 'history'
                ? 'bg-green-600 text-white'
                : 'text-green-100 hover:bg-green-600 hover:text-white'
                }`}
            >
              <History className="h-5 w-5 mr-3" />
              {sidebarOpen && 'Histórico'}
            </button>

            <button
              onClick={() => handleNavigation('analytics')}
              className={`flex items-center px-3 py-3 text-sm font-medium rounded-md w-full ${activeSection === 'analytics'
                ? 'bg-green-600 text-white'
                : 'text-green-100 hover:bg-green-600 hover:text-white'
                }`}
            >
              <BarChart2 className="h-5 w-5 mr-3" />
              {sidebarOpen && 'Análise'}
            </button>

            <button
              onClick={() => handleNavigation('devolucoes')}
              className={`flex items-center px-3 py-3 text-sm font-medium rounded-md w-full ${activeSection === 'devolucoes'
                ? 'bg-green-600 text-white'
                : 'text-green-100 hover:bg-green-600 hover:text-white'
                }`}
            >
              <ClipboardList className="h-5 w-5 mr-3" />
              {sidebarOpen && 'Devoluções'}
            </button>

            <button
              onClick={() => handleNavigation('management')}
              className={`flex items-center px-3 py-3 text-sm font-medium rounded-md w-full ${activeSection === 'management'
                ? 'bg-green-600 text-white'
                : 'text-green-100 hover:bg-green-600 hover:text-white'
                }`}
            >
              <Settings className="h-5 w-5 mr-3" />
              {sidebarOpen && 'Gerenciamento'}
            </button>
          </nav>
        </div>

        <div className="border-t border-green-600 p-4">
          <button
            onClick={handleSignOut}
            className="flex items-center px-3 py-3 text-sm font-medium text-green-100 hover:bg-green-600 hover:text-white rounded-md w-full"
          >
            <LogOut className="h-5 w-5 mr-3" />
            {sidebarOpen && 'Sair'}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className={`flex-1 transition-all duration-300 ease-in-out ${sidebarOpen ? 'ml-64' : 'ml-20'
        }`}>
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}