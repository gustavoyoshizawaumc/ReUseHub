import React from "react";
import { Link } from "react-router-dom";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0f172a] text-slate-400 py-8 border-t border-slate-800/50">
      <div className="max-w-[1200px] mx-auto px-4 grid grid-cols-1 md:grid-cols-10 gap-12 text-left">
        <div className="md:col-span-4 flex flex-col items-start">
          <div className="mb-1">
            <h2 className="text-2xl font-bold">
              <span className="text-blue-600">Re</span>
              <span className="text-orange-500">Use</span>
              <span className="text-slate-200">Hub</span>
            </h2>
          </div>
          <p className="text-xs leading-relaxed max-w-xs text-left">
            Plataforma gratuita de doação e troca de itens usados. Promovendo
            economia circular e consumo consciente.
          </p>
        </div>

        <div className="md:col-span-2 flex flex-col items-start">
          <h4 className="text-slate-100 font-semibold mb-4 text-sm tracking-wider">
            Navegar
          </h4>
          <ul className="text-xs space-y-4 text-left">
            <li>
              <Link
                to="/listings"
                className="hover:text-blue-500 transition-colors"
              >
                Anúncios
              </Link>
            </li>
            <li>
              <Link
                to="/categories"
                className="hover:text-blue-500 transition-colors"
              >
                Categorias
              </Link>
            </li>
            <li>
              <Link
                to="/how-it-works"
                className="hover:text-blue-500 transition-colors"
              >
                Como funciona
              </Link>
            </li>
            <li>
              <Link
                to="/create-listing"
                className="hover:text-blue-500 transition-colors"
              >
                Publicar anúncio
              </Link>
            </li>
          </ul>
        </div>

        <div className="md:col-span-2 flex flex-col items-start">
          <h4 className="text-slate-100 font-semibold mb-4 text-sm tracking-wider">
            Conta
          </h4>
          <ul className="text-xs space-y-4 text-left">
            <li>
              <Link
                to="/login"
                className="hover:text-blue-500 transition-colors"
              >
                Entrar
              </Link>
            </li>
            <li>
              <Link
                to="/register"
                className="hover:text-blue-500 transition-colors"
              >
                Criar conta
              </Link>
            </li>
            <li>
              <Link
                to="/my-listings"
                className="hover:text-blue-500 transition-colors"
              >
                Meus anúncios
              </Link>
            </li>
            <li>
              <Link
                to="/settings"
                className="hover:text-blue-500 transition-colors"
              >
                Configurações
              </Link>
            </li>
          </ul>
        </div>

        <div className="md:col-span-2 flex flex-col items-start">
          <h4 className="text-slate-100 font-semibold mb-4 text-sm tracking-wider">
            Suporte
          </h4>
          <ul className="text-xs space-y-4 text-left">
            <li>
              <Link
                to="/help"
                className="hover:text-blue-500 transition-colors"
              >
                Central de ajuda
              </Link>
            </li>
            <li>
              <Link
                to="/contact"
                className="hover:text-blue-500 transition-colors"
              >
                Fale conosco
              </Link>
            </li>
            <li>
              <Link
                to="/privacy"
                className="hover:text-blue-500 transition-colors"
              >
                Política de privacidade
              </Link>
            </li>
            <li>
              <Link
                to="/terms"
                className="hover:text-blue-500 transition-colors"
              >
                Termos de uso
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4">
        <div className="text-center text-xs mt-16 pt-8 border-t border-slate-800/50 text-slate-500">
          &copy; {new Date().getFullYear()} ReUseHub. Todos os direitos
          reservados.
        </div>
      </div>
    </footer>
  );
};
