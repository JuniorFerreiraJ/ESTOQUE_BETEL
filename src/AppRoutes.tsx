import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Devolucoes from './pages/Devolucoes';
import Chips from './pages/Chips';
import Ativos from './pages/Ativos';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  return session ? <>{children}</> : <Navigate to="/login" />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/chips"
        element={
          <PrivateRoute>
            <Layout>
              <Chips />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/ativos"
        element={
          <PrivateRoute>
            <Layout>
              <Ativos />
            </Layout>
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

export default AppRoutes;