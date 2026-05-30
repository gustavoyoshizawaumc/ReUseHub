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
  BarChart3,
  CheckCircle2,
  Clock3,
  FileText,
  ShieldCheck,
  ShieldOff,
  Star,
  Trash2,
  UserCog,
  Users,
  XCircle,
} from 'lucide-react';
import { OperationalHeader } from '../../components/OperationalHeader';
import { Footer } from '../../components/Footer';
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
  type DenunciaModeracao,
  type HistoricoModeracao,
  type UsuarioAdminFiltros,
} from '../../services/moderacaoService';
import type { Anuncio } from '../../types/anuncio.types';

import { API_BASE_URL } from '../../config/api';

const BASE_URL = API_BASE_URL;

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Filler, Tooltip, Legend);

type Aba = 'pendentes' | 'denuncias' | 'suspeitos' | 'avaliacoes' | 'historico' | 'admin';

const FILTROS_USUARIO_INICIAIS: UsuarioAdminFiltros = {
  termo: '',
  perfil: '',
  ativo: '',
  banido: '',
  criadoDe: '',
  criadoAte: '',
};

const CHAVE_FILTROS_USUARIO = 'reusehub:moderacao:filtros-usuarios';

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

const Thumb = ({ urls, title }: { urls?: string[]; title: string }) => {
  const src = imageUrl(urls?.[0]);
  return (
    <div className="h-24 w-28 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
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
  const user = authService.getUser();
  const isAdmin = user?.perfil === 'ADMIN';
  const [aba, setAba] = useState<Aba>('pendentes');
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
  const [erro, setErro] = useState<string | null>(null);
  const [processando, setProcessando] = useState<string | null>(null);
  const filtrosUsuariosInicializadosRef = useRef(false);
  const [usuarioFiltros, setUsuarioFiltros] = useState<UsuarioAdminFiltros>(carregarFiltrosUsuariosSalvos);
  const filtrosUsuariosIniciaisRef = useRef(usuarioFiltros);
  const [moderadorForm, setModeradorForm] = useState({
    name: '',
    email: '',
    password: '',
  });

  const tabs = useMemo(
    () => [
      { id: 'pendentes' as Aba, label: 'Anuncios', description: 'Fila de aprovacao', icon: Clock3, count: pendentes.length },
      { id: 'denuncias' as Aba, label: 'Denuncias', description: 'Relatos abertos', icon: AlertTriangle, count: denuncias.length },
      { id: 'suspeitos' as Aba, label: 'Suspeitos', description: 'Conteudos em risco', icon: ShieldOff, count: suspeitos.length },
      { id: 'avaliacoes' as Aba, label: 'Avaliacoes', description: 'Comentarios recebidos', icon: Star, count: avaliacoes.length },
      { id: 'historico' as Aba, label: 'Historico', description: 'Minhas acoes', icon: FileText, count: historico.length },
      ...(isAdmin ? [{ id: 'admin' as Aba, label: 'Admin', description: 'Usuarios e metricas', icon: BarChart3, count: usuarios.length }] : []),
    ],
    [avaliacoes.length, denuncias.length, historico.length, isAdmin, pendentes.length, suspeitos.length, usuarios.length]
  );

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
        const [dash, usuariosData, auditoriaData] = await Promise.all([
          obterDashboardAdmin(),
          listarUsuariosAdmin(0, 20, filtrosUsuariosIniciaisRef.current),
          listarAuditoria(0, 20),
        ]);
        setDashboard(dash);
        setUsuarios(usuariosData.content ?? []);
        setAuditoria(auditoriaData.content ?? []);
      }
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Nao foi possivel carregar o painel.');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
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
  }, [carregarUsuarios, isAdmin]);

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
    <div className="flex min-h-screen flex-col bg-slate-50 font-plus-jakarta-sans text-left">
      <OperationalHeader />
      <main className="flex-grow py-8 md:py-10">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-7 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-blue-700">
                <ShieldCheck size={15} />
                Painel operacional
              </div>
              <h1 className="text-3xl font-black tracking-tight text-slate-950">Moderacao e Admin</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Controle anuncios, denuncias, suspensoes, historico de acoes e usuarios administrativos.
              </p>
            </div>
          </div>

          <div className="mb-6 flex gap-2 overflow-x-auto rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = aba === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setAba(tab.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-md px-4 py-2 text-sm font-bold transition-colors ${
                    active ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {erro && (
            <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {erro}
            </div>
          )}

          {loading ? (
            <div className="rounded-lg border border-slate-200 bg-white p-12 text-center font-bold text-slate-500 shadow-sm">
              Carregando painel...
            </div>
          ) : (
            <>
              {aba === 'pendentes' && (
                <section>
                  <SectionHeader title="Fila de anuncios" description="Aprove ou reprove anuncios antes de publicar." />
                  {pendentes.length === 0 ? (
                    <EmptyState text="Nenhum anuncio pendente agora." />
                  ) : (
                    <div className="space-y-3">
                      {pendentes.map((anuncio) => (
                        <article key={anuncio.id} className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:flex-row">
                          <Thumb urls={anuncio.imagensUrls} title={anuncio.titulo} />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full border border-amber-100 bg-amber-50 px-2 py-0.5 text-[10px] font-black uppercase text-amber-700">
                                Pendente
                              </span>
                              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-black uppercase text-slate-600">
                                {anuncio.tipo}
                              </span>
                            </div>
                            <h3 className="mt-2 text-lg font-black text-slate-950">{anuncio.titulo}</h3>
                            <p className="mt-1 line-clamp-2 text-sm text-slate-500">{anuncio.descricao}</p>
                            <p className="mt-2 text-xs font-bold text-slate-400">{anuncio.nomeUsuario} | {anuncio.nomeCategoria}</p>
                          </div>
                          <div className="flex items-center gap-2 md:flex-col md:justify-center">
                            <button
                              onClick={() => executar(anuncio.id, () => reprovarAnuncio(anuncio.id))}
                              disabled={processando === anuncio.id}
                              className="inline-flex items-center gap-2 rounded-lg bg-rose-50 px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-100 disabled:opacity-50"
                            >
                              <XCircle size={16} />
                              Reprovar
                            </button>
                            <button
                              onClick={() => executar(anuncio.id, () => aprovarAnuncio(anuncio.id))}
                              disabled={processando === anuncio.id}
                              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                              <CheckCircle2 size={16} />
                              Aprovar
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {aba === 'denuncias' && (
                <section>
                  <SectionHeader title="Denuncias abertas" description="Analise denuncias e registre o resultado da moderacao." />
                  {denuncias.length === 0 ? (
                    <EmptyState text="Nenhuma denuncia aberta." />
                  ) : (
                    <div className="grid gap-3">
                      {denuncias.map((denuncia) => (
                        <article key={denuncia.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                          <div className="flex flex-col gap-4 md:flex-row">
                            <Thumb urls={denuncia.imagensUrls} title={denuncia.tituloAnuncio} />
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-black uppercase text-orange-700">
                                  {denuncia.denunciasAbertasDoAnuncio} abertas neste anuncio
                                </span>
                                <span className="text-xs font-bold text-slate-400">por {denuncia.nomeDenunciante}</span>
                              </div>
                              <h3 className="mt-2 text-lg font-black text-slate-950">{denuncia.tituloAnuncio}</h3>
                              <p className="mt-1 text-sm font-bold text-slate-700">{denuncia.motivo}</p>
                              {denuncia.descricao && <p className="mt-1 text-sm text-slate-500">{denuncia.descricao}</p>}
                            </div>
                            <div className="flex items-center gap-2 md:flex-col md:justify-center">
                              <button
                                onClick={() => executar(denuncia.id, () => descartarDenuncia(denuncia.id, 'Denuncia improcedente.'))}
                                disabled={processando === denuncia.id}
                                className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                              >
                                Descartar
                              </button>
                              <button
                                onClick={() => executar(denuncia.id, () => analisarDenuncia(denuncia.id, 'Denuncia analisada.'))}
                                disabled={processando === denuncia.id}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                              >
                                Marcar analisada
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {aba === 'suspeitos' && (
                <section>
                  <SectionHeader title="Anuncios suspeitos" description="Anuncios com duas ou mais denuncias abertas." />
                  {suspeitos.length === 0 ? (
                    <EmptyState text="Nenhum anuncio suspeito pelos filtros atuais." />
                  ) : (
                    <div className="space-y-3">
                      {suspeitos.map((anuncio) => (
                        <article key={anuncio.anuncioId} className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center">
                          <Thumb urls={anuncio.imagensUrls} title={anuncio.titulo} />
                          <div className="flex-1">
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase ${statusClass[anuncio.status] ?? statusClass.PENDENTE}`}>
                              {anuncio.status}
                            </span>
                            <h3 className="mt-2 text-lg font-black text-slate-950">{anuncio.titulo}</h3>
                            <p className="text-sm text-slate-500">{anuncio.nomeUsuario} | {anuncio.denunciasAbertas} denuncias abertas</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button onClick={() => executar(anuncio.anuncioId, () => suspenderAnuncio(anuncio.anuncioId, 'Suspenso para analise.'))} className="rounded-lg bg-orange-50 px-3 py-2 text-sm font-bold text-orange-700 hover:bg-orange-100">
                              Suspender
                            </button>
                            <button onClick={() => executar(anuncio.anuncioId, () => reativarAnuncio(anuncio.anuncioId, 'Reativado apos analise.'))} className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-100">
                              Reativar
                            </button>
                            <button onClick={() => executar(anuncio.anuncioId, () => reprovarSuspeito(anuncio.anuncioId, 'Reprovado apos denuncias.'))} className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700 hover:bg-rose-100">
                              Reprovar
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {aba === 'avaliacoes' && (
                <section>
                  <SectionHeader title="Avaliacoes" description="Remova avaliacoes com linguagem ofensiva, impropria ou fora das regras." />
                  {avaliacoes.length === 0 ? (
                    <EmptyState text="Nenhuma avaliacao registrada." />
                  ) : (
                    <div className="grid gap-3">
                      {avaliacoes.map((avaliacao) => (
                        <article key={avaliacao.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1 rounded-full border border-amber-100 bg-amber-50 px-2 py-0.5 text-[10px] font-black uppercase text-amber-700">
                                  {Array.from({ length: 5 }).map((_, index) => (
                                    <Star key={index} size={12} className={index < avaliacao.nota ? 'fill-amber-400 text-amber-400' : 'text-amber-200'} />
                                  ))}
                                </span>
                                <span className="text-xs font-bold text-slate-400">
                                  {avaliacao.criadoEm ? new Date(avaliacao.criadoEm).toLocaleString('pt-BR') : ''}
                                </span>
                              </div>
                              <h3 className="mt-2 text-base font-black text-slate-950">{avaliacao.anuncioTitulo}</h3>
                              <p className="mt-1 text-xs font-semibold text-slate-500">
                                {avaliacao.avaliadorNome} avaliou {avaliacao.avaliadoNome}
                              </p>
                              <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-600">
                                {avaliacao.comentario || 'Sem comentario.'}
                              </p>
                            </div>
                            <button
                              onClick={() => removerAvaliacao(avaliacao)}
                              disabled={processando === avaliacao.id}
                              className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-50 px-4 py-2 text-sm font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                            >
                              <Trash2 size={16} />
                              Remover
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {aba === 'historico' && (
                <section>
                  <SectionHeader title="Meu historico" description="Acoes de moderacao feitas pela sua conta." />
                  <HistoricoList itens={historico} />
                </section>
              )}

              {aba === 'admin' && isAdmin && (
                <section className="space-y-6">
                  <SectionHeader title="Dashboard admin" description="Metricas, usuarios, moderadores e auditoria." />
                  {dashboard && (
                    <>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {metricas.map((metrica) => (
                          <div key={metrica.label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                            <p className="text-xs font-black uppercase tracking-wide text-slate-400">{metrica.label}</p>
                            <p className="mt-2 text-3xl font-black text-slate-950">{metrica.value}</p>
                          </div>
                        ))}
                      </div>
                      <div className="grid gap-4 lg:grid-cols-2">
                        <ChartCard title="Usuarios por periodo">
                          <Line
                            data={{
                              labels: dashboard.usuariosPorMes.map((item) => item.label),
                              datasets: [
                                {
                                  label: 'Usuarios',
                                  data: dashboard.usuariosPorMes.map((item) => item.valor),
                                  borderColor: '#2563eb',
                                  backgroundColor: 'rgba(37, 99, 235, 0.12)',
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
                                  borderRadius: 6,
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
                                  backgroundColor: 'rgba(249, 115, 22, 0.14)',
                                  tension: 0.35,
                                  fill: true,
                                },
                              ],
                            }}
                            options={chartOptions}
                          />
                        </ChartCard>
                      </div>
                    </>
                  )}

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

                  <div>
                    <h3 className="mb-3 text-lg font-black text-slate-950">Logs de auditoria</h3>
                    <HistoricoList itens={auditoria} />
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

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
    <div className="h-64">{children}</div>
  </div>
);
