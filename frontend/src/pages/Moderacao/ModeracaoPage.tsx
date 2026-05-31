import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Search,
  ShieldOff,
  Star,
  Trash2,
  UserCog,
  Users,
  XCircle,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { ModeracaoLayout } from '../../components/moderacao/ModeracaoLayout';
import { authService } from '../../services/authService';
import {
  alterarUsuarioAdmin,
  analisarDenuncia,
  aprovarAnuncio,
  criarAdministrador,
  criarModerador,
  descartarDenuncia,
  listarAnunciosPendentes,
  listarAuditoria,
  listarAvaliacoesModeracao,
  listarDenuncias,
  listarMeuHistorico,
  listarSuspeitos,
  listarUsuariosAdmin,
  obterDashboardAdmin,
  reativarAnuncio,
  reprovarAnuncio,
  reprovarSuspeito,
  removerAvaliacaoModeracao,
  suspenderAnuncio,
  type AdminDashboard,
  type AdminUsuario,
  type AnuncioSuspeito,
  type AvaliacaoModeracao,
  type DashboardAdminFiltros,
  type DenunciaModeracao,
  type HistoricoModeracao,
  type UsuarioAdminFiltros,
} from '../../services/moderacaoService';
import { useCategorias } from '../../hooks/useCategorias';
import type { Anuncio } from '../../types/anuncio.types';

import { API_BASE_URL } from '../../config/api';

const BASE_URL = API_BASE_URL;

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Filler, Tooltip, Legend);

type Aba = 'visao-geral' | 'anuncios' | 'denuncias' | 'suspeitos' | 'avaliacoes' | 'historico' | 'usuarios';

const paginaConfig: Record<Aba, { title: string; description: string }> = {
  'visao-geral': {
    title: 'Visao geral',
    description: 'Acompanhe os principais indicadores e os pontos que precisam de atencao.',
  },
  anuncios: {
    title: 'Anuncios',
    description: 'Revise os anuncios enviados antes que eles sejam publicados no marketplace.',
  },
  denuncias: {
    title: 'Denuncias',
    description: 'Analise relatos abertos e registre a decisao tomada pela moderacao.',
  },
  suspeitos: {
    title: 'Anuncios suspeitos',
    description: 'Acompanhe conteudos com recorrencia de denuncias e aplique a acao adequada.',
  },
  avaliacoes: {
    title: 'Avaliacoes',
    description: 'Remova comentarios ofensivos ou que estejam fora das regras da plataforma.',
  },
  historico: {
    title: 'Historico de acoes',
    description: 'Consulte as decisoes registradas pela equipe operacional.',
  },
  usuarios: {
    title: 'Usuarios',
    description: 'Gerencie contas, filtros de acesso e perfis internos da plataforma.',
  },
};

const obterAbaPelaRota = (pathname: string, isAdmin: boolean): Aba => {
  if (pathname.endsWith('/anuncios')) return 'anuncios';
  if (pathname.endsWith('/denuncias')) return 'denuncias';
  if (pathname.endsWith('/suspeitos')) return 'suspeitos';
  if (pathname.endsWith('/avaliacoes')) return 'avaliacoes';
  if (pathname.endsWith('/historico')) return 'historico';
  if (pathname.endsWith('/usuarios') && isAdmin) return 'usuarios';
  return 'visao-geral';
};

const FILTROS_USUARIO_INICIAIS: UsuarioAdminFiltros = {
  termo: '',
  perfil: '',
  ativo: '',
  banido: '',
  criadoDe: '',
  criadoAte: '',
};

const CHAVE_FILTROS_USUARIO = 'reusehub:moderacao:filtros-usuarios';
const CHAVE_FILTROS_OPERACIONAIS = 'reusehub:moderacao:filtros-operacionais';
const CHAVE_FILTROS_DASHBOARD = 'reusehub:moderacao:filtros-dashboard';

type FiltrosOperacionais = {
  anuncios: string;
  denuncias: string;
  suspeitos: string;
  avaliacoes: string;
};

const FILTROS_OPERACIONAIS_INICIAIS: FiltrosOperacionais = {
  anuncios: '',
  denuncias: '',
  suspeitos: '',
  avaliacoes: '',
};

const dataIso = (data: Date) => data.toISOString().slice(0, 10);

const criarFiltrosDashboardPadrao = (): DashboardAdminFiltros => {
  const hoje = new Date();
  const inicio = new Date();
  inicio.setFullYear(inicio.getFullYear() - 1);
  return { criadoDe: dataIso(inicio), criadoAte: dataIso(hoje), tipo: '', status: '', categoriaId: '' };
};

const carregarFiltrosUsuariosSalvos = (): UsuarioAdminFiltros => {
  if (typeof window === 'undefined') return FILTROS_USUARIO_INICIAIS;

  try {
    const filtros = window.localStorage.getItem(CHAVE_FILTROS_USUARIO);
    return filtros ? { ...FILTROS_USUARIO_INICIAIS, ...JSON.parse(filtros) } : FILTROS_USUARIO_INICIAIS;
  } catch {
    return FILTROS_USUARIO_INICIAIS;
  }
};

const imageUrl = (url?: string) => {
  if (!url) return null;
  return url.startsWith('http') ? url : `${BASE_URL}${url}`;
};

const statusClass: Record<string, string> = {
  PENDENTE: 'bg-amber-50 text-amber-700 border-amber-100',
  ATIVO: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  SUSPENSO: 'bg-orange-50 text-orange-700 border-orange-100',
  REPROVADO: 'bg-rose-50 text-rose-700 border-rose-100',
  CONCLUIDO: 'bg-blue-50 text-blue-700 border-blue-100',
  RESERVADO: 'bg-sky-50 text-sky-700 border-sky-100',
  CANCELADO: 'bg-slate-50 text-slate-600 border-slate-200',
};

