import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ChevronRight,
  ClipboardCheck,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldAlert,
  ShieldCheck,
  Star,
  Users,
  X,
} from 'lucide-react';
import { authService } from '../../services/authService';

interface ModeracaoLayoutProps {
  children: React.ReactNode;
  title: string;
  description: string;
  counts: {
    anuncios: number;
    denuncias: number;
    suspeitos: number;
    avaliacoes: number;
  };
}

const Logo = () => (
  <span className="text-lg font-black leading-none">
    <span className="text-blue-600">Re</span>
    <span className="text-orange-500">Use</span>
    <span className="text-slate-900">Hub</span>
  </span>
);

export const ModeracaoLayout: React.FC<ModeracaoLayoutProps> = ({ children, title, description, counts }) => {
  const navigate = useNavigate();
  const [menuAberto, setMenuAberto] = useState(false);
  const user = authService.getUser();
  const isAdmin = user?.perfil === 'ADMIN';
  const perfil = isAdmin ? 'Administrador' : 'Moderador';

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const menuItems = [
    { to: '/moderacao', label: 'Visao geral', icon: LayoutDashboard, end: true },
    { to: '/moderacao/anuncios', label: 'Anuncios', icon: ClipboardCheck, count: counts.anuncios },
    { to: '/moderacao/denuncias', label: 'Denuncias', icon: AlertTriangle, count: counts.denuncias },
    { to: '/moderacao/suspeitos', label: 'Suspeitos', icon: ShieldAlert, count: counts.suspeitos },
    { to: '/moderacao/avaliacoes', label: 'Avaliacoes', icon: Star, count: counts.avaliacoes },
    { to: '/moderacao/historico', label: isAdmin ? 'Auditoria' : 'Historico', icon: History },
    ...(isAdmin ? [{ to: '/moderacao/usuarios', label: 'Usuarios', icon: Users }] : []),
  ];

  const sidebar = (
    <aside className="flex h-full w-[248px] flex-col border-r border-slate-200 bg-white">
      <div className="flex h-16 items-center border-b border-slate-100 px-5">
        <Logo />
      </div>

      <div className="px-4 py-5">
        <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white">
            {(user?.name ?? 'O').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-slate-900">{user?.name ?? perfil}</p>
            <p className="mt-0.5 truncate text-[11px] font-bold uppercase text-orange-600">{perfil}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3">
        <p className="mb-2 px-3 text-[10px] font-black uppercase text-slate-400">Operacao</p>
        {menuItems.map(({ to, label, icon: Icon, count, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setMenuAberto(false)}
            className={({ isActive }) =>
              `mb-1 flex h-10 items-center gap-3 rounded-md px-3 text-sm font-bold transition-colors ${
                isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <Icon size={17} />
            <span className="flex-1">{label}</span>
            {typeof count === 'number' && count > 0 && (
              <span className="min-w-5 rounded-full bg-orange-100 px-1.5 py-0.5 text-center text-[10px] font-black text-orange-700">
                {count}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-100 p-3">
        <button
          onClick={handleLogout}
          className="flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm font-bold text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
        >
          <LogOut size={17} />
          Sair
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-plus-jakarta-sans text-slate-900">
      <div className="fixed inset-y-0 left-0 z-40 hidden lg:block">{sidebar}</div>

      {menuAberto && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Fechar menu"
            className="absolute inset-0 bg-slate-950/25 transition-opacity"
            onClick={() => setMenuAberto(false)}
          />
          <div className="absolute inset-y-0 left-0 shadow-xl transition-transform">{sidebar}</div>
        </div>
      )}

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
                onClick={() => setMenuAberto((prev) => !prev)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 lg:hidden"
              >
                {menuAberto ? <X size={18} /> : <Menu size={18} />}
              </button>
              <div className="lg:hidden">
                <Logo />
              </div>
              <div className="hidden items-center gap-2 text-xs font-bold text-slate-400 sm:flex">
                <ShieldCheck size={15} className="text-blue-600" />
                <span>Painel interno</span>
                <ChevronRight size={14} />
                <span className="text-slate-600">{title}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden text-right sm:block">
                <p className="text-xs font-extrabold text-slate-800">{user?.name ?? perfil}</p>
                <p className="text-[10px] font-bold uppercase text-slate-400">{perfil}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-black text-white">
                {(user?.name ?? 'O').charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 md:px-6 lg:px-8">
          <div className="mx-auto max-w-[1440px]">
            <div className="mb-6">
              <h1 className="text-2xl font-black text-slate-950">{title}</h1>
              <p className="mt-1 max-w-3xl text-sm text-slate-500">{description}</p>
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
