import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../services/authService";
import type { UsuarioRespostaDTO } from "../types/auth.types";
import {
  User,
  LogOut,
  ChevronDown,
  Heart,
  MessageCircle,
  PlusCircle,
  Settings,
  LayoutDashboard,
  LogIn,
  UserPlus,
} from "lucide-react";

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

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
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

const NavActionIcon: React.FC<NavActionIconProps> = ({
  icon,
  label,
  onClick,
}) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center gap-0.5 text-slate-600 px-2 py-1 rounded-lg hover:bg-slate-50 hover:text-reusehub-blue transition-colors cursor-pointer min-w-[56px]"
  >
    {icon}
    <span className="font-normal text-reusehub-gray-dark tracking-tighter text-[11px] hidden sm:block">
      {label}
    </span>
  </button>
);

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UsuarioRespostaDTO | null>(null);
  const [activeCategory, setActiveCategory] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUser(authService.getUser());

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setIsDropdownOpen(false);
    navigate("/login");
  };

  const getAvatarUrl = (url: string | null | undefined) => {
    if (!url) return DEFAULT_AVATAR;
    if (url.startsWith("http")) return url;
    return `http://localhost:8080${url.startsWith("/") ? url : `/${url}`}`;
  };

  return (
    <header className="bg-white border-b border-slate-100 sticky top-0 z-50 font-plus-jakarta-sans">
      <div className="max-w-[1200px] mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex-shrink-0">
            <Logo />
          </Link>
        </div>

        <div className="hidden md:flex flex-1 max-w-[400px] items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden h-10 focus-within:border-reusehub-blue focus-within:bg-white transition-all">
          <input
            type="text"
            placeholder="Buscar item..."
            className="flex-1 bg-transparent px-4 text-[14px] text-slate-700 outline-none"
          />
          <button className="bg-reusehub-blue hover:bg-blue-700 text-white px-5 h-full transition-colors">
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
          <div className="flex items-center gap-1">
            {user ? (
              <>
                <NavActionIcon
                  onClick={() => navigate("/favorites")}
                  icon={<Heart size={19} />}
                  label="Favoritos"
                />
                <NavActionIcon
                  onClick={() => navigate("/chat")}
                  icon={<MessageCircle size={19} />}
                  label="Chat"
                />
              </>
            ) : (
              <>
                <NavActionIcon
                  onClick={() => navigate("/login")}
                  icon={<LogIn size={19} />}
                  label="Entrar"
                />
                <NavActionIcon
                  onClick={() => navigate("/register")}
                  icon={<UserPlus size={19} />}
                  label="Criar conta"
                />
              </>
            )}
          </div>

          {user && (
            <div className="relative ml-2" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 p-1 pr-3 rounded-full hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100"
              >
                <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-reusehub-blue">
                  <img
                    src={getAvatarUrl(user.avatarUrl)}
                    alt={user.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
                    }}
                  />
                </div>
                <span className="text-sm font-bold text-slate-700 hidden lg:block">
                  {user.name.split(" ")[0]}
                </span>
                <ChevronDown
                  size={14}
                  className={`text-slate-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 animate-in fade-in zoom-in duration-150 origin-top-right">
                  <div className="px-4 py-3 border-b border-slate-50 mb-1">
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest text-left">
                      Sua Conta
                    </p>
                    <p className="text-sm font-bold text-slate-900 truncate text-left">
                      {user.name}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      navigate("/profile");
                      setIsDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors text-sm font-semibold"
                  >
                    <User size={18} /> Meu Perfil
                  </button>
                  <button
                    onClick={() => {
                      navigate("/my-listings");
                      setIsDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors text-sm font-semibold"
                  >
                    <LayoutDashboard size={18} /> Meus Anúncios
                  </button>
                  <div className="h-px bg-slate-50 my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-red-500 hover:bg-red-50 transition-colors text-sm font-bold"
                  >
                    <LogOut size={18} /> Sair
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            onClick={() =>
              user ? navigate("/create-listing") : navigate("/login")
            }
            className="ml-2 bg-reusehub-orange hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-[13px] font-extrabold flex items-center gap-2 shadow-lg shadow-orange-100 transition-all active:scale-95"
          >
            <PlusCircle size={18} />
            <span className="hidden sm:inline">Anunciar</span>
          </button>
        </div>
      </div>

      <div className="border-t border-slate-50 bg-white">
        <div className="max-w-[1200px] mx-auto px-4 flex items-center justify-between overflow-x-auto scrollbar-hide py-1.5">
          {CATEGORIES_BAR.map((cat, i) => (
            <button
              key={cat.label}
              onClick={() => setActiveCategory(i)}
              className={`flex flex-col items-center gap-1 px-4 border-b-2 transition-all flex-shrink-0 pb-1 ${
                activeCategory === i
                  ? "border-reusehub-blue text-reusehub-blue font-bold"
                  : "border-transparent text-slate-400 font-bold hover:text-reusehub-blue"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-[16px] transition-colors ${
                  activeCategory === i ? "bg-blue-50" : "bg-slate-50"
                }`}
              >
                {cat.icon}
              </div>
              <span className="text-[10px] tracking-wide">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