const SectionHeader = ({ title, description }: { title: string; description: string }) => (
  <div className="mb-5">
    <h2 className="text-xl font-extrabold text-slate-900">{title}</h2>
    <p className="mt-1 text-sm text-slate-500">{description}</p>
  </div>
);

const EmptyState = ({ text }: { text: string }) => (
  <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-sm font-semibold text-slate-500">
    {text}
  </div>
);

const ListToolbar = ({
  value,
  onChange,
  placeholder,
  resultCount,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  resultCount: number;
}) => (
  <div className="mb-4 flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
    <label className="relative block w-full max-w-xl">
      <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition-colors focus:border-blue-500 focus:bg-white"
      />
    </label>
    <span className="shrink-0 text-xs font-bold text-slate-400">{resultCount} resultado(s)</span>
  </div>
);

const Thumb = ({ urls, title }: { urls?: string[]; title: string }) => {
  const src = imageUrl(urls?.[0]);
  return (
    <div className="h-12 w-14 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-slate-50">
      {src ? (
        <img src={src} alt={title} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-slate-300">
          <FileText size={28} />
        </div>
      )}
    </div>
  );
};

export const ModeracaoPage: React.FC = () => {
  const location = useLocation();
  const { categorias } = useCategorias();
  const user = authService.getUser();
  const isAdmin = user?.perfil === 'ADMIN';
  const aba = obterAbaPelaRota(location.pathname, isAdmin);
  const paginaAtual = paginaConfig[aba];
  const [pendentes, setPendentes] = useState<Anuncio[]>([]);
  const [denuncias, setDenuncias] = useState<DenunciaModeracao[]>([]);
  const [suspeitos, setSuspeitos] = useState<AnuncioSuspeito[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoModeracao[]>([]);
  const [historico, setHistorico] = useState<HistoricoModeracao[]>([]);
  const [auditoria, setAuditoria] = useState<HistoricoModeracao[]>([]);
  const [usuarios, setUsuarios] = useState<AdminUsuario[]>([]);
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [erroDashboard, setErroDashboard] = useState<string | null>(null);
  const [processando, setProcessando] = useState<string | null>(null);
  const filtrosUsuariosInicializadosRef = useRef(false);
  const filtrosDashboardInicializadosRef = useRef(false);
  const [usuarioFiltros, setUsuarioFiltros] = useState<UsuarioAdminFiltros>(carregarFiltrosUsuariosSalvos);
  const [filtrosOperacionais, setFiltrosOperacionais] = useState<FiltrosOperacionais>(carregarFiltrosOperacionaisSalvos);
  const [dashboardFiltros, setDashboardFiltros] = useState<DashboardAdminFiltros>(carregarFiltrosDashboardSalvos);
  const filtrosUsuariosIniciaisRef = useRef(usuarioFiltros);
  const filtrosDashboardAtuaisRef = useRef(dashboardFiltros);
  filtrosDashboardAtuaisRef.current = dashboardFiltros;
  const [moderadorForm, setModeradorForm] = useState({
    name: '',
    email: '',
    password: '',
  });

  const carregarUsuarios = useCallback(async (filtros = usuarioFiltros) => {
    if (!isAdmin) return;

    setLoadingUsuarios(true);
    setErro(null);
    try {
      const usuariosData = await listarUsuariosAdmin(0, 20, filtros);
      setUsuarios(usuariosData.content ?? []);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Nao foi possivel listar usuarios.');
    } finally {
      setLoadingUsuarios(false);
    }
  }, [isAdmin, usuarioFiltros]);

  const carregarDashboard = useCallback(async (filtros = dashboardFiltros) => {
    if (!isAdmin) return;

    setLoadingDashboard(true);
    setErroDashboard(null);
    try {
      setDashboard(await obterDashboardAdmin(filtros));
    } catch (err) {
      setErroDashboard(err instanceof Error ? err.message : 'Nao foi possivel atualizar o dashboard.');
    } finally {
      setLoadingDashboard(false);
    }
  }, [dashboardFiltros, isAdmin]);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const [pendentesData, denunciasData, suspeitosData, avaliacoesData, historicoData] = await Promise.all([
        listarAnunciosPendentes(0, 20),
        listarDenuncias('ABERTA', 0, 20),
        listarSuspeitos(2),
        listarAvaliacoesModeracao(0, 20),
        listarMeuHistorico(0, 20),
      ]);
      setPendentes(pendentesData.content ?? []);
      setDenuncias(denunciasData.content ?? []);
      setSuspeitos(suspeitosData ?? []);
      setAvaliacoes(avaliacoesData.content ?? []);
      setHistorico(historicoData.content ?? []);

      if (isAdmin) {
        const [dashResult, usuariosResult, auditoriaResult] = await Promise.allSettled([
          obterDashboardAdmin(filtrosDashboardAtuaisRef.current),
          listarUsuariosAdmin(0, 20, filtrosUsuariosIniciaisRef.current),
          listarAuditoria(0, 20),
        ]);
        if (dashResult.status === 'fulfilled') {
          setDashboard(dashResult.value);
          setErroDashboard(null);
        } else {
          setErroDashboard(dashResult.reason instanceof Error ? dashResult.reason.message : 'Nao foi possivel carregar o dashboard.');
        }
        if (usuariosResult.status === 'fulfilled') setUsuarios(usuariosResult.value.content ?? []);
        if (auditoriaResult.status === 'fulfilled') setAuditoria(auditoriaResult.value.content ?? []);
      }
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Nao foi possivel carregar o painel.');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    // Carregamento inicial dos dados do painel: fetch unico no mount.
    // A regra set-state-in-effect e overly strict para este padrao;
    // refator futuro: migrar para TanStack Query ou useEffectEvent.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregar();
  }, [carregar]);

  useEffect(() => {
    if (!isAdmin) return;

    window.localStorage.setItem(CHAVE_FILTROS_USUARIO, JSON.stringify(usuarioFiltros));

    if (!filtrosUsuariosInicializadosRef.current) {
      filtrosUsuariosInicializadosRef.current = true;
      return;
    }

    const timeout = window.setTimeout(() => {
      carregarUsuarios();
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [carregarUsuarios, isAdmin, usuarioFiltros]);

  useEffect(() => {
    window.localStorage.setItem(CHAVE_FILTROS_OPERACIONAIS, JSON.stringify(filtrosOperacionais));
  }, [filtrosOperacionais]);

  useEffect(() => {
    if (!isAdmin) return;

    window.localStorage.setItem(CHAVE_FILTROS_DASHBOARD, JSON.stringify(dashboardFiltros));

    if (!filtrosDashboardInicializadosRef.current) {
      filtrosDashboardInicializadosRef.current = true;
      return;
    }

    const timeout = window.setTimeout(() => {
      carregarDashboard();
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [carregarDashboard, dashboardFiltros, isAdmin]);

  const executar = async (id: string, acao: () => Promise<unknown>) => {
    setProcessando(id);
    setErro(null);
    try {
      await acao();
      await carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Nao foi possivel concluir a acao.');
    } finally {
      setProcessando(null);
    }
  };

  const executarUsuario = async (id: string, acao: () => Promise<unknown>) => {
    setProcessando(id);
    setErro(null);
    try {
      await acao();
      await carregarUsuarios();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Nao foi possivel concluir a acao.');
    } finally {
      setProcessando(null);
    }
  };

  const criarContaInterna = async (event: React.SyntheticEvent, tipo: 'MODERADOR' | 'ADMIN') => {
    event.preventDefault();
    await executar(`novo-${tipo}`, async () => {
      if (tipo === 'ADMIN') {
        await criarAdministrador(moderadorForm);
      } else {
        await criarModerador(moderadorForm);
      }
      setModeradorForm({ name: '', email: '', password: '' });
    });
  };

  const removerAvaliacao = async (avaliacao: AvaliacaoModeracao) => {
    const justificativa = window.prompt('Informe a justificativa para remover esta avaliacao:');
    if (justificativa === null) return;

    await executar(avaliacao.id, () =>
      removerAvaliacaoModeracao(avaliacao.id, justificativa.trim() || 'Avaliacao removida pela moderacao.')
    );
  };

  const alterarFiltroUsuario = <K extends keyof UsuarioAdminFiltros>(campo: K, valor: UsuarioAdminFiltros[K]) => {
    setUsuarioFiltros((prev) => ({ ...prev, [campo]: valor }));
  };

  const alterarFiltroOperacional = (campo: keyof FiltrosOperacionais, valor: string) => {
    setFiltrosOperacionais((prev) => ({ ...prev, [campo]: valor }));
  };

  const alterarFiltroDashboard = <K extends keyof DashboardAdminFiltros>(campo: K, valor: DashboardAdminFiltros[K]) => {
    setDashboardFiltros((prev) => ({ ...prev, [campo]: valor }));
  };

  const definirPeriodoDashboard = (dias: number) => {
    const hoje = new Date();
    const inicio = new Date();
    inicio.setDate(inicio.getDate() - dias);
    setDashboardFiltros((prev) => ({ ...prev, criadoDe: dataIso(inicio), criadoAte: dataIso(hoje) }));
  };

  const contemTermo = (termo: string, ...valores: Array<string | undefined>) => {
    const normalizado = termo.trim().toLocaleLowerCase('pt-BR');
    return !normalizado || valores.some((valor) => valor?.toLocaleLowerCase('pt-BR').includes(normalizado));
  };

  const pendentesFiltrados = pendentes.filter((anuncio) =>
    contemTermo(filtrosOperacionais.anuncios, anuncio.titulo, anuncio.descricao, anuncio.nomeUsuario, anuncio.nomeCategoria)
  );
  const denunciasFiltradas = denuncias.filter((denuncia) =>
    contemTermo(filtrosOperacionais.denuncias, denuncia.tituloAnuncio, denuncia.nomeDenunciante, denuncia.motivo, denuncia.descricao)
  );
  const suspeitosFiltrados = suspeitos.filter((anuncio) =>
    contemTermo(filtrosOperacionais.suspeitos, anuncio.titulo, anuncio.nomeUsuario, anuncio.status)
  );
  const avaliacoesFiltradas = avaliacoes.filter((avaliacao) =>
    contemTermo(filtrosOperacionais.avaliacoes, avaliacao.anuncioTitulo, avaliacao.avaliadorNome, avaliacao.avaliadoNome, avaliacao.comentario)
  );
  const counts = useMemo(
    () => ({
      anuncios: pendentes.length,
      denuncias: denuncias.length,
      suspeitos: suspeitos.length,
      avaliacoes: avaliacoes.length,
    }),
    [avaliacoes.length, denuncias.length, pendentes.length, suspeitos.length]
  );

  const metricas = dashboard
    ? [
        { label: 'Usuarios', value: dashboard.totalUsuarios },
        { label: 'Ativos', value: dashboard.usuariosAtivos },
        { label: 'Banidos', value: dashboard.usuariosBanidos },
        { label: 'Anuncios', value: dashboard.totalAnuncios },
        { label: 'Pendentes', value: dashboard.anunciosPendentes },
        { label: 'Denuncias abertas', value: dashboard.denunciasAbertas },
      ]
    : [];

  return (
    <ModeracaoLayout
      title={paginaAtual.title}
      description={paginaAtual.description}
      counts={counts}
    >
      {erro && (
        <div className="mb-5 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {erro}
        </div>
      )}

      {loading ? (
        <div className="rounded-md border border-slate-200 bg-white p-12 text-center font-bold text-slate-500 shadow-sm">
          Carregando painel...
        </div>
      ) : (
        <>
          {aba === 'visao-geral' && (
            <section className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Anuncios pendentes" value={pendentes.length} icon={Clock3} />
                <MetricCard label="Denuncias abertas" value={denuncias.length} icon={AlertTriangle} tone="orange" />
                <MetricCard label="Anuncios suspeitos" value={suspeitos.length} icon={ShieldOff} tone="orange" />
                <MetricCard label="Avaliacoes registradas" value={avaliacoes.length} icon={Star} />
              </div>

              {isAdmin && (
                <>
                  <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <h2 className="flex items-center gap-2 text-sm font-black text-slate-900">
                          <CalendarDays size={17} className="text-blue-600" />
                          Filtros do dashboard
                        </h2>
                        <p className="mt-1 text-xs text-slate-500">Os indicadores, graficos e rankings usam a mesma selecao.</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {[30, 90, 365].map((dias) => (
                          <button
                            key={dias}
                            type="button"
                            onClick={() => definirPeriodoDashboard(dias)}
                            className="rounded-md border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                          >
                            {dias === 365 ? '12 meses' : `${dias} dias`}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setDashboardFiltros({ criadoDe: '', criadoAte: '', tipo: '', status: '', categoriaId: '' })}
                          className="rounded-md border border-slate-200 px-3 py-2 text-xs font-bold text-slate-500 transition-colors hover:bg-slate-50"
                        >
                          Limpar
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                      <input type="date" value={dashboardFiltros.criadoDe ?? ''} onChange={(event) => alterarFiltroDashboard('criadoDe', event.target.value)} className="h-10 rounded-md border border-slate-200 px-3 text-sm text-slate-600 outline-none focus:border-blue-500" />
                      <input type="date" value={dashboardFiltros.criadoAte ?? ''} onChange={(event) => alterarFiltroDashboard('criadoAte', event.target.value)} className="h-10 rounded-md border border-slate-200 px-3 text-sm text-slate-600 outline-none focus:border-blue-500" />
                      <select value={dashboardFiltros.tipo ?? ''} onChange={(event) => alterarFiltroDashboard('tipo', event.target.value as DashboardAdminFiltros['tipo'])} className="h-10 rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-600 outline-none focus:border-blue-500">
                        <option value="">Todos os tipos</option>
                        <option value="DOACAO">Doacao</option>
                        <option value="TROCA">Troca</option>
                      </select>
                      <select value={dashboardFiltros.status ?? ''} onChange={(event) => alterarFiltroDashboard('status', event.target.value as DashboardAdminFiltros['status'])} className="h-10 rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-600 outline-none focus:border-blue-500">
                        <option value="">Todos os status</option>
                        {['ATIVO', 'PENDENTE', 'REPROVADO', 'SUSPENSO', 'RESERVADO', 'CONCLUIDO', 'CANCELADO'].map((status) => <option key={status} value={status}>{status}</option>)}
                      </select>
                      <select value={dashboardFiltros.categoriaId ?? ''} onChange={(event) => alterarFiltroDashboard('categoriaId', event.target.value ? Number(event.target.value) : '')} className="h-10 rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-600 outline-none focus:border-blue-500">
                        <option value="">Todas as categorias</option>
                        {categorias.map((categoria) => <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>)}
                      </select>
                    </div>
                    {loadingDashboard && <p className="mt-3 text-xs font-bold text-blue-600">Atualizando indicadores...</p>}
                  </div>

                  {erroDashboard && (
                    <div className="flex flex-col gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
                      <p className="font-semibold">{erroDashboard}</p>
                      <button
                        type="button"
                        onClick={() => carregarDashboard()}
                        disabled={loadingDashboard}
                        className="shrink-0 rounded-md border border-amber-300 bg-white px-3 py-2 text-xs font-black text-amber-800 transition-colors hover:bg-amber-100 disabled:opacity-50"
                      >
                        Tentar novamente
                      </button>
                    </div>
                  )}

                  {dashboard ? (
                    <>
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {metricas.map((metrica) => (
                          <div key={metrica.label} className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                            <p className="text-[11px] font-black uppercase text-slate-400">{metrica.label}</p>
                            <p className="mt-2 text-2xl font-black text-slate-950">{metrica.value}</p>
                          </div>
                        ))}
                      </div>
                      <div className="grid gap-4 xl:grid-cols-2">
                        <ChartCard title="Usuarios por periodo">
                          <Line
                            data={{
                              labels: dashboard.usuariosPorMes.map((item) => item.label),
                              datasets: [
                                {
                                  label: 'Usuarios',
                                  data: dashboard.usuariosPorMes.map((item) => item.valor),
                                  borderColor: '#2563eb',
                                  backgroundColor: 'rgba(37, 99, 235, 0.1)',
                                  tension: 0.35,
                                  fill: true,
                                },
                              ],
                            }}
                            options={chartOptions}
                          />
                        </ChartCard>
                        <ChartCard title="Anuncios por status">
                          <Bar
                            data={{
                              labels: ['Ativos', 'Pendentes', 'Reprovados', 'Concluidos'],
                              datasets: [
                                {
                                  label: 'Anuncios',
                                  data: [
                                    dashboard.anunciosAtivos,
                                    dashboard.anunciosPendentes,
                                    dashboard.anunciosReprovados,
                                    dashboard.anunciosConcluidos,
                                  ],
                                  backgroundColor: ['#2563eb', '#f97316', '#ef4444', '#0f766e'],
                                  borderRadius: 4,
                                },
                              ],
                            }}
                            options={chartOptions}
                          />
                        </ChartCard>
                        <ChartCard title="Doacao vs troca">
                          <Pie
                            data={{
                              labels: ['Doacao', 'Troca'],
                              datasets: [
                                {
                                  data: [dashboard.anunciosDoacao, dashboard.anunciosTroca],
                                  backgroundColor: ['#2563eb', '#f97316'],
                                  borderColor: '#ffffff',
                                  borderWidth: 3,
                                },
                              ],
                            }}
                            options={chartOptions}
                          />
                        </ChartCard>
                        <ChartCard title="Concluidos por mes">
                          <Line
                            data={{
                              labels: dashboard.concluidosPorMes.map((item) => item.label),
                              datasets: [
                                {
                                  label: 'Concluidos',
                                  data: dashboard.concluidosPorMes.map((item) => item.valor),
                                  borderColor: '#f97316',
                                  backgroundColor: 'rgba(249, 115, 22, 0.1)',
                                  tension: 0.35,
                                  fill: true,
                                },
                              ],
                            }}
                            options={chartOptions}
                          />
                        </ChartCard>
                        <ChartCard title="Anuncios criados por periodo">
                          <Bar
                            data={{
                              labels: dashboard.anunciosCriadosPorMes.map((item) => item.label),
                              datasets: [
                                { label: 'Doacao', data: dashboard.anunciosCriadosPorMes.map((item) => item.primeiroValor), backgroundColor: '#2563eb', borderRadius: 4 },
                                { label: 'Troca', data: dashboard.anunciosCriadosPorMes.map((item) => item.segundoValor), backgroundColor: '#f97316', borderRadius: 4 },
                              ],
                            }}
                            options={chartOptions}
                          />
                        </ChartCard>
                        <ChartCard title="Denuncias por periodo">
                          <Bar
                            data={{
                              labels: dashboard.denunciasPorMes.map((item) => item.label),
                              datasets: [
                                { label: 'Abertas', data: dashboard.denunciasPorMes.map((item) => item.primeiroValor), backgroundColor: '#f97316', borderRadius: 4 },
                                { label: 'Resolvidas', data: dashboard.denunciasPorMes.map((item) => item.segundoValor), backgroundColor: '#0f766e', borderRadius: 4 },
                              ],
                            }}
                            options={chartOptions}
                          />
                        </ChartCard>
                      </div>
                      <div className="grid gap-4 xl:grid-cols-3">
                        <RankingCard title="Anuncios mais visualizados" items={dashboard.anunciosMaisVisualizados} />
                        <RankingCard title="Categorias com mais anuncios" items={dashboard.categoriasComMaisAnuncios} />
                        <RankingCard title="Usuarios com melhor reputacao" items={dashboard.usuariosMelhorReputacao} />
                      </div>
                    </>
                  ) : !loadingDashboard && (
                    <div className="rounded-md border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm font-semibold text-slate-500">
                      Nao foi possivel carregar os indicadores administrativos.
                    </div>
                  )}
                </>
              )}

              <section>
                <SectionHeader
                  title={isAdmin ? 'Auditoria recente' : 'Atividade recente'}
                  description="Ultimas acoes registradas pela equipe operacional."
                />
                <HistoricoList itens={(isAdmin ? auditoria : historico).slice(0, 6)} />
              </section>
            </section>
          )}

              {aba === 'anuncios' && (
                <section>
                  <ListToolbar
                    value={filtrosOperacionais.anuncios}
                    onChange={(value) => alterarFiltroOperacional('anuncios', value)}
                    placeholder="Buscar por titulo, anunciante ou categoria"
                    resultCount={pendentesFiltrados.length}
                  />
                  {pendentesFiltrados.length === 0 ? (
                    <EmptyState text="Nenhum anuncio pendente agora." />
                  ) : (
                    <div className="overflow-x-auto rounded-md border border-slate-200 bg-white shadow-sm">
                      <table className="w-full min-w-[820px] text-left text-sm">
                        <thead className="bg-slate-50 text-[11px] font-black uppercase text-slate-400">
                          <tr>
                            <th className="px-4 py-3">Anuncio</th>
                            <th className="px-4 py-3">Anunciante</th>
                            <th className="px-4 py-3">Tipo</th>
                            <th className="px-4 py-3 text-right">Acoes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {pendentesFiltrados.map((anuncio) => (
                            <tr key={anuncio.id} className="transition-colors hover:bg-slate-50">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <Thumb urls={anuncio.imagensUrls} title={anuncio.titulo} />
                                  <div className="min-w-0">
                                    <p className="font-extrabold text-slate-900">{anuncio.titulo}</p>
                                    <p className="mt-0.5 max-w-xl truncate text-xs text-slate-500">{anuncio.descricao}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <p className="font-bold text-slate-700">{anuncio.nomeUsuario}</p>
                                <p className="text-xs text-slate-400">{anuncio.nomeCategoria}</p>
                              </td>
                              <td className="px-4 py-3">
                                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-black uppercase text-slate-600">
                                  {anuncio.tipo}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex justify-end gap-2">
                                  <button onClick={() => executar(anuncio.id, () => reprovarAnuncio(anuncio.id))} disabled={processando === anuncio.id} className="inline-flex items-center gap-1.5 rounded-md border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-50">
                                    <XCircle size={15} /> Reprovar
                                  </button>
                                  <button onClick={() => executar(anuncio.id, () => aprovarAnuncio(anuncio.id))} disabled={processando === anuncio.id} className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-50">
                                    <CheckCircle2 size={15} /> Aprovar
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              )}

              {aba === 'denuncias' && (
                <section>
                  <ListToolbar
                    value={filtrosOperacionais.denuncias}
                    onChange={(value) => alterarFiltroOperacional('denuncias', value)}
                    placeholder="Buscar por anuncio, denunciante ou motivo"
                    resultCount={denunciasFiltradas.length}
                  />
                  {denunciasFiltradas.length === 0 ? (
                    <EmptyState text="Nenhuma denuncia aberta." />
                  ) : (
                    <div className="overflow-x-auto rounded-md border border-slate-200 bg-white shadow-sm">
                      <table className="w-full min-w-[900px] text-left text-sm">
                        <thead className="bg-slate-50 text-[11px] font-black uppercase text-slate-400">
                          <tr>
                            <th className="px-4 py-3">Anuncio</th>
                            <th className="px-4 py-3">Motivo</th>
                            <th className="px-4 py-3">Denunciante</th>
                            <th className="px-4 py-3">Recorrencia</th>
                            <th className="px-4 py-3 text-right">Acoes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {denunciasFiltradas.map((denuncia) => (
                            <tr key={denuncia.id} className="transition-colors hover:bg-slate-50">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <Thumb urls={denuncia.imagensUrls} title={denuncia.tituloAnuncio} />
                                  <p className="font-extrabold text-slate-900">{denuncia.tituloAnuncio}</p>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <p className="font-bold text-slate-700">{denuncia.motivo}</p>
                                {denuncia.descricao && <p className="mt-0.5 max-w-sm truncate text-xs text-slate-400">{denuncia.descricao}</p>}
                              </td>
                              <td className="px-4 py-3 text-xs font-bold text-slate-600">{denuncia.nomeDenunciante}</td>
                              <td className="px-4 py-3">
                                <span className="rounded-full bg-orange-50 px-2 py-1 text-[10px] font-black uppercase text-orange-700">
                                  {denuncia.denunciasAbertasDoAnuncio} aberta(s)
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex justify-end gap-2">
                                  <button onClick={() => executar(denuncia.id, () => descartarDenuncia(denuncia.id, 'Denuncia improcedente.'))} disabled={processando === denuncia.id} className="rounded-md bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-50">
                                    Descartar
                                  </button>
                                  <button onClick={() => executar(denuncia.id, () => analisarDenuncia(denuncia.id, 'Denuncia analisada.'))} disabled={processando === denuncia.id} className="rounded-md bg-blue-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-50">
                                    Analisar
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              )}

              {aba === 'suspeitos' && (
                <section>
                  <ListToolbar
                    value={filtrosOperacionais.suspeitos}
                    onChange={(value) => alterarFiltroOperacional('suspeitos', value)}
                    placeholder="Buscar por titulo, anunciante ou status"
                    resultCount={suspeitosFiltrados.length}
                  />
                  {suspeitosFiltrados.length === 0 ? (
                    <EmptyState text="Nenhum anuncio suspeito pelos filtros atuais." />
                  ) : (
                    <div className="overflow-x-auto rounded-md border border-slate-200 bg-white shadow-sm">
                      <table className="w-full min-w-[820px] text-left text-sm">
                        <thead className="bg-slate-50 text-[11px] font-black uppercase text-slate-400">
                          <tr>
                            <th className="px-4 py-3">Anuncio</th>
                            <th className="px-4 py-3">Anunciante</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Denuncias</th>
                            <th className="px-4 py-3 text-right">Acoes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {suspeitosFiltrados.map((anuncio) => (
                            <tr key={anuncio.anuncioId} className="transition-colors hover:bg-slate-50">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <Thumb urls={anuncio.imagensUrls} title={anuncio.titulo} />
                                  <p className="font-extrabold text-slate-900">{anuncio.titulo}</p>
                                </div>
                              </td>
                              <td className="px-4 py-3 font-bold text-slate-600">{anuncio.nomeUsuario}</td>
                              <td className="px-4 py-3">
                                <span className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase ${statusClass[anuncio.status] ?? statusClass.PENDENTE}`}>
                                  {anuncio.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-black text-orange-700">{anuncio.denunciasAbertas}</td>
                              <td className="px-4 py-3">
                                <div className="flex justify-end gap-2">
                                  <button onClick={() => executar(anuncio.anuncioId, () => suspenderAnuncio(anuncio.anuncioId, 'Suspenso para analise.'))} className="rounded-md bg-orange-50 px-3 py-2 text-xs font-bold text-orange-700 transition-colors hover:bg-orange-100">Suspender</button>
                                  <button onClick={() => executar(anuncio.anuncioId, () => reativarAnuncio(anuncio.anuncioId, 'Reativado apos analise.'))} className="rounded-md bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100">Reativar</button>
                                  <button onClick={() => executar(anuncio.anuncioId, () => reprovarSuspeito(anuncio.anuncioId, 'Reprovado apos denuncias.'))} className="rounded-md bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-100">Reprovar</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              )}

              {aba === 'avaliacoes' && (
                <section>
                  <ListToolbar
                    value={filtrosOperacionais.avaliacoes}
                    onChange={(value) => alterarFiltroOperacional('avaliacoes', value)}
                    placeholder="Buscar por anuncio, avaliador ou comentario"
                    resultCount={avaliacoesFiltradas.length}
                  />
                  {avaliacoesFiltradas.length === 0 ? (
                    <EmptyState text="Nenhuma avaliacao registrada." />
                  ) : (
                    <div className="overflow-x-auto rounded-md border border-slate-200 bg-white shadow-sm">
                      <table className="w-full min-w-[900px] text-left text-sm">
                        <thead className="bg-slate-50 text-[11px] font-black uppercase text-slate-400">
                          <tr>
                            <th className="px-4 py-3">Avaliacao</th>
                            <th className="px-4 py-3">Participantes</th>
                            <th className="px-4 py-3">Comentario</th>
                            <th className="px-4 py-3">Data</th>
                            <th className="px-4 py-3 text-right">Acao</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {avaliacoesFiltradas.map((avaliacao) => (
                            <tr key={avaliacao.id} className="transition-colors hover:bg-slate-50">
                              <td className="px-4 py-3">
                                <p className="font-extrabold text-slate-900">{avaliacao.anuncioTitulo}</p>
                                <span className="mt-1 inline-flex items-center gap-0.5">
                                  {Array.from({ length: 5 }).map((_, index) => (
                                    <Star key={index} size={13} className={index < avaliacao.nota ? 'fill-amber-400 text-amber-400' : 'text-amber-200'} />
                                  ))}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-xs font-semibold text-slate-600">
                                {avaliacao.avaliadorNome} avaliou {avaliacao.avaliadoNome}
                              </td>
                              <td className="px-4 py-3 text-xs text-slate-500">
                                <p className="max-w-sm truncate">{avaliacao.comentario || 'Sem comentario.'}</p>
                              </td>
                              <td className="px-4 py-3 text-xs font-semibold text-slate-400">
                                {avaliacao.criadoEm ? new Date(avaliacao.criadoEm).toLocaleString('pt-BR') : ''}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button onClick={() => removerAvaliacao(avaliacao)} disabled={processando === avaliacao.id} className="inline-flex items-center gap-1.5 rounded-md bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-50">
                                  <Trash2 size={15} /> Remover
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              )}

              {aba === 'historico' && (
                <section>
                  <HistoricoList itens={isAdmin ? auditoria : historico} />
                </section>
              )}

              {aba === 'usuarios' && isAdmin && (
                <section className="space-y-6">
                  <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
                    <form onSubmit={(event) => criarContaInterna(event, 'MODERADOR')} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                      <h3 className="mb-4 flex items-center gap-2 text-lg font-black text-slate-950">
                        <UserCog size={19} />
                        Criar conta interna
                      </h3>
                      {(['name', 'email', 'password'] as const).map((field) => (
                        <input
                          key={field}
                          type={field === 'password' ? 'password' : 'text'}
                          required
                          value={moderadorForm[field]}
                          onChange={(e) => setModeradorForm((prev) => ({ ...prev, [field]: e.target.value }))}
                          placeholder={field === 'name' ? 'Nome' : field === 'email' ? 'E-mail' : 'Senha'}
                          className="mb-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                        />
                      ))}
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <button
                          type="submit"
                          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
                        >
                          Criar moderador
                        </button>
                        <button
                          type="button"
                          onClick={(event) => criarContaInterna(event, 'ADMIN')}
                          className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
                        >
                          Criar admin
                        </button>
                      </div>
                      <p className="mt-3 text-xs font-semibold text-slate-400">
                        CPF tecnico e consentimento interno sao gerados automaticamente.
                      </p>
                    </form>

                    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <h3 className="flex items-center gap-2 text-lg font-black text-slate-950">
                          <Users size={19} />
                          Usuarios
                        </h3>
                      </div>
                      <div className="mb-4 grid gap-2 md:grid-cols-2 xl:grid-cols-6">
                        <input
                          value={usuarioFiltros.termo ?? ''}
                          onChange={(e) => alterarFiltroUsuario('termo', e.target.value)}
                          placeholder="Nome, e-mail ou CPF"
                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 xl:col-span-2"
                        />
                        <select
                          value={usuarioFiltros.perfil ?? ''}
                          onChange={(e) => alterarFiltroUsuario('perfil', e.target.value as UsuarioAdminFiltros['perfil'])}
                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 outline-none focus:border-blue-500"
                        >
                          <option value="">Todos os perfis</option>
                          <option value="USUARIO">Usuario</option>
                          <option value="MODERADOR">Moderador</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                        <select
                          value={usuarioFiltros.ativo === '' ? '' : String(usuarioFiltros.ativo)}
                          onChange={(e) => alterarFiltroUsuario('ativo', e.target.value === '' ? '' : e.target.value === 'true')}
                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 outline-none focus:border-blue-500"
                        >
                          <option value="">Ativos/inativos</option>
                          <option value="true">Ativos</option>
                          <option value="false">Inativos</option>
                        </select>
                        <select
                          value={usuarioFiltros.banido === '' ? '' : String(usuarioFiltros.banido)}
                          onChange={(e) => alterarFiltroUsuario('banido', e.target.value === '' ? '' : e.target.value === 'true')}
                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 outline-none focus:border-blue-500"
                        >
                          <option value="">Banidos/todos</option>
                          <option value="true">Banidos</option>
                          <option value="false">Nao banidos</option>
                        </select>
                        <div className="grid grid-cols-2 gap-2 xl:col-span-2">
                          <input
                            type="date"
                            value={usuarioFiltros.criadoDe ?? ''}
                            onChange={(e) => alterarFiltroUsuario('criadoDe', e.target.value)}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 outline-none focus:border-blue-500"
                          />
                          <input
                            type="date"
                            value={usuarioFiltros.criadoAte ?? ''}
                            onChange={(e) => alterarFiltroUsuario('criadoAte', e.target.value)}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setUsuarioFiltros(FILTROS_USUARIO_INICIAIS)}
                        className="mb-4 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-500 hover:border-blue-200 hover:text-blue-600"
                      >
                        Limpar filtros de usuarios
                      </button>
                      {loadingUsuarios && (
                        <div className="mb-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">
                          Atualizando usuarios...
                        </div>
                      )}
                      <div className="overflow-x-auto rounded-lg border border-slate-200">
                        {!loadingUsuarios && usuarios.length === 0 && (
                          <EmptyState text="Nenhum usuario encontrado com os filtros atuais." />
                        )}
                        {usuarios.length > 0 && (
                          <table className="min-w-[760px] w-full border-collapse bg-white text-sm">
                            <thead className="bg-slate-50 text-left text-[11px] font-black uppercase tracking-widest text-slate-400">
                              <tr>
                                <th className="px-3 py-3">Usuario</th>
                                <th className="px-3 py-3">Perfil</th>
                                <th className="px-3 py-3">Status</th>
                                <th className="px-3 py-3">Reputacao</th>
                                <th className="px-3 py-3">Cadastro</th>
                                <th className="px-3 py-3 text-right">Acoes</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {usuarios.map((usuario) => {
                                const isSelf = usuario.id === user?.id;
                                return (
                                  <tr key={usuario.id} className="hover:bg-slate-50">
                                    <td className="px-3 py-3">
                                      <p className="font-black text-slate-950">
                                        {usuario.name}
                                        {isSelf && <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-black uppercase text-blue-700">Voce</span>}
                                      </p>
                                      <p className="mt-0.5 text-xs font-semibold text-slate-500">{usuario.email}</p>
                                    </td>
                                    <td className="px-3 py-3">
                                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-black uppercase text-slate-600">{usuario.perfil}</span>
                                    </td>
                                    <td className="px-3 py-3">
                                      <div className="flex flex-wrap gap-1">
                                        <span className={`rounded-full px-2 py-1 text-[11px] font-black uppercase ${usuario.ativo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                          {usuario.ativo ? 'Ativo' : 'Inativo'}
                                        </span>
                                        {usuario.banido && <span className="rounded-full bg-rose-50 px-2 py-1 text-[11px] font-black uppercase text-rose-700">Banido</span>}
                                      </div>
                                    </td>
                                    <td className="px-3 py-3 font-bold text-slate-700">{Number(usuario.notaReputacao ?? 0).toFixed(1)}</td>
                                    <td className="px-3 py-3 text-xs font-semibold text-slate-500">
                                      {usuario.criadoEm ? new Date(usuario.criadoEm).toLocaleDateString('pt-BR') : '-'}
                                    </td>
                                    <td className="px-3 py-3">
                                      <div className="flex justify-end gap-2">
                                        <button onClick={() => executarUsuario(usuario.id, () => alterarUsuarioAdmin(usuario.id, 'ativar'))} className="rounded-md bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">Ativar</button>
                                        <button
                                          disabled={isSelf}
                                          onClick={() => executarUsuario(usuario.id, () => alterarUsuarioAdmin(usuario.id, 'desativar'))}
                                          className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                          Desativar
                                        </button>
                                        <button
                                          disabled={isSelf}
                                          onClick={() => executarUsuario(usuario.id, () => alterarUsuarioAdmin(usuario.id, 'banir'))}
                                          className="rounded-md bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                          Banir
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  </div>

                </section>
              )}
            </>
          )}
    </ModeracaoLayout>
  );
};

const carregarFiltrosOperacionaisSalvos = (): FiltrosOperacionais => {
  if (typeof window === 'undefined') return FILTROS_OPERACIONAIS_INICIAIS;

  try {
    const filtros = window.localStorage.getItem(CHAVE_FILTROS_OPERACIONAIS);
    return filtros ? { ...FILTROS_OPERACIONAIS_INICIAIS, ...JSON.parse(filtros) } : FILTROS_OPERACIONAIS_INICIAIS;
  } catch {
    return FILTROS_OPERACIONAIS_INICIAIS;
  }
};

const carregarFiltrosDashboardSalvos = (): DashboardAdminFiltros => {
  const padrao = criarFiltrosDashboardPadrao();
  if (typeof window === 'undefined') return padrao;

  try {
    const filtros = window.localStorage.getItem(CHAVE_FILTROS_DASHBOARD);
    return filtros ? { ...padrao, ...JSON.parse(filtros) } : padrao;
  } catch {
    return padrao;
  }
};

const MetricCard = ({
  label,
  value,
  icon: Icon,
  tone = 'blue',
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  tone?: 'blue' | 'orange';
}) => (
  <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-bold text-slate-500">{label}</p>
        <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
      </div>
      <div className={`flex h-9 w-9 items-center justify-center rounded-md ${tone === 'orange' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
        <Icon size={18} />
      </div>
    </div>
  </div>
);

const HistoricoList = ({ itens }: { itens: HistoricoModeracao[] }) => {
  if (itens.length === 0) return <EmptyState text="Nenhuma acao registrada." />;

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      {itens.map((item) => (
        <div key={item.id} className="flex flex-col gap-1 border-b border-slate-100 px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-black text-slate-900">{item.acao.replaceAll('_', ' ')}</p>
            <p className="text-xs font-semibold text-slate-500">
              {item.nomeModerador} | {item.alvoTipo} {item.alvoId ? `#${item.alvoId.slice(0, 8)}` : ''}
            </p>
            {item.detalhes && <p className="mt-1 text-xs text-slate-500">{item.detalhes}</p>}
          </div>
          <span className="text-xs font-bold text-slate-400">
            {item.criadoEm ? new Date(item.criadoEm).toLocaleString('pt-BR') : ''}
          </span>
        </div>
      ))}
    </div>
  );
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        boxWidth: 10,
        color: '#475569',
        font: { family: 'Plus Jakarta Sans', weight: 700 },
      },
    },
  },
  scales: {
    x: { ticks: { color: '#64748b' }, grid: { display: false } },
    y: { ticks: { color: '#64748b', precision: 0 }, grid: { color: '#e2e8f0' } },
  },
};

const ChartCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
    <h3 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-500">{title}</h3>
    <div className="h-56 sm:h-64">{children}</div>
  </div>
);

const RankingCard = ({ title, items }: { title: string; items: Array<{ id: string; label: string; valor: number }> }) => (
  <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
    <h3 className="mb-3 text-xs font-black uppercase text-slate-500">{title}</h3>
    {items.length === 0 ? (
      <p className="py-5 text-center text-xs font-semibold text-slate-400">Sem dados para os filtros selecionados.</p>
    ) : (
      <ol className="space-y-2">
        {items.map((item, index) => (
          <li key={item.id} className="flex items-center gap-3 rounded-md bg-slate-50 px-3 py-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-black text-blue-700">{index + 1}</span>
            <span className="min-w-0 flex-1 truncate text-xs font-bold text-slate-700">{item.label}</span>
            <span className="text-xs font-black text-slate-900">{item.valor}</span>
          </li>
        ))}
      </ol>
    )}
  </div>
);
