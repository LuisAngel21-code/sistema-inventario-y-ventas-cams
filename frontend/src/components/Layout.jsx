import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, ShoppingCart, Package, Warehouse,
  Users, FileBarChart, LogOut, Menu, X,
  ChevronRight, Store, UserCircle, DollarSign, Wallet, Calendar, Briefcase,
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Balance', icon: LayoutDashboard, roles: ['admin','administrador','jefe','encargado_almacen','jefe_produccion','agente_ventas','administradora'] },
  { path: '/productos', label: 'Productos', icon: Package, roles: ['encargado_almacen','admin','administrador','jefe'] },
  { path: '/inventario', label: 'Inventario', icon: Warehouse, roles: ['encargado_almacen','admin','administrador','jefe','jefe_produccion'] },
  { path: '/ventas', label: 'Ventas', icon: ShoppingCart, roles: ['agente_ventas','admin','administrador','jefe'] },
  { path: '/reportes', label: 'Reportes', icon: FileBarChart, roles: ['admin','administrador','jefe'] },
  { path: '/vendedores', label: 'Vendedores', icon: Users, roles: ['encargado_almacen','admin','administrador','jefe'] },
  { path: '/agenda', label: 'Agenda', icon: Calendar, roles: ['admin','administrador','jefe'] },
  { path: '/caja', label: 'Caja', icon: Wallet, roles: ['administradora','admin','administrador'] },
];

export default function Layout() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const currentLabel = navItems.find(n =>
    location.pathname === n.path || location.pathname.startsWith(n.path + '/')
  )?.label || 'Dashboard';

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50">
      {/* Mobile header */}
      <header className="lg:hidden bg-primary-900 text-white px-4 py-3 flex items-center justify-between fixed top-0 left-0 right-0 z-30 shadow-lg">
        <div className="flex items-center gap-3">
          <button onClick={() => setOpen(!open)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <div>
            <p className="text-sm font-display font-bold">Mueblería Cams</p>
            <p className="text-xs text-primary-300">{currentLabel}</p>
          </div>
        </div>
        <UserCircle className="w-6 h-6 text-primary-300" />
      </header>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/50 z-10 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-20 w-64 bg-primary-900 text-white flex flex-col transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="hidden lg:flex flex-col items-center px-5 py-5 border-b border-white/10 space-y-2.5">
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center p-2.5 shadow-lg">
            <img src="/logo.png" alt="Mueblería Cams" className="w-full h-full object-contain" />
          </div>
          <div className="text-center">
            <h1 className="text-base font-display font-bold text-white tracking-tight">Mueblería Cams</h1>
            <p className="text-xs text-primary-300">Sistema de Gestión</p>
          </div>
        </div>
        <div className="lg:hidden px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center p-1.5">
              <img src="/logo.png" alt="Mueblería Cams" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="text-sm font-display font-bold text-white">Mueblería Cams</p>
              <p className="text-xs text-primary-300">Sistema de Gestión</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.filter(item => !item.roles || item.roles.includes(user?.rol)).map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  isActive
                    ? 'bg-white/10 text-white font-medium shadow-sm'
                    : 'text-primary-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto text-primary-400" />}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="px-4 py-3 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <UserCircle className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xs">
                <p className="text-white font-medium">{user?.username || 'Usuario'}</p>
                <p className="text-primary-400 capitalize">{user?.rol || ''}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-primary-400 hover:text-red-400 hover:bg-white/5 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 mt-14 lg:mt-0">
        <header className="hidden lg:flex bg-white border-b border-gray-100 px-6 py-3 items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-display font-semibold text-gray-700">{currentLabel}</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">Mueblería Cams</span>
          </div>
        </header>
        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
