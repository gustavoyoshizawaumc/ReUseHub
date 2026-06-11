import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ModeracaoPage } from "../../../src/pages/Moderacao/ModeracaoPage";

const confirmMock = vi.fn();
const getUserMock = vi.fn();
const listarAnunciosPendentesMock = vi.fn();
const listarAnunciosModeracaoMock = vi.fn();
const listarDenunciasMock = vi.fn();
const listarAvaliacoesModeracaoMock = vi.fn();
const listarMeuHistoricoMock = vi.fn();
const listarAuditoriaMock = vi.fn();
const listarUsuariosAdminMock = vi.fn();
const obterDashboardAdminMock = vi.fn();
const aprovarAnuncioMock = vi.fn();
const reprovarAnuncioMock = vi.fn();
const descartarDenunciaMock = vi.fn();
const reprovarSuspeitoMock = vi.fn();
const removerAvaliacaoModeracaoMock = vi.fn();
const criarModeradorMock = vi.fn();
const criarAdministradorMock = vi.fn();
const alterarUsuarioAdminMock = vi.fn();
const anonimizarUsuarioAdminMock = vi.fn();

vi.mock("chart.js", () => ({
  ArcElement: {},
  BarElement: {},
  CategoryScale: {},
  Chart: { register: vi.fn() },
  Filler: {},
  Legend: {},
  LinearScale: {},
  LineElement: {},
  PointElement: {},
  Tooltip: {},
}));

vi.mock("react-chartjs-2", () => ({
  Bar: () => <div>Chart Bar</div>,
  Line: () => <div>Chart Line</div>,
  Pie: () => <div>Chart Pie</div>,
}));

vi.mock("../../../src/components/feedback/feedbackContext", () => ({
  useFeedback: () => ({
    confirm: confirmMock,
  }),
}));

vi.mock("../../../src/hooks/useCategorias", () => ({
  useCategorias: () => ({
    categorias: [
      { id: 1, nome: "Moveis" },
      { id: 2, nome: "Livros" },
    ],
  }),
}));

vi.mock("../../../src/services/authService", () => ({
  authService: {
    getUser: () => getUserMock(),
    logout: vi.fn(),
  },
}));

vi.mock("../../../src/services/moderacaoService", () => ({
  listarAnunciosPendentes: (...args: unknown[]) => listarAnunciosPendentesMock(...args),
  listarAnunciosModeracao: (...args: unknown[]) => listarAnunciosModeracaoMock(...args),
  listarDenuncias: (...args: unknown[]) => listarDenunciasMock(...args),
  listarAvaliacoesModeracao: (...args: unknown[]) => listarAvaliacoesModeracaoMock(...args),
  listarMeuHistorico: (...args: unknown[]) => listarMeuHistoricoMock(...args),
  listarAuditoria: (...args: unknown[]) => listarAuditoriaMock(...args),
  listarUsuariosAdmin: (...args: unknown[]) => listarUsuariosAdminMock(...args),
  obterDashboardAdmin: (...args: unknown[]) => obterDashboardAdminMock(...args),
  aprovarAnuncio: (...args: unknown[]) => aprovarAnuncioMock(...args),
  reprovarAnuncio: (...args: unknown[]) => reprovarAnuncioMock(...args),
  descartarDenuncia: (...args: unknown[]) => descartarDenunciaMock(...args),
  reprovarSuspeito: (...args: unknown[]) => reprovarSuspeitoMock(...args),
  removerAvaliacaoModeracao: (...args: unknown[]) => removerAvaliacaoModeracaoMock(...args),
  criarModerador: (...args: unknown[]) => criarModeradorMock(...args),
  criarAdministrador: (...args: unknown[]) => criarAdministradorMock(...args),
  alterarUsuarioAdmin: (...args: unknown[]) => alterarUsuarioAdminMock(...args),
  anonimizarUsuarioAdmin: (...args: unknown[]) => anonimizarUsuarioAdminMock(...args),
}));

const anuncioPendente = {
  id: "a1",
  titulo: "Mesa de jantar",
  descricao: "Mesa de madeira",
  tipo: "DOACAO" as const,
  condicao: "BOM" as const,
  status: "PENDENTE" as const,
  totalVisualizacoes: 5,
  notaRelevancia: null,
  criadoEm: "2026-01-10T00:00:00Z",
  atualizadoEm: "2026-01-10T00:00:00Z",
  usuarioId: "u2",
  nomeUsuario: "Carlos",
  categoriaId: 1,
  nomeCategoria: "Moveis",
  enderecoId: "e1",
  cidade: "Sao Paulo",
  uf: "SP",
  cep: "01001000",
  imagensUrls: ["/img1.jpg", "/img2.jpg"],
  imagens: [
    { id: "i1", urlImagem: "/img1.jpg", ordemExibicao: 0, capa: true },
    { id: "i2", urlImagem: "/img2.jpg", ordemExibicao: 1, capa: false },
  ],
};

