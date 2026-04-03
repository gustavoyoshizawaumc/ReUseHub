import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../services/authService";
import type { User } from "../types/auth.types";

const CATEGORIES_BAR = [
  { icon: "🏠", label: "Imóveis" },
  { icon: "🛋️", label: "Móveis" },
  { icon: "📱", label: "Eletrônicos" },
  { icon: "👗", label: "Roupas" },
  { icon: "🚲", label: "Esportes" },
  { icon: "📚", label: "Livros" },
  { icon: "🧒", label: "Infantil" },
  { icon: "🍳", label: "Cozinha" },
  { icon: "🎮", label: "Games" },
  { icon: "🌱", label: "Jardinagem" },
  { icon: "🐾", label: "Pets" },
  { icon: "🔧", label: "Ferramentas" },
];

const Logo: React.FC = () => (
  <span className="font-bold text-[20px] leading-none select-none tracking-tight font-plus-jakarta-sans">
    <span className="text-reusehub-blue">Re</span>
    <span className="text-reusehub-orange">Use</span>
    <span className="text-reusehub-navy">Hub</span>
  </span>
);

interface NavActionIconProps {
  path: React.ReactNode;
  label: string;
  onClick?: () => void;
  className?: string;
}

const NavActionIcon: React.FC<NavActionIconProps> = ({
  path,
  label,
  onClick,
  className = "",
}) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-0.5 text-slate-600 px-2 py-1 rounded-lg hover:bg-slate-50 hover:text-reusehub-blue transition-colors cursor-pointer min-w-[56px] ${className}`}
  >
    <svg
      className="w-5 h-5 sm:w-4 sm:h-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      viewBox="0 0 24 24"
    >
      {path}
    </svg>
    <span className="font-normal text-reusehub-gray-dark tracking-tighter text-[11px] hidden sm:block">
      {label}
    </span>
  </button>
);

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [activeCategory, setActiveCategory] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setUser(authService.getUser());
  }, []);

  const handleAnnounceClick = () => {
    if (user) {
      navigate("/create-listing");
    } else {
      navigate("/login");
    }
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setIsMobileMenuOpen(false);
    navigate("/login");
  };

  return (
    <header className="bg-white border-b border-slate-100 sticky top-0 z-50 font-dm-sans">
      <div className="max-w-[1200px] mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            className="sm:hidden p-1 text-slate-600"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <Link to="/" className="flex-shrink-0">
            <Logo />
          </Link>
        </div>

        <div className="hidden md:flex flex-1 max-w-[450px] items-center bg-slate-50 border border-slate-200 rounded-lg overflow-hidden h-9">
          <input
            type="text"
            placeholder="Buscar item..."
            className="flex-1 bg-transparent px-3 text-[13px] text-slate-700 outline-none"
          />
          <div className="h-4 w-[1px] bg-slate-300"></div>
          <div className="flex items-center px-3 gap-1.5 text-slate-500">
            <span className="text-[11px] font-medium whitespace-nowrap">
              São Paulo - SP
            </span>
          </div>
          <button className="bg-reusehub-blue hover:bg-blue-700 text-white px-4 h-full transition-colors">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 ml-auto">
          <button className="md:hidden p-2 text-slate-600">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          {user && (
            <div className="hidden sm:flex items-center gap-1">
              <NavActionIcon
                path={
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                }
                label="Favoritos"
                onClick={() => navigate("/favorites")}
              />
              <NavActionIcon
                path={
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                }
                label="Chat"
                onClick={() => navigate("/chat")}
              />
            </div>
          )}

          {!user ? (
            <div className="hidden sm:flex items-center gap-1">
              <NavActionIcon
                path={
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                  />
                }
                label="Entrar"
                onClick={() => navigate("/login")}
              />
              <NavActionIcon
                path={
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z"
                  />
                }
                label="Criar conta"
                onClick={() => navigate("/register")}
              />
            </div>
          ) : (
            <button
              onClick={() => navigate("/profile")}
              className="flex flex-col items-center gap-0.5 px-3"
            >
              <div className="w-5 h-5 rounded-full bg-reusehub-blue flex items-center justify-center text-white text-[9px] font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-[10px] font-bold uppercase hidden sm:block">
                {user.name.split(" ")[0]}
              </span>
            </button>
          )}

          <button
            onClick={handleAnnounceClick}
            className="ml-2 bg-reusehub-orange hover:bg-orange-600 text-white px-3 sm:px-4 py-2 rounded-lg text-[12px] font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <span className="text-base font-bold">+</span>
            <span className="hidden sm:inline font-plus-jakarta-sans">
              Anunciar grátis
            </span>
            <span className="sm:hidden">Anunciar</span>
          </button>
        </div>
      </div>

      <div className="border-t border-slate-50 bg-white">
        <div className="max-w-[1200px] mx-auto px-4 flex items-center justify-between overflow-x-auto scrollbar-hide py-1 sm:py-1.5">
          {CATEGORIES_BAR.map((cat, i) => (
            <button
              key={cat.label}
              onClick={() => setActiveCategory(i)}
              className={`flex flex-col items-center gap-1 px-3 border-b-2 transition-all flex-shrink-0 ${
                activeCategory === i
                  ? "border-reusehub-blue text-reusehub-blue font-bold"
                  : "border-transparent text-slate-400 font-bold hover:text-reusehub-blue"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-md flex items-center justify-center text-[15px] transition-colors ${
                  activeCategory === i ? "bg-blue-50" : "bg-slate-50"
                }`}
              >
                {cat.icon}
              </div>

              <span
                className={`text-[10px] font-medium tracking-wide mb-1 transition-colors ${
                  activeCategory === i
                    ? "text-reusehub-blue"
                    : "text-reusehub-gray-dark"
                }`}
              >
                {cat.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] sm:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl p-6 flex flex-col gap-6 animate-in slide-in-from-left duration-300">
            <div className="flex justify-between items-center">
              <Logo />
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-slate-400"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <nav className="flex flex-col gap-1">
              {user && (
                <>
                  <button
                    onClick={() => {
                      navigate("/favorites");
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-4 p-3 text-slate-700 font-bold hover:bg-slate-50 rounded-xl"
                  >
                    <svg
                      className="w-5 h-5 text-reusehub-blue"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                    </svg>
                    Favoritos
                  </button>
                  <button
                    onClick={() => {
                      navigate("/chat");
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-4 p-3 text-slate-700 font-bold hover:bg-slate-50 rounded-xl"
                  >
                    <svg
                      className="w-5 h-5 text-reusehub-blue"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                    </svg>
                    Chat
                  </button>
                  <div className="h-[1px] bg-slate-100 my-2" />
                </>
              )}

              {!user ? (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      navigate("/login");
                      setIsMobileMenuOpen(false);
                    }}
                    className="text-left text-slate-700 font-bold p-3"
                  >
                    Entrar
                  </button>
                  <button
                    onClick={() => {
                      navigate("/register");
                      setIsMobileMenuOpen(false);
                    }}
                    className="text-left text-reusehub-blue font-bold p-3"
                  >
                    Criar conta
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      navigate("/profile");
                      setIsMobileMenuOpen(false);
                    }}
                    className="text-left text-slate-700 font-bold p-3"
                  >
                    Meu Perfil
                  </button>
                  <button
                    onClick={handleLogout}
                    className="text-left text-red-500 font-bold p-3"
                  >
                    Sair
                  </button>
                </div>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};
