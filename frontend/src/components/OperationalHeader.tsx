import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, ShieldCheck, UserCog } from "lucide-react";
import { authService } from "../services/authService";
import type { UsuarioRespostaDTO } from "../types/auth.types";

const Logo: React.FC = () => (
  <span className="font-bold text-[20px] leading-none tracking-tight font-plus-jakarta-sans">
    <span className="text-reusehub-blue">Re</span>
    <span className="text-reusehub-orange">Use</span>
    <span className="text-reusehub-navy">Hub</span>
  </span>
);

export const OperationalHeader: React.FC = () => {
  const navigate = useNavigate();
  const user = authService.getUser() as UsuarioRespostaDTO | null;
  const perfil = user?.perfil === "ADMIN" ? "Admin" : "Moderador";

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 font-plus-jakarta-sans backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/moderacao" className="flex items-center gap-3">
          <Logo />
          <span className="hidden rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-blue-700 sm:inline-flex">
            Painel operacional
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          <button
            onClick={() => navigate("/moderacao")}
            className="flex h-10 items-center gap-2 rounded-lg bg-reusehub-blue px-3 text-sm font-bold text-white transition-colors hover:bg-blue-700 sm:px-4"
          >
            <ShieldCheck size={17} />
            <span className="hidden sm:inline">Moderação</span>
          </button>

          <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700 md:flex">
            <UserCog size={17} className="text-reusehub-orange" />
            <span className="max-w-[180px] truncate">{user?.name ?? perfil}</span>
            <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-500">
              {perfil}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 sm:px-4"
          >
            <LogOut size={17} />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
