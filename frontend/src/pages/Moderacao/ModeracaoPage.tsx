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
  Eye,
  FileText,
  Search,
  ShieldOff,
  Star,
  Trash2,
  UserCog,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { ModeracaoLayout } from '../../components/moderacao/ModeracaoLayout';
import { authService } from '../../services/authService';
import {
  alterarUsuarioAdmin,
  aprovarAnuncio,
  criarAdministrador,
  criarModerador,
  descartarDenuncia,
  listarAnunciosPendentes,
  listarAnunciosModeracao,
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
  suspenderAnuncioPorDenuncia,
  type AdminDashboard,
  type AdminUsuario,
  type AnuncioModeracaoFiltros,
  type AnuncioSuspeito,
  type AvaliacaoModeracaoFiltros,
  type AvaliacaoModeracao,
  type DashboardAdminFiltros,
  type DenunciaModeracaoFiltros,
  type DenunciaModeracao,
  type HistoricoModeracaoFiltros,
  type HistoricoModeracao,
  type SuspeitoModeracaoFiltros,
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
const CHAVE_FILTROS_OPERACIONAIS = 'reusehub:moderacao:filtros-operacionais-v2';
const CHAVE_FILTROS_DASHBOARD = 'reusehub:moderacao:filtros-dashboard';

type FiltrosOperacionais = {
  anuncios: AnuncioModeracaoFiltros;
  denuncias: DenunciaModeracaoFiltros;
  suspeitos: SuspeitoModeracaoFiltros;
  avaliacoes: AvaliacaoModeracaoFiltros;
  historico: HistoricoModeracaoFiltros;
};

const FILTROS_OPERACIONAIS_INICIAIS: FiltrosOperacionais = {
  anuncios: { termo: '', status: '' },
  denuncias: { termo: '', status: '' },
  suspeitos: { termo: '', status: '', minimoDenuncias: 2 },
  avaliacoes: { termo: '', nota: '', criadoDe: '', criadoAte: '' },
  historico: { termo: '', acao: '', criadoDe: '', criadoAte: '' },
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
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  resultCount: number;
  children?: React.ReactNode;
}) => (
  <div className="mb-4 rounded-md border border-slate-200 bg-white p-3 shadow-sm">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
    {children && <div className="mt-3 flex flex-wrap gap-2">{children}</div>}
  </div>
);

const filterControlClass = 'h-10 min-w-0 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 outline-none focus:border-blue-500';
const PAGE_SIZE_LISTAGENS = 10;
type ListaPaginada = 'anuncios' | 'denuncias' | 'suspeitos' | 'avaliacoes' | 'historico' | 'usuarios';

const totalPaginas = (total: number) => Math.max(1, Math.ceil(total / PAGE_SIZE_LISTAGENS));

const paginarItens = <T,>(itens: T[], pagina: number) => {
  const inicio = pagina * PAGE_SIZE_LISTAGENS;
  return itens.slice(inicio, inicio + PAGE_SIZE_LISTAGENS);
};

const Pagination = ({
  page,
  total,
  onChange,
}: {
  page: number;
  total: number;
  onChange: (page: number) => void;
}) => {
  const pages = totalPaginas(total);
  if (pages <= 1) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
      <button
        type="button"
        disabled={page === 0}
        onClick={() => onChange(Math.max(0, page - 1))}
        className="h-9 rounded-md border border-slate-200 px-3 text-xs font-bold text-slate-500 transition-colors hover:border-blue-200 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Anterior
      </button>
      {Array.from({ length: pages }).map((_, index) => (
        <button
          key={index}
          type="button"
          onClick={() => onChange(index)}
          className={`h-9 min-w-9 rounded-md border px-3 text-xs font-black transition-colors ${
            page === index
              ? 'border-blue-600 bg-blue-600 text-white'
              : 'border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:text-blue-600'
          }`}
        >
          {index + 1}
        </button>
      ))}
      <button
        type="button"
        disabled={page >= pages - 1}
        onClick={() => onChange(Math.min(pages - 1, page + 1))}
        className="h-9 rounded-md border border-slate-200 px-3 text-xs font-bold text-slate-500 transition-colors hover:border-blue-200 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Proxima
      </button>
    </div>
  );
};

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

const obterFotosAnuncio = (anuncio?: Anuncio | null) => {
  const urls = anuncio?.imagens?.length
    ? [...anuncio.imagens]
        .sort((a, b) => (a.ordemExibicao ?? 0) - (b.ordemExibicao ?? 0))
        .map((imagem) => imagem.urlImagem)
    : anuncio?.imagensUrls ?? [];

  return urls.map(imageUrl).filter((url): url is string => Boolean(url));
};

