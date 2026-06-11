import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Header } from "../../src/components/Header";

const navigateMock = vi.fn();
const getUserMock = vi.fn();
const logoutMock = vi.fn();
const listarConversasMock = vi.fn();
const listarInteressesMock = vi.fn();
const registrarBuscaMock = vi.fn();
const salvarFiltroLocalizacaoSessaoMock = vi.fn();
const limparFiltroLocalizacaoSessaoMock = vi.fn();
const obterFiltroLocalizacaoSessaoMock = vi.fn();
const categoriasMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("../../src/services/authService", () => ({
  AUTH_USER_UPDATED_EVENT: "reusehub:auth-user-updated",
  authService: {
    getUser: (...args: unknown[]) => getUserMock(...args),
    logout: (...args: unknown[]) => logoutMock(...args),
  },
}));

vi.mock("../../src/services/chatService", () => ({
  listarConversas: (...args: unknown[]) => listarConversasMock(...args),
}));

vi.mock("../../src/services/interesseService", () => ({
  listarInteressesRecebidos: (...args: unknown[]) => listarInteressesMock(...args),
}));

vi.mock("../../src/hooks/useCategorias", () => ({
  useCategorias: () => ({ categorias: categoriasMock() }),
}));

vi.mock("../../src/utils/ultimasBuscas", () => ({
  registrarBusca: (...args: unknown[]) => registrarBuscaMock(...args),
}));

vi.mock("../../src/utils/filtroLocalizacao", async () => {
  const actual = await vi.importActual<typeof import("../../src/utils/filtroLocalizacao")>("../../src/utils/filtroLocalizacao");
  return {
    ...actual,
    salvarFiltroLocalizacaoSessao: (...args: unknown[]) => salvarFiltroLocalizacaoSessaoMock(...args),
    limparFiltroLocalizacaoSessao: (...args: unknown[]) => limparFiltroLocalizacaoSessaoMock(...args),
    obterFiltroLocalizacaoSessao: (...args: unknown[]) => obterFiltroLocalizacaoSessaoMock(...args),
  };
});

vi.mock("../../src/components/OperationalHeader", () => ({ OperationalHeader: () => <div>Operational Header</div> }));

describe("Header", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    getUserMock.mockReset();
    logoutMock.mockReset();
    listarConversasMock.mockReset();
    listarInteressesMock.mockReset();
    registrarBuscaMock.mockReset();
    salvarFiltroLocalizacaoSessaoMock.mockReset();
    limparFiltroLocalizacaoSessaoMock.mockReset();
    obterFiltroLocalizacaoSessaoMock.mockReset();
    categoriasMock.mockReset();
    categoriasMock.mockReturnValue([
      { id: 2, nome: "Casa" },
      { id: 1, nome: "Eletronicos" },
    ]);
    obterFiltroLocalizacaoSessaoMock.mockReturnValue(null);
  });

  it("renderiza header publico e executa busca, categorias e filtro de CEP", () => {
    getUserMock.mockReturnValue(null);

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText("Buscar item..."), { target: { value: "cadeira" } });
    fireEvent.submit(screen.getByRole("button", { name: /buscar/i }).closest("form")!);

    expect(registrarBuscaMock).toHaveBeenCalledWith("cadeira", null);
    expect(navigateMock).toHaveBeenCalledWith("/anuncios?termo=cadeira");

    fireEvent.click(screen.getByRole("button", { name: "Casa" }));
    expect(registrarBuscaMock).toHaveBeenCalledWith("Casa", 2);

    fireEvent.change(screen.getByLabelText(/cep para filtrar anuncios/i), { target: { value: "123" } });
    expect(screen.getByText(/cep incompleto/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/cep para filtrar anuncios/i), { target: { value: "08613565" } });
    fireEvent.click(screen.getByRole("button", { name: /aplicar filtro por cep/i }));
    expect(salvarFiltroLocalizacaoSessaoMock).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /entrar/i }));
    fireEvent.click(screen.getByRole("button", { name: /criar conta/i }));
  });

  it("renderiza header autenticado, dropdown e fluxo operacional", async () => {
    getUserMock.mockReturnValue({
      name: "Ana Silva",
      avatarUrl: "/avatar.png",
      perfil: "USUARIO",
    });
    listarConversasMock.mockResolvedValueOnce([{ naoLidas: 2 }]);
    listarInteressesMock.mockResolvedValueOnce([{ status: "PENDENTE" }]);

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(listarConversasMock).toHaveBeenCalled();
      expect(listarInteressesMock).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByAltText("Ana Silva"));
    fireEvent.click(screen.getByRole("button", { name: /meu perfil/i }));
    fireEvent.click(screen.getByAltText("Ana Silva"));
    fireEvent.click(screen.getByRole("button", { name: /meus anuncios/i }));
    fireEvent.click(screen.getByAltText("Ana Silva"));
    fireEvent.click(screen.getByRole("button", { name: /sair/i }));

    expect(logoutMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith("/login");
  });

  it("renderiza cabecalho operacional quando o usuario tem perfil interno", () => {
    getUserMock.mockReturnValue({
      name: "Moderador",
      avatarUrl: null,
      perfil: "MODERADOR",
    });

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    expect(screen.getByText("Operational Header")).toBeInTheDocument();
  });
});