const denuncia = {
  id: "d1",
  anuncioId: "a1",
  tituloAnuncio: "Mesa de jantar",
  imagensUrls: ["/img1.jpg"],
  nomeAnunciante: "Carlos",
  statusAnuncio: "ATIVO",
  tipoAnuncio: "DOACAO",
  categoriaAnuncio: "Moveis",
  denuncianteId: "u3",
  nomeDenunciante: "Lia",
  motivo: "Spam",
  descricao: "Descricao da denuncia",
  status: "ABERTA",
  criadoEm: "2026-01-12T00:00:00Z",
  denunciasAbertasDoAnuncio: 1,
};

const avaliacao = {
  id: "av1",
  avaliadorId: "u2",
  avaliadorNome: "Carlos",
  avaliadoId: "u3",
  avaliadoNome: "Lia",
  anuncioId: "a1",
  anuncioTitulo: "Mesa de jantar",
  nota: 2,
  comentario: "Comentario ofensivo",
  criadoEm: "2026-01-13T00:00:00Z",
};

const historico = {
  id: "h1",
  moderadorId: "m1",
  nomeModerador: "Alice",
  acao: "APROVAR_ANUNCIO",
  alvoTipo: "ANUNCIO",
  alvoId: "a1",
  detalhes: "Aprovado",
  criadoEm: "2026-01-14T00:00:00Z",
};

const usuario = {
  id: "u9",
  name: "Marina",
  email: "marina@email.com",
  cpf: "***",
  perfil: "USUARIO" as const,
  ativo: true,
  banido: false,
  notaReputacao: 4.6,
  criadoEm: "2026-01-01T00:00:00Z",
};

const respostaPaginada = <T,>(content: T[]) => ({
  content,
  totalElements: content.length,
  totalPages: 1,
  currentPage: 0,
  pageSize: 100,
  hasNext: false,
  hasPrevious: false,
});

const configurarMocksBase = () => {
  listarAnunciosPendentesMock.mockResolvedValue(respostaPaginada([anuncioPendente]));
  listarAnunciosModeracaoMock.mockResolvedValue(respostaPaginada([anuncioPendente]));
  listarDenunciasMock.mockResolvedValue(respostaPaginada([denuncia]));
  listarAvaliacoesModeracaoMock.mockResolvedValue(respostaPaginada([avaliacao]));
  listarMeuHistoricoMock.mockResolvedValue(respostaPaginada([historico]));
  listarAuditoriaMock.mockResolvedValue(respostaPaginada([historico]));
  listarUsuariosAdminMock.mockResolvedValue(respostaPaginada([usuario]));
  obterDashboardAdminMock.mockResolvedValue({
    totalUsuarios: 10,
    usuariosAtivos: 9,
    usuariosBanidos: 1,
    totalAnuncios: 20,
    anunciosAtivos: 12,
    anunciosPendentes: 1,
    anunciosReprovados: 2,
    anunciosConcluidos: 5,
    anunciosDoacao: 14,
    anunciosTroca: 6,
    denunciasAbertas: 1,
    denunciasResolvidas: 4,
    usuariosPorMes: [{ label: "Jan", valor: 3 }],
    concluidosPorMes: [{ label: "Jan", valor: 2 }],
    anunciosCriadosPorMes: [{ label: "Jan", primeiroValor: 2, segundoValor: 1 }],
    denunciasPorMes: [{ label: "Jan", primeiroValor: 1, segundoValor: 1 }],
    anunciosMaisVisualizados: [{ id: "1", label: "Mesa de jantar", valor: 8 }],
    usuariosMelhorReputacao: [{ id: "2", label: "Marina", valor: 5 }],
    categoriasComMaisAnuncios: [{ id: "3", label: "Moveis", valor: 7 }],
  });
  aprovarAnuncioMock.mockResolvedValue({ ...anuncioPendente, status: "ATIVO" });
  reprovarAnuncioMock.mockResolvedValue({ ...anuncioPendente, status: "REPROVADO" });
  descartarDenunciaMock.mockResolvedValue({});
  reprovarSuspeitoMock.mockResolvedValue({ anuncioId: "a1" });
  removerAvaliacaoModeracaoMock.mockResolvedValue(undefined);
  criarModeradorMock.mockResolvedValue({ id: "m2" });
  criarAdministradorMock.mockResolvedValue({ id: "m3" });
  alterarUsuarioAdminMock.mockResolvedValue({ ...usuario, banido: true });
  anonimizarUsuarioAdminMock.mockResolvedValue(undefined);
  confirmMock.mockResolvedValue(true);
};

const renderPagina = (rota: string) =>
  render(
    <MemoryRouter initialEntries={[rota]}>
      <ModeracaoPage />
    </MemoryRouter>,
  );