const AnuncioDetalheModal = ({
  anuncio,
  fotoAtual,
  onFotoAtualChange,
  onClose,
  onApprove,
  onReject,
  processando,
}: {
  anuncio: Anuncio;
  fotoAtual: number;
  onFotoAtualChange: (index: number) => void;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  processando: boolean;
}) => {
  const fotos = obterFotosAnuncio(anuncio);
  const fotoSelecionada = fotos[fotoAtual] ?? fotos[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <article className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-widest text-blue-600">Analise do anuncio</p>
            <h3 className="mt-1 truncate text-xl font-black text-slate-950">{anuncio.titulo}</h3>
            <p className="mt-1 text-xs font-semibold text-slate-500">ID {anuncio.id}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
            aria-label="Fechar detalhes do anuncio"
          >
            <X size={18} />
          </button>
        </header>

        <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[1.15fr_0.85fr]">
          <section className="border-b border-slate-200 bg-slate-50 p-4 lg:border-b-0 lg:border-r">
            <div className="aspect-[4/3] overflow-hidden rounded-lg border border-slate-200 bg-white">
              {fotoSelecionada ? (
                <img src={fotoSelecionada} alt={anuncio.titulo} className="h-full w-full object-contain" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-300">
                  <FileText size={44} />
                  <p className="text-sm font-bold">Sem imagem disponivel</p>
                </div>
              )}
            </div>
            {fotos.length > 0 && (
              <div className="mt-3 grid grid-cols-5 gap-2">
                {fotos.map((foto, index) => (
                  <button
                    key={`${foto}-${index}`}
                    type="button"
                    onClick={() => onFotoAtualChange(index)}
                    className={`aspect-square overflow-hidden rounded-md border bg-white transition-colors ${
                      index === fotoAtual ? 'border-blue-600 ring-2 ring-blue-100' : 'border-slate-200 hover:border-blue-200'
                    }`}
                    aria-label={`Ver foto ${index + 1}`}
                  >
                    <img src={foto} alt={`Foto ${index + 1} de ${anuncio.titulo}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-5 p-5">
            <div className="flex flex-wrap gap-2">
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${statusClass[anuncio.status] ?? statusClass.PENDENTE}`}>
                {anuncio.status}
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-black uppercase text-slate-600">
                {anuncio.tipo}
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-black uppercase text-slate-600">
                {anuncio.condicao}
              </span>
            </div>

            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Descricao</h4>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">{anuncio.descricao}</p>
            </div>

            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-md bg-slate-50 p-3">
                <dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">Anunciante</dt>
                <dd className="mt-1 font-bold text-slate-800">{anuncio.nomeUsuario}</dd>
              </div>
              <div className="rounded-md bg-slate-50 p-3">
                <dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">Categoria</dt>
                <dd className="mt-1 font-bold text-slate-800">{anuncio.nomeCategoria}</dd>
              </div>
              <div className="rounded-md bg-slate-50 p-3">
                <dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">Localizacao</dt>
                <dd className="mt-1 font-bold text-slate-800">
                  {[anuncio.cidade, anuncio.uf].filter(Boolean).join(' - ') || '-'}
                </dd>
              </div>
              <div className="rounded-md bg-slate-50 p-3">
                <dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">Criado em</dt>
                <dd className="mt-1 font-bold text-slate-800">
                  {anuncio.criadoEm ? new Date(anuncio.criadoEm).toLocaleString('pt-BR') : '-'}
                </dd>
              </div>
              <div className="rounded-md bg-slate-50 p-3">
                <dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">CEP</dt>
                <dd className="mt-1 font-bold text-slate-800">{anuncio.cep || '-'}</dd>
              </div>
              <div className="rounded-md bg-slate-50 p-3">
                <dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">Visualizacoes</dt>
                <dd className="mt-1 font-bold text-slate-800">{anuncio.totalVisualizacoes ?? 0}</dd>
              </div>
            </dl>
          </section>
        </div>

        <footer className="flex flex-col gap-2 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-semibold text-slate-400">
            Revise as imagens e a descricao antes de liberar o anuncio.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            {anuncio.status === 'PENDENTE' ? (
              <>
                <button
                  type="button"
                  onClick={onReject}
                  disabled={processando}
                  className="inline-flex items-center justify-center gap-1.5 rounded-md border border-rose-100 bg-rose-50 px-4 py-2 text-sm font-bold text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-50"
                >
                  <XCircle size={16} /> Reprovar
                </button>
                <button
                  type="button"
                  onClick={onApprove}
                  disabled={processando}
                  className="inline-flex items-center justify-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                  <CheckCircle2 size={16} /> Aprovar
                </button>
              </>
            ) : (
              <span className="rounded-md bg-slate-50 px-4 py-2 text-sm font-bold text-slate-500">Sem acao pendente</span>
            )}
          </div>
        </footer>
      </article>
    </div>
  );
};

const DenunciaAnaliseModal = ({
  denuncia,
  onClose,
  onDismiss,
  onSuspend,
  processando,
}: {
  denuncia: DenunciaModeracao;
  onClose: () => void;
  onDismiss: () => void;
  onSuspend: (mensagem: string) => void;
  processando: boolean;
}) => {
  const [mensagemSuspensao, setMensagemSuspensao] = useState('');
  const [erroMensagem, setErroMensagem] = useState<string | null>(null);
  const foto = imageUrl(denuncia.imagensUrls?.[0]);

  const suspender = () => {
    const mensagem = mensagemSuspensao.trim();
    if (!mensagem) {
      setErroMensagem('Informe a mensagem que sera exibida ao anunciante.');
      return;
    }
    onSuspend(mensagem);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <article className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-widest text-blue-600">Analise da denuncia</p>
            <h3 className="mt-1 truncate text-xl font-black text-slate-950">{denuncia.tituloAnuncio}</h3>
            <p className="mt-1 text-xs font-semibold text-slate-500">Denuncia {denuncia.id}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
            aria-label="Fechar analise da denuncia"
          >
            <X size={18} />
          </button>
        </header>

        <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[0.95fr_1.05fr]">
          <section className="border-b border-slate-200 bg-slate-50 p-5 lg:border-b-0 lg:border-r">
            <div className="aspect-[4/3] overflow-hidden rounded-lg border border-slate-200 bg-white">
              {foto ? (
                <img src={foto} alt={denuncia.tituloAnuncio} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-300">
                  <FileText size={42} />
                  <p className="text-sm font-bold">Sem imagem disponivel</p>
                </div>
              )}
            </div>

            <dl className="mt-4 grid grid-cols-1 gap-3 text-sm">
              <div className="rounded-md bg-white p-3">
                <dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">Anunciante</dt>
                <dd className="mt-1 font-bold text-slate-800">{denuncia.nomeAnunciante || '-'}</dd>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md bg-white p-3">
                  <dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</dt>
                  <dd className="mt-1 font-bold text-slate-800">{denuncia.statusAnuncio || '-'}</dd>
                </div>
                <div className="rounded-md bg-white p-3">
                  <dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tipo</dt>
                  <dd className="mt-1 font-bold text-slate-800">{denuncia.tipoAnuncio || '-'}</dd>
                </div>
              </div>
              <div className="rounded-md bg-white p-3">
                <dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">Categoria</dt>
                <dd className="mt-1 font-bold text-slate-800">{denuncia.categoriaAnuncio || '-'}</dd>
              </div>
              <div className="rounded-md border border-orange-100 bg-orange-50 p-3">
                <dt className="text-[10px] font-black uppercase tracking-widest text-orange-500">Recorrencia</dt>
                <dd className="mt-1 font-black text-orange-700">{denuncia.denunciasAbertasDoAnuncio} denuncia(s) aberta(s)</dd>
              </div>
            </dl>
          </section>

          <section className="space-y-5 p-5">
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Relato recebido</h4>
              <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-black text-slate-900">{denuncia.motivo}</p>
                <p className="mt-1 text-xs font-bold text-slate-500">Enviado por {denuncia.nomeDenunciante}</p>
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">
                  {denuncia.descricao || 'O denunciante nao adicionou detalhes.'}
                </p>
              </div>
            </div>

            <label className="block">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">Mensagem ao anunciante em caso de suspensao</span>
              <textarea
                value={mensagemSuspensao}
                onChange={(event) => {
                  setMensagemSuspensao(event.target.value);
                  setErroMensagem(null);
                }}
                rows={5}
                placeholder="Explique objetivamente por que o anuncio foi suspenso e o que precisa ser corrigido."
                className="mt-2 w-full resize-none rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-blue-500"
              />
              {erroMensagem && <span className="mt-1 block text-xs font-bold text-rose-600">{erroMensagem}</span>}
            </label>
          </section>
        </div>

        <footer className="flex flex-col gap-2 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-semibold text-slate-400">
            Descarte apenas quando a denuncia for improcedente. Suspensoes notificam o anunciante.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onDismiss}
              disabled={processando}
              className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              Descartar denuncia
            </button>
            <button
              type="button"
              onClick={suspender}
              disabled={processando}
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-orange-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-orange-700 disabled:opacity-50"
            >
              <ShieldOff size={16} /> Suspender anuncio
            </button>
          </div>
        </footer>
      </article>
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
  const [totalPendentes, setTotalPendentes] = useState(0);
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [denuncias, setDenuncias] = useState<DenunciaModeracao[]>([]);
  const [totalDenunciasAbertas, setTotalDenunciasAbertas] = useState(0);
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
  const [anuncioDetalhado, setAnuncioDetalhado] = useState<Anuncio | null>(null);
  const [denunciaEmAnalise, setDenunciaEmAnalise] = useState<DenunciaModeracao | null>(null);
  const [fotoDetalheAtual, setFotoDetalheAtual] = useState(0);
  const filtrosUsuariosInicializadosRef = useRef(false);
  const filtrosDashboardInicializadosRef = useRef(false);
  const filtrosOperacionaisInicializadosRef = useRef(false);
  const [usuarioFiltros, setUsuarioFiltros] = useState<UsuarioAdminFiltros>(carregarFiltrosUsuariosSalvos);
  const [filtrosOperacionais, setFiltrosOperacionais] = useState<FiltrosOperacionais>(carregarFiltrosOperacionaisSalvos);
  const [dashboardFiltros, setDashboardFiltros] = useState<DashboardAdminFiltros>(carregarFiltrosDashboardSalvos);
  const filtrosUsuariosIniciaisRef = useRef(usuarioFiltros);
  const filtrosDashboardAtuaisRef = useRef(dashboardFiltros);
  const filtrosOperacionaisAtuaisRef = useRef(filtrosOperacionais);
  filtrosDashboardAtuaisRef.current = dashboardFiltros;
  filtrosOperacionaisAtuaisRef.current = filtrosOperacionais;
  const [paginasListas, setPaginasListas] = useState<Record<ListaPaginada, number>>({
    anuncios: 0,
    denuncias: 0,
    suspeitos: 0,
    avaliacoes: 0,
    historico: 0,
    usuarios: 0,
  });
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
      const usuariosData = await listarUsuariosAdmin(0, 100, filtros);
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

  const carregarOperacionais = useCallback(async (filtros = filtrosOperacionais) => {
    try {
      const [anunciosData, denunciasData, suspeitosData, avaliacoesData, historicoData] = await Promise.all([
        listarAnunciosModeracao(filtros.anuncios),
        listarDenuncias(filtros.denuncias),
        listarSuspeitos(filtros.suspeitos),
        listarAvaliacoesModeracao(filtros.avaliacoes),
        listarMeuHistorico(filtros.historico),
      ]);
      setAnuncios(anunciosData.content ?? []);
      setDenuncias(denunciasData.content ?? []);
      setSuspeitos(suspeitosData ?? []);
      setAvaliacoes(avaliacoesData.content ?? []);
      setHistorico(historicoData.content ?? []);

      if (isAdmin) {
        const auditoriaData = await listarAuditoria(filtros.historico);
        setAuditoria(auditoriaData.content ?? []);
      }
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Nao foi possivel atualizar as listagens.');
    }
  }, [filtrosOperacionais, isAdmin]);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const filtrosAtuais = filtrosOperacionaisAtuaisRef.current;
      const [pendentesData, anunciosData, denunciasAbertasData, denunciasData, suspeitosData, avaliacoesData, historicoData] = await Promise.all([
        listarAnunciosPendentes(0, 1),
        listarAnunciosModeracao(filtrosAtuais.anuncios),
        listarDenuncias({ status: 'ABERTA' }, 0, 1),
        listarDenuncias(filtrosAtuais.denuncias),
        listarSuspeitos(filtrosAtuais.suspeitos),
        listarAvaliacoesModeracao(filtrosAtuais.avaliacoes),
        listarMeuHistorico(filtrosAtuais.historico),
      ]);
      setTotalPendentes(pendentesData.totalElements ?? 0);
      setAnuncios(anunciosData.content ?? []);
      setTotalDenunciasAbertas(denunciasAbertasData.totalElements ?? 0);
      setDenuncias(denunciasData.content ?? []);
      setSuspeitos(suspeitosData ?? []);
      setAvaliacoes(avaliacoesData.content ?? []);
      setHistorico(historicoData.content ?? []);

      if (isAdmin) {
        const [dashResult, usuariosResult, auditoriaResult] = await Promise.allSettled([
          obterDashboardAdmin(filtrosDashboardAtuaisRef.current),
          listarUsuariosAdmin(0, 100, filtrosUsuariosIniciaisRef.current),
          listarAuditoria(filtrosAtuais.historico),
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

    if (!filtrosOperacionaisInicializadosRef.current) {
      filtrosOperacionaisInicializadosRef.current = true;
      return;
    }

    const timeout = window.setTimeout(() => {
      carregarOperacionais();
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [carregarOperacionais, filtrosOperacionais]);

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

  const abrirDetalhesAnuncio = (anuncio: Anuncio) => {
    setAnuncioDetalhado(anuncio);
    setFotoDetalheAtual(0);
  };

  const fecharDetalhesAnuncio = () => {
    setAnuncioDetalhado(null);
    setFotoDetalheAtual(0);
  };

  const executarAcaoDoDetalhe = (acao: () => Promise<unknown>) => {
    if (!anuncioDetalhado) return;
    const anuncioId = anuncioDetalhado.id;
    fecharDetalhesAnuncio();
    void executar(anuncioId, acao);
  };

  const descartarDenunciaEmAnalise = () => {
    if (!denunciaEmAnalise) return;
    const denunciaId = denunciaEmAnalise.id;
    setDenunciaEmAnalise(null);
    void executar(denunciaId, () => descartarDenuncia(denunciaId, 'Denuncia improcedente.'));
  };

  const suspenderDenunciaEmAnalise = (mensagem: string) => {
    if (!denunciaEmAnalise) return;
    const denunciaId = denunciaEmAnalise.id;
    setDenunciaEmAnalise(null);
    void executar(denunciaId, () => suspenderAnuncioPorDenuncia(denunciaId, mensagem));
  };

  const alterarFiltroUsuario = <K extends keyof UsuarioAdminFiltros>(campo: K, valor: UsuarioAdminFiltros[K]) => {
    setPaginasListas((prev) => ({ ...prev, usuarios: 0 }));
    setUsuarioFiltros((prev) => ({ ...prev, [campo]: valor }));
  };

  const alterarFiltroOperacional = <
    K extends keyof FiltrosOperacionais,
    F extends keyof FiltrosOperacionais[K]
  >(grupo: K, campo: F, valor: FiltrosOperacionais[K][F]) => {
    if (grupo in paginasListas) {
      setPaginasListas((prev) => ({ ...prev, [grupo]: 0 }));
    }
    setFiltrosOperacionais((prev) => ({
      ...prev,
      [grupo]: { ...prev[grupo], [campo]: valor },
    }));
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

  const anunciosFiltrados = anuncios.filter((anuncio) =>
    contemTermo(filtrosOperacionais.anuncios.termo ?? '', anuncio.id, anuncio.titulo, anuncio.descricao, anuncio.nomeUsuario, anuncio.nomeCategoria)
  );
  const denunciasFiltradas = denuncias.filter((denuncia) =>
    contemTermo(filtrosOperacionais.denuncias.termo ?? '', denuncia.id, denuncia.tituloAnuncio, denuncia.nomeDenunciante, denuncia.motivo, denuncia.descricao)
  );
  const suspeitosFiltrados = suspeitos.filter((anuncio) =>
    contemTermo(filtrosOperacionais.suspeitos.termo ?? '', anuncio.anuncioId, anuncio.titulo, anuncio.nomeUsuario, anuncio.status)
  );
  const avaliacoesFiltradas = avaliacoes.filter((avaliacao) =>
    contemTermo(filtrosOperacionais.avaliacoes.termo ?? '', avaliacao.id, avaliacao.anuncioTitulo, avaliacao.avaliadorNome, avaliacao.avaliadoNome, avaliacao.comentario)
  );
  const historicoAtivo = isAdmin ? auditoria : historico;
  const anunciosPagina = paginarItens(anunciosFiltrados, paginasListas.anuncios);
  const denunciasPagina = paginarItens(denunciasFiltradas, paginasListas.denuncias);
  const suspeitosPagina = paginarItens(suspeitosFiltrados, paginasListas.suspeitos);
  const avaliacoesPagina = paginarItens(avaliacoesFiltradas, paginasListas.avaliacoes);
  const historicoPagina = paginarItens(historicoAtivo, paginasListas.historico);
  const usuariosPagina = paginarItens(usuarios, paginasListas.usuarios);
  const alterarPaginaLista = (lista: ListaPaginada, pagina: number) => {
    setPaginasListas((prev) => ({ ...prev, [lista]: pagina }));
  };
  const counts = useMemo(
    () => ({
      anuncios: totalPendentes,
      denuncias: totalDenunciasAbertas,
      suspeitos: suspeitos.length,
      avaliacoes: avaliacoes.length,
    }),
    [avaliacoes.length, totalPendentes, suspeitos.length, totalDenunciasAbertas]
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

  const acoesUsuario = (usuario: AdminUsuario) => {
    const isSelf = usuario.id === user?.id;
    return (
      <div className="flex flex-wrap justify-end gap-2">
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
    );
  };

  const statusUsuario = (usuario: AdminUsuario) => (
    <div className="flex flex-wrap gap-1">
      <span className={`rounded-full px-2 py-1 text-[11px] font-black uppercase ${usuario.ativo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
        {usuario.ativo ? 'Ativo' : 'Inativo'}
      </span>
      {usuario.banido && <span className="rounded-full bg-rose-50 px-2 py-1 text-[11px] font-black uppercase text-rose-700">Banido</span>}
    </div>
  );

  return (
    <ModeracaoLayout
      title={paginaAtual.title}
      description={paginaAtual.description}
      counts={counts}
    >
      {anuncioDetalhado && (
        <AnuncioDetalheModal
          anuncio={anuncioDetalhado}
          fotoAtual={fotoDetalheAtual}
          onFotoAtualChange={setFotoDetalheAtual}
          onClose={fecharDetalhesAnuncio}
          onApprove={() => executarAcaoDoDetalhe(() => aprovarAnuncio(anuncioDetalhado.id))}
          onReject={() => executarAcaoDoDetalhe(() => reprovarAnuncio(anuncioDetalhado.id))}
          processando={processando === anuncioDetalhado.id}
        />
      )}

      {denunciaEmAnalise && (
        <DenunciaAnaliseModal
          denuncia={denunciaEmAnalise}
          onClose={() => setDenunciaEmAnalise(null)}
          onDismiss={descartarDenunciaEmAnalise}
          onSuspend={suspenderDenunciaEmAnalise}
          processando={processando === denunciaEmAnalise.id}
        />
      )}

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
                <MetricCard label="Anuncios pendentes" value={totalPendentes} icon={Clock3} />
                <MetricCard label="Denuncias abertas" value={totalDenunciasAbertas} icon={AlertTriangle} tone="orange" />
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
                    value={filtrosOperacionais.anuncios.termo ?? ''}
                    onChange={(value) => alterarFiltroOperacional('anuncios', 'termo', value)}
                    placeholder="Buscar por titulo, anunciante ou ID"
                    resultCount={anunciosFiltrados.length}
                  >
                    <select
                      value={filtrosOperacionais.anuncios.status ?? ''}
                      onChange={(event) => alterarFiltroOperacional('anuncios', 'status', event.target.value as AnuncioModeracaoFiltros['status'])}
                      className={filterControlClass}
                    >
                      <option value="">Todos os status</option>
                      {Object.keys(statusClass).map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </ListToolbar>
                  {anunciosFiltrados.length === 0 ? (
                    <EmptyState text="Nenhum anuncio encontrado com os filtros atuais." />
                  ) : (
                    <div className="overflow-x-auto rounded-md border border-slate-200 bg-white shadow-sm">
                      <table className="w-full min-w-[820px] text-left text-sm">
                        <thead className="bg-slate-50 text-[11px] font-black uppercase text-slate-400">
                          <tr>
                            <th className="px-4 py-3">Anuncio</th>
                            <th className="px-4 py-3">Anunciante</th>
                            <th className="px-4 py-3">Tipo</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Acoes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {anunciosPagina.map((anuncio) => (
                            <tr key={anuncio.id} className="transition-colors hover:bg-slate-50">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <Thumb urls={anuncio.imagensUrls} title={anuncio.titulo} />
                                  <div className="min-w-0">
                                    <button
                                      type="button"
                                      onClick={() => abrirDetalhesAnuncio(anuncio)}
                                      className="block max-w-xl truncate text-left font-extrabold text-slate-900 transition-colors hover:text-blue-700"
                                    >
                                      {anuncio.titulo}
                                    </button>
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
                                <span className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase ${statusClass[anuncio.status] ?? statusClass.PENDENTE}`}>
                                  {anuncio.status}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                {anuncio.status === 'PENDENTE' ? (
                                  <div className="flex justify-end gap-2">
                                    <button onClick={() => abrirDetalhesAnuncio(anuncio)} className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:border-blue-200 hover:text-blue-700">
                                      <Eye size={15} /> Ver detalhes
                                    </button>
                                    <button onClick={() => executar(anuncio.id, () => reprovarAnuncio(anuncio.id))} disabled={processando === anuncio.id} className="inline-flex items-center gap-1.5 rounded-md border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-50">
                                      <XCircle size={15} /> Reprovar
                                    </button>
                                    <button onClick={() => executar(anuncio.id, () => aprovarAnuncio(anuncio.id))} disabled={processando === anuncio.id} className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-50">
                                      <CheckCircle2 size={15} /> Aprovar
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex justify-end">
                                    <button onClick={() => abrirDetalhesAnuncio(anuncio)} className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:border-blue-200 hover:text-blue-700">
                                      <Eye size={15} /> Ver detalhes
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <Pagination page={paginasListas.anuncios} total={anunciosFiltrados.length} onChange={(page) => alterarPaginaLista('anuncios', page)} />
                </section>
              )}

              {aba === 'denuncias' && (
                <section>
                  <ListToolbar
                    value={filtrosOperacionais.denuncias.termo ?? ''}
                    onChange={(value) => alterarFiltroOperacional('denuncias', 'termo', value)}
                    placeholder="Buscar por anuncio, denunciante, motivo ou ID"
                    resultCount={denunciasFiltradas.length}
                  >
                    <select
                      value={filtrosOperacionais.denuncias.status ?? ''}
                      onChange={(event) => alterarFiltroOperacional('denuncias', 'status', event.target.value as DenunciaModeracaoFiltros['status'])}
                      className={filterControlClass}
                    >
                      <option value="">Todos os status</option>
                      <option value="ABERTA">Aberta</option>
                      <option value="ANALISADA">Analisada</option>
                      <option value="DESCARTADA">Descartada</option>
                    </select>
                  </ListToolbar>
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
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Acoes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {denunciasPagina.map((denuncia) => (
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
                              <td className="px-4 py-3 text-xs font-black text-slate-600">{denuncia.status}</td>
                              <td className="px-4 py-3">
                                {denuncia.status === 'ABERTA' ? <div className="flex justify-end gap-2">
                                  <button onClick={() => setDenunciaEmAnalise(denuncia)} disabled={processando === denuncia.id} className="rounded-md bg-blue-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-50">
                                    Analisar
                                  </button>
                                </div> : <p className="text-right text-xs font-bold text-slate-400">Resolvida</p>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <Pagination page={paginasListas.denuncias} total={denunciasFiltradas.length} onChange={(page) => alterarPaginaLista('denuncias', page)} />
                </section>
              )}

              {aba === 'suspeitos' && (
                <section>
                  <ListToolbar
                    value={filtrosOperacionais.suspeitos.termo ?? ''}
                    onChange={(value) => alterarFiltroOperacional('suspeitos', 'termo', value)}
                    placeholder="Buscar por titulo, anunciante ou ID"
                    resultCount={suspeitosFiltrados.length}
                  >
                    <select
                      value={filtrosOperacionais.suspeitos.status ?? ''}
                      onChange={(event) => alterarFiltroOperacional('suspeitos', 'status', event.target.value as SuspeitoModeracaoFiltros['status'])}
                      className={filterControlClass}
                    >
                      <option value="">Todos os status</option>
                      {Object.keys(statusClass).map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                    <span className="inline-flex h-10 items-center rounded-md border border-orange-100 bg-orange-50 px-3 text-xs font-black uppercase text-orange-700">
                      2 ou mais denuncias abertas
                    </span>
                  </ListToolbar>
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
                          {suspeitosPagina.map((anuncio) => (
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
                                  {anuncio.status !== 'SUSPENSO' && <button onClick={() => executar(anuncio.anuncioId, () => suspenderAnuncio(anuncio.anuncioId, 'Suspenso para analise.'))} className="rounded-md bg-orange-50 px-3 py-2 text-xs font-bold text-orange-700 transition-colors hover:bg-orange-100">Suspender</button>}
                                  {anuncio.status === 'SUSPENSO' && <button onClick={() => executar(anuncio.anuncioId, () => reativarAnuncio(anuncio.anuncioId, 'Reativado apos analise.'))} className="rounded-md bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100">Reativar</button>}
                                  {anuncio.status !== 'REPROVADO' && <button onClick={() => executar(anuncio.anuncioId, () => reprovarSuspeito(anuncio.anuncioId, 'Reprovado apos denuncias.'))} className="rounded-md bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-100">Reprovar</button>}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <Pagination page={paginasListas.suspeitos} total={suspeitosFiltrados.length} onChange={(page) => alterarPaginaLista('suspeitos', page)} />
                </section>
              )}

              {aba === 'avaliacoes' && (
                <section>
                  <ListToolbar
                    value={filtrosOperacionais.avaliacoes.termo ?? ''}
                    onChange={(value) => alterarFiltroOperacional('avaliacoes', 'termo', value)}
                    placeholder="Buscar por anuncio, participante, comentario ou ID"
                    resultCount={avaliacoesFiltradas.length}
                  >
                    <select
                      value={filtrosOperacionais.avaliacoes.nota ?? ''}
                      onChange={(event) => alterarFiltroOperacional('avaliacoes', 'nota', event.target.value === '' ? '' : Number(event.target.value))}
                      className={filterControlClass}
                    >
                      <option value="">Todas as notas</option>
                      {[1, 2, 3, 4, 5].map((nota) => <option key={nota} value={nota}>{nota} estrela(s)</option>)}
                    </select>
                    <input type="date" aria-label="Avaliacoes desde" value={filtrosOperacionais.avaliacoes.criadoDe ?? ''} onChange={(event) => alterarFiltroOperacional('avaliacoes', 'criadoDe', event.target.value)} className={filterControlClass} />
                    <input type="date" aria-label="Avaliacoes ate" value={filtrosOperacionais.avaliacoes.criadoAte ?? ''} onChange={(event) => alterarFiltroOperacional('avaliacoes', 'criadoAte', event.target.value)} className={filterControlClass} />
                  </ListToolbar>
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
                          {avaliacoesPagina.map((avaliacao) => (
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
                  <Pagination page={paginasListas.avaliacoes} total={avaliacoesFiltradas.length} onChange={(page) => alterarPaginaLista('avaliacoes', page)} />
                </section>
              )}

              {aba === 'historico' && (
                <section>
                  <ListToolbar
                    value={filtrosOperacionais.historico.termo ?? ''}
                    onChange={(value) => alterarFiltroOperacional('historico', 'termo', value)}
                    placeholder="Buscar por acao, alvo, responsavel ou ID"
                    resultCount={historicoAtivo.length}
                  >
                    <input value={filtrosOperacionais.historico.acao ?? ''} onChange={(event) => alterarFiltroOperacional('historico', 'acao', event.target.value)} placeholder="Filtrar acao exata" className={filterControlClass} />
                    <input type="date" aria-label="Historico desde" value={filtrosOperacionais.historico.criadoDe ?? ''} onChange={(event) => alterarFiltroOperacional('historico', 'criadoDe', event.target.value)} className={filterControlClass} />
                    <input type="date" aria-label="Historico ate" value={filtrosOperacionais.historico.criadoAte ?? ''} onChange={(event) => alterarFiltroOperacional('historico', 'criadoAte', event.target.value)} className={filterControlClass} />
                  </ListToolbar>
                  <HistoricoList itens={historicoPagina} />
                  <Pagination page={paginasListas.historico} total={historicoAtivo.length} onChange={(page) => alterarPaginaLista('historico', page)} />
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
                        onClick={() => {
                          setPaginasListas((prev) => ({ ...prev, usuarios: 0 }));
                          setUsuarioFiltros(FILTROS_USUARIO_INICIAIS);
                        }}
                        className="mb-4 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-500 hover:border-blue-200 hover:text-blue-600"
                      >
                        Limpar filtros de usuarios
                      </button>
                      <p className="mb-4 text-xs font-semibold text-slate-400">
                        Dados pessoais aparecem mascarados por padrao para reduzir exposicao desnecessaria.
                      </p>
                      {loadingUsuarios && (
                        <div className="mb-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">
                          Atualizando usuarios...
                        </div>
                      )}
                      <div className="rounded-lg border border-slate-200">
                        {!loadingUsuarios && usuarios.length === 0 && (
                          <EmptyState text="Nenhum usuario encontrado com os filtros atuais." />
                        )}
                        {usuarios.length > 0 && (
                          <div className="divide-y divide-slate-100 md:hidden">
                            {usuariosPagina.map((usuario) => {
                              const isSelf = usuario.id === user?.id;
                              return (
                                <article key={usuario.id} className="space-y-3 p-4">
                                  <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <p className="break-words font-black text-slate-950">
                                        {usuario.name}
                                        {isSelf && <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-black uppercase text-blue-700">Voce</span>}
                                      </p>
                                      <p className="mt-0.5 break-all text-xs font-semibold text-slate-500">{usuario.email}</p>
                                    </div>
                                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-black uppercase text-slate-600">{usuario.perfil}</span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div>
                                      <p className="font-bold uppercase text-slate-400">Status</p>
                                      <div className="mt-1">{statusUsuario(usuario)}</div>
                                    </div>
                                    <div>
                                      <p className="font-bold uppercase text-slate-400">Reputacao</p>
                                      <p className="mt-1 font-black text-slate-700">{Number(usuario.notaReputacao ?? 0).toFixed(1)}</p>
                                    </div>
                                    <div className="col-span-2">
                                      <p className="font-bold uppercase text-slate-400">Cadastro</p>
                                      <p className="mt-1 font-semibold text-slate-600">{usuario.criadoEm ? new Date(usuario.criadoEm).toLocaleDateString('pt-BR') : '-'}</p>
                                    </div>
                                  </div>
                                  <div className="border-t border-slate-100 pt-3">{acoesUsuario(usuario)}</div>
                                </article>
                              );
                            })}
                          </div>
                        )}
                        {usuarios.length > 0 && (
                          <div className="hidden overflow-x-auto md:block">
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
                              {usuariosPagina.map((usuario) => {
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
                                      {statusUsuario(usuario)}
                                    </td>
                                    <td className="px-3 py-3 font-bold text-slate-700">{Number(usuario.notaReputacao ?? 0).toFixed(1)}</td>
                                    <td className="px-3 py-3 text-xs font-semibold text-slate-500">
                                      {usuario.criadoEm ? new Date(usuario.criadoEm).toLocaleDateString('pt-BR') : '-'}
                                    </td>
                                    <td className="px-3 py-3">
                                      {acoesUsuario(usuario)}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                          </div>
                        )}
                      </div>
                      <Pagination page={paginasListas.usuarios} total={usuarios.length} onChange={(page) => alterarPaginaLista('usuarios', page)} />
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
