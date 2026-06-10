import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Heart,
  LayoutDashboard,
  LogIn,
  LogOut,
  MapPin,
  MessageCircle,
  PlusCircle,
  Repeat2,
  Search,
  ShieldCheck,
  User,
  UserPlus,
} from "lucide-react";
import { AUTH_USER_UPDATED_EVENT, authService } from "../services/authService";
import { listarConversas } from "../services/chatService";
import { listarInteressesRecebidos } from "../services/interesseService";
import type { SessaoUsuario } from "../types/auth.types";
import { OperationalHeader } from "./OperationalHeader";
import { isUsuarioOperacional } from "../utils/perfil";
import { API_BASE_URL } from "../config/api";
import { registrarBusca } from "../utils/ultimasBuscas";
import { useCategorias } from "../hooks/useCategorias";
import {
  EVENTO_FILTRO_LOCALIZACAO,
  RAIOS_BUSCA_CEP,
  limparFiltroLocalizacaoSessao,
  normalizarCep,
  obterFiltroLocalizacaoSessao,
  salvarFiltroLocalizacaoSessao,
} from "../utils/filtroLocalizacao";

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

const Logo: React.FC = () => (
  <span className="font-bold text-[18px] leading-none select-none tracking-tight font-plus-jakarta-sans sm:text-[20px]">
    <span className="text-reusehub-blue">Re</span>
    <span className="text-reusehub-orange">Use</span>
    <span className="text-reusehub-navy">Hub</span>
  </span>
);

interface NavActionIconProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  showBadge?: boolean;
}

const NavActionIcon: React.FC<NavActionIconProps> = ({ icon, label, onClick, showBadge = false }) => (
  <button
    onClick={onClick}
    className="relative flex h-10 w-9 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-slate-600 transition-colors hover:bg-slate-50 hover:text-reusehub-blue sm:w-12 sm:px-2 md:min-w-[56px]"
  >
    {showBadge && (
      <span className="absolute right-1.5 top-1 h-2.5 w-2.5 rounded-full bg-reusehub-orange ring-2 ring-white sm:right-2" />
    )}
    {icon}
    <span className="hidden font-normal text-reusehub-gray-dark tracking-tighter text-[11px] md:block">{label}</span>
  </button>
);