describe("ModeracaoPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    configurarMocksBase();
  });

  it("renderiza visao geral administrativa com dashboard e auditoria", async () => {
    getUserMock.mockReturnValue({ id: "admin-1", name: "Alice", perfil: "ADMIN" });

    renderPagina("/moderacao");

    await waitFor(() => expect(screen.getByRole("heading", { name: /visao geral/i })).toBeInTheDocument());
    expect(screen.getByText(/filtros do dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/usuarios por periodo/i)).toBeInTheDocument();
    expect(screen.getByText(/anuncios mais visualizados/i)).toBeInTheDocument();
    expect(screen.getByText(/aprovar anuncio/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /12 meses/i }));
    fireEvent.click(screen.getByRole("button", { name: /^limpar$/i }));

    await waitFor(() => expect(obterDashboardAdminMock).toHaveBeenCalled());
    expect(listarUsuariosAdminMock).toHaveBeenCalled();
  });

  it("executa fluxo de anuncios e denuncias", async () => {
    getUserMock.mockReturnValue({ id: "mod-1", name: "Bruno", perfil: "MODERADOR" });

    const { unmount } = render(
      <MemoryRouter initialEntries={["/moderacao/anuncios"]}>
        <ModeracaoPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText(/mesa de jantar/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /ver detalhes/i }));
    await waitFor(() => expect(screen.getByText(/analise do anuncio/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /ver foto 2/i }));
    fireEvent.click(screen.getAllByRole("button", { name: /aprovar/i })[0]);
    await waitFor(() => expect(aprovarAnuncioMock).toHaveBeenCalledWith("a1"));

    fireEvent.click(screen.getAllByRole("button", { name: /reprovar/i })[0]);
    await waitFor(() => expect(screen.getByPlaceholderText(/explique objetivamente/i)).toBeInTheDocument());
    fireEvent.click(screen.getAllByRole("button", { name: /reprovar anuncio/i })[0]);
    expect(screen.getByText(/informe o motivo da reprovacao/i)).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/explique objetivamente/i), { target: { value: "Falta descricao" } });
    fireEvent.click(screen.getAllByRole("button", { name: /reprovar anuncio/i })[0]);
    await waitFor(() => expect(reprovarAnuncioMock).toHaveBeenCalledWith("a1", "Falta descricao"));

    unmount();
    render(
      <MemoryRouter initialEntries={["/moderacao/denuncias"]}>
        <ModeracaoPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByRole("button", { name: /analisar/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /analisar/i }));
    await waitFor(() => expect(screen.getByText(/analise das denuncias/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /descartar denuncias/i }));
    await waitFor(() => expect(descartarDenunciaMock).toHaveBeenCalledWith("d1", "Denuncia improcedente."));

  });

  it("remove avaliacao e administra usuarios internos", async () => {
    getUserMock.mockReturnValue({ id: "admin-1", name: "Alice", perfil: "ADMIN" });

    const { unmount } = render(
      <MemoryRouter initialEntries={["/moderacao/avaliacoes"]}>
        <ModeracaoPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText(/comentario ofensivo/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /remover/i }));
    await waitFor(() => expect(screen.getByPlaceholderText(/opcional/i)).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText(/opcional/i), { target: { value: "Violou regras" } });
    fireEvent.click(screen.getAllByRole("button", { name: /remover avaliacao/i })[0]);
    await waitFor(() => expect(removerAvaliacaoModeracaoMock).toHaveBeenCalledWith("av1", "Violou regras"));

    unmount();
    render(
      <MemoryRouter initialEntries={["/moderacao/usuarios"]}>
        <ModeracaoPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByPlaceholderText("Nome")).toBeInTheDocument());
    const nomeInput = screen.getByPlaceholderText("Nome");
    const emailInput = screen.getByPlaceholderText("E-mail");
    const senhaInput = screen.getByPlaceholderText("Senha");

    fireEvent.change(nomeInput, { target: { value: "Nova Moderadora" } });
    fireEvent.change(emailInput, { target: { value: "nova@reusehub.com" } });
    fireEvent.change(senhaInput, { target: { value: "12345678" } });
    fireEvent.click(screen.getByRole("button", { name: /criar moderador/i }));
    await waitFor(() => expect(criarModeradorMock).toHaveBeenCalled());

    fireEvent.change(nomeInput, { target: { value: "Novo Admin" } });
    fireEvent.change(emailInput, { target: { value: "admin@reusehub.com" } });
    fireEvent.change(senhaInput, { target: { value: "12345678" } });
    fireEvent.click(screen.getByRole("button", { name: /criar admin/i }));
    await waitFor(() => expect(criarAdministradorMock).toHaveBeenCalled());

    fireEvent.click(screen.getAllByRole("button", { name: /banir/i })[0]);
    await waitFor(() => expect(alterarUsuarioAdminMock).toHaveBeenCalledWith("u9", "banir"));

    fireEvent.click(screen.getAllByRole("button", { name: /anonimizar/i })[0]);
    await waitFor(() => expect(anonimizarUsuarioAdminMock).toHaveBeenCalledWith("u9"));
  });
});
