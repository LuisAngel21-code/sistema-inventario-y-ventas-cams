import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import VentasPage from './pages/VentasPage';
import NuevaVenta from './pages/NuevaVenta';
import VentaDetalle from './pages/VentaDetalle';
import ProductosPage from './pages/ProductosPage';
import InventarioPage from './pages/InventarioPage';
import VendedoresPage from './pages/VendedoresPage';
import ReportesPage from './pages/ReportesPage';
import CajaPage from './pages/CajaPage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="w-10 h-10 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="w-10 h-10 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route path="/" element={<Dashboard />} />
        <Route path="/ventas" element={<VentasPage />} />
        <Route path="/ventas/nueva" element={<NuevaVenta />} />
        <Route path="/ventas/:id" element={<VentaDetalle />} />
        <Route path="/productos" element={<ProductosPage />} />
        <Route path="/inventario" element={<InventarioPage />} />
        <Route path="/vendedores" element={<VendedoresPage />} />
        <Route path="/reportes" element={<ReportesPage />} />
        <Route path="/caja" element={<CajaPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