const criarParamsBusca = (termo?: string, categoriaId?: number) => {
  const params = new URLSearchParams();
  if (termo && termo.trim()) params.set("termo", termo.trim());
  if (categoriaId) params.set("categoriaId", String(categoriaId));
  return params;
};

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { categorias } = useCategorias();
  const [user, setUser] = useState<SessaoUsuario | null>(() => authService.getUser());
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [cepBusca, setCepBusca] = useState(() => obterFiltroLocalizacaoSessao()?.cep ?? "");
  const [raioBuscaKm, setRaioBuscaKm] = useState(() => obterFiltroLocalizacaoSessao()?.raioKm ?? 10);
  const [temChatPendente, setTemChatPendente] = useState(false);
  const [temTrocaPendente, setTemTrocaPendente] = useState(false);
  const [podeRolarCategoriasEsquerda, setPodeRolarCategoriasEsquerda] = useState(false);
  const [podeRolarCategoriasDireita, setPodeRolarCategoriasDireita] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const categoriasRef = useRef<HTMLDivElement>(null);
  const categoriasBar = useMemo(
    () =>
      categorias
        .map((categoria) => ({ label: categoria.nome, categoriaId: categoria.id }))
        .sort((a, b) => a.label.localeCompare(b.label, "pt-BR")),
    [categorias]
  );

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearchTerm(params.get("termo") ?? "");
    setActiveCategory(params.get("categoriaId") ? Number(params.get("categoriaId")) : null);
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [location.search]);

  useEffect(() => {
    const sincronizarFiltroLocalizacao = () => {
      const filtro = obterFiltroLocalizacaoSessao();
      setCepBusca(filtro?.cep ?? "");
      setRaioBuscaKm(filtro?.raioKm ?? 10);
    };

    window.addEventListener(EVENTO_FILTRO_LOCALIZACAO, sincronizarFiltroLocalizacao);
    window.addEventListener("storage", sincronizarFiltroLocalizacao);

    return () => {
      window.removeEventListener(EVENTO_FILTRO_LOCALIZACAO, sincronizarFiltroLocalizacao);
      window.removeEventListener("storage", sincronizarFiltroLocalizacao);
    };
  }, []);

  useEffect(() => {
    const atualizarUsuario = () => setUser(authService.getUser());

    window.addEventListener(AUTH_USER_UPDATED_EVENT, atualizarUsuario);
    window.addEventListener("storage", atualizarUsuario);

    return () => {
      window.removeEventListener(AUTH_USER_UPDATED_EVENT, atualizarUsuario);
      window.removeEventListener("storage", atualizarUsuario);
    };
  }, []);

  useEffect(() => {
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTemChatPendente(false);
      setTemTrocaPendente(false);
      return;
    }

    const carregarIndicadores = async () => {
      try {
        const [conversas, interesses] = await Promise.all([listarConversas(), listarInteressesRecebidos()]);
        setTemChatPendente(conversas.some((conversa) => (conversa.naoLidas ?? 0) > 0));
        setTemTrocaPendente(interesses.some((interesse) => interesse.status === "PENDENTE"));
      } catch {
        setTemChatPendente(false);
        setTemTrocaPendente(false);
      }
    };
    const atualizarSeVisivel = () => {
      if (document.visibilityState === "visible") {
        carregarIndicadores();
      }
    };

    carregarIndicadores();
    const interval = window.setInterval(atualizarSeVisivel, 5000);
    document.addEventListener("visibilitychange", atualizarSeVisivel);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", atualizarSeVisivel);
    };
  }, [user]);

  useEffect(() => {
    const lista = categoriasRef.current;
    if (!lista) return;

    const atualizarSetas = () => {
      const margem = 4;
      setPodeRolarCategoriasEsquerda(lista.scrollLeft > margem);
      setPodeRolarCategoriasDireita(
        lista.scrollLeft + lista.clientWidth < lista.scrollWidth - margem
      );
    };

    atualizarSetas();
    lista.addEventListener("scroll", atualizarSetas, { passive: true });
    window.addEventListener("resize", atualizarSetas);

    return () => {
      lista.removeEventListener("scroll", atualizarSetas);
      window.removeEventListener("resize", atualizarSetas);
    };
  }, [categoriasBar.length]);

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setIsDropdownOpen(false);
    navigate("/login");
  };

  const getAvatarUrl = (url: string | null | undefined) => {
    if (!url) return DEFAULT_AVATAR;
    if (url.startsWith("http")) return url;
    return `${API_BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
  };

  const navegarParaBusca = (params: URLSearchParams, rotuloBusca?: string) => {
    const termoEfetivo = params.get("termo") ?? rotuloBusca ?? "";
    const categoriaIdRaw = params.get("categoriaId");
    const categoriaId = categoriaIdRaw ? Number(categoriaIdRaw) : null;

    registrarBusca(termoEfetivo, categoriaId);

    const query = params.toString();
    navigate(query ? `/anuncios?${query}` : "/anuncios");
  };

  const aplicarFiltroCepGlobal = () => {
    if (cepBusca.length === 8) {
      salvarFiltroLocalizacaoSessao(cepBusca, raioBuscaKm);
      return;
    }

    if (cepBusca.length === 0) {
      limparFiltroLocalizacaoSessao();
    }
  };

  const rolarCategorias = (direcao: "esquerda" | "direita") => {
    const lista = categoriasRef.current;
    if (!lista) return;

    lista.scrollBy({
      left: direcao === "direita" ? 320 : -320,
      behavior: "smooth",
    });
  };

  if (isUsuarioOperacional(user)) {
    return <OperationalHeader />;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 font-plus-jakarta-sans backdrop-blur">
      <div className="max-w-[1400px] mx-auto h-14 px-3 sm:px-4 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        <Link to="/" className="flex-shrink-0">
          <Logo />
        </Link>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            setActiveCategory(null);
            navegarParaBusca(criarParamsBusca(searchTerm));
          }}
          className="hidden md:flex flex-1 max-w-[400px] items-center bg-slate-50 border border-slate-200 rounded-lg overflow-hidden h-10 focus-within:border-reusehub-blue focus-within:bg-white transition-all"
        >
          <input
            type="text"
            placeholder="Buscar item..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent px-4 text-[14px] text-slate-700 outline-none"
          />
          <button type="submit" aria-label="Buscar" className="bg-reusehub-blue hover:bg-blue-700 text-white px-5 h-full transition-colors">
            <Search size={16} />
          </button>
        </form>

        <div className="relative hidden lg:block">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              aplicarFiltroCepGlobal();
            }}
            className="flex h-10 w-[245px] items-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 transition-all focus-within:border-reusehub-blue focus-within:bg-white xl:w-[270px]"
          >
            <MapPin size={16} className="ml-3 shrink-0 text-slate-400" />
            <input
              type="text"
              inputMode="numeric"
              placeholder="Filtrar por CEP"
              value={cepBusca}
              maxLength={8}
              onChange={(event) => setCepBusca(normalizarCep(event.target.value))}
              className="min-w-0 flex-1 bg-transparent px-2 text-[13px] font-semibold text-slate-700 outline-none placeholder:font-medium placeholder:text-slate-400"
              aria-label="CEP para filtrar anuncios por proximidade"
            />
            <select
              value={raioBuscaKm}
              onChange={(event) => setRaioBuscaKm(Number(event.target.value))}
              className="h-full w-[70px] border-l border-slate-200 bg-transparent px-1 text-[12px] font-bold text-slate-600 outline-none"
              aria-label="Raio de busca por CEP"
            >
              {RAIOS_BUSCA_CEP.map((raio) => (
                <option key={raio} value={raio}>
                  {raio}km
                </option>
              ))}
            </select>
            <button
              type="submit"
              className={`flex h-full w-10 shrink-0 items-center justify-center transition-colors ${
                cepBusca.length === 8
                  ? "bg-reusehub-blue text-white hover:bg-blue-700"
                  : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              }`}
              aria-label="Aplicar filtro por CEP"
              title="Aplicar filtro por CEP"
            >
              <Search size={14} />
            </button>
          </form>
          {cepBusca.length > 0 && cepBusca.length < 8 && (
            <span className="absolute left-1 top-full z-50 mt-1 whitespace-nowrap rounded-md border border-orange-100 bg-orange-50 px-2 py-1 text-[11px] font-semibold text-orange-600 shadow-sm">
              CEP incompleto — falta{8 - cepBusca.length > 1 ? "m" : ""} {8 - cepBusca.length} dígito{8 - cepBusca.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="flex min-w-0 items-center gap-0.5 sm:gap-2 ml-auto">
          <div className="flex items-center gap-1">
            {user ? (
              <>
                <NavActionIcon onClick={() => navigate("/favoritos")} icon={<Heart size={19} />} label="Favoritos" />
                <NavActionIcon onClick={() => navigate("/chat")} icon={<MessageCircle size={19} />} label="Chat" showBadge={temChatPendente} />
                <NavActionIcon onClick={() => navigate("/interesses")} icon={<Repeat2 size={19} />} label="Trocas" showBadge={temTrocaPendente} />
              </>
            ) : (
              <>
                <NavActionIcon onClick={() => navigate("/login")} icon={<LogIn size={19} />} label="Entrar" />
                <NavActionIcon onClick={() => navigate("/register")} icon={<UserPlus size={19} />} label="Criar conta" />
              </>
            )}
          </div>

          {user && (
            <div className="relative ml-0.5 sm:ml-2" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-1 rounded-lg border border-transparent p-0.5 pr-1 transition-colors hover:border-slate-200 hover:bg-slate-50 sm:gap-2 sm:p-1 sm:pr-3"
              >
                <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 sm:h-9 sm:w-9">
                  <img
                    src={getAvatarUrl(user.avatarUrl)}
                    alt={user.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
                    }}
                  />
                </div>
                <span className="text-sm font-bold text-slate-700 hidden lg:block">{user.name.split(" ")[0]}</span>
                <ChevronDown size={14} className={`hidden text-slate-400 transition-transform sm:block ${isDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-slate-200 bg-white py-2 shadow-xl shadow-black/40 animate-in fade-in zoom-in duration-150 origin-top-right">
                  <div className="px-4 py-3 border-b border-slate-50 mb-1">
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest text-left">Sua Conta</p>
                    <p className="text-sm font-bold text-slate-900 truncate text-left">{user.name}</p>
                  </div>
                  <button onClick={() => { navigate("/profile"); setIsDropdownOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors text-sm font-semibold">
                    <User size={18} /> Meu Perfil
                  </button>
                  <button onClick={() => { navigate("/meus-anuncios"); setIsDropdownOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors text-sm font-semibold">
                    <LayoutDashboard size={18} /> Meus Anuncios
                  </button>
                  {(user.perfil === "MODERADOR" || user.perfil === "ADMIN") && (
                    <button onClick={() => { navigate("/moderacao"); setIsDropdownOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-blue-600 hover:bg-blue-50 transition-colors text-sm font-semibold">
                      <ShieldCheck size={18} /> Moderacao
                    </button>
                  )}
                  <div className="h-px bg-slate-50 my-1" />
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-red-500 hover:bg-red-50 transition-colors text-sm font-bold">
                    <LogOut size={18} /> Sair
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => (user ? navigate("/create-listing") : navigate("/login"))}
            className="ml-0.5 flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-reusehub-orange p-0 text-[13px] font-extrabold text-white transition-colors hover:bg-orange-600 active:scale-[0.99] sm:ml-2 sm:w-auto sm:px-5 sm:py-2.5"
          >
            <PlusCircle size={18} />
            <span className="hidden sm:inline">Anunciar</span>
          </button>
        </div>
      </div>

      <div className="border-t border-slate-50 bg-white">
        <div className="relative mx-auto max-w-[1400px] px-3 sm:px-4">
          <button
            type="button"
            onClick={() => rolarCategorias("esquerda")}
            disabled={!podeRolarCategoriasEsquerda}
            aria-label="Ver categorias anteriores"
            className="absolute left-1 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:border-blue-200 hover:text-reusehub-blue disabled:pointer-events-none disabled:opacity-0 md:flex"
          >
            <ChevronLeft size={18} />
          </button>

          <div
            ref={categoriasRef}
            className="scrollbar-hide flex items-center justify-start gap-1 overflow-x-auto scroll-smooth px-0 py-2 md:px-10"
          >
            {categoriasBar.map((cat) => (
              <button
                key={cat.categoriaId}
                onClick={() => {
                  setActiveCategory(cat.categoriaId);
                  navegarParaBusca(criarParamsBusca(undefined, cat.categoriaId), cat.label);
                }}
                title={cat.label}
                className={`flex h-11 max-w-[160px] flex-shrink-0 items-center border-b-2 px-3 text-center text-[12px] font-extrabold leading-tight transition-colors ${
                  activeCategory === cat.categoriaId
                    ? "border-reusehub-blue text-reusehub-blue"
                    : "border-transparent text-slate-500 hover:text-reusehub-blue"
                }`}
              >
                <span className="line-clamp-2">{cat.label}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => rolarCategorias("direita")}
            disabled={!podeRolarCategoriasDireita}
            aria-label="Ver mais categorias"
            className="absolute right-1 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:border-blue-200 hover:text-reusehub-blue disabled:pointer-events-none disabled:opacity-0 md:flex"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};
