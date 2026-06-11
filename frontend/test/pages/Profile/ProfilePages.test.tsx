import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DeleteAccountPage } from "../../../src/pages/Profile/DeleteAccountPage";
import { DeactivateAccountPage } from "../../../src/pages/Profile/DeactivateAccountPage";
import { EditProfilePage } from "../../../src/pages/Profile/EditProfilePage";
import { ProfilePage } from "../../../src/pages/Profile/ProfilePage";
import { PublicProfilePage } from "../../../src/pages/Profile/PublicProfilePage";

const navigateMock = vi.fn();
const getProfileMock = vi.fn();
const isLoggedInMock = vi.fn();
const deleteAccountMock = vi.fn();
const deactivateAccountMock = vi.fn();
const updateProfileMock = vi.fn();
const listarAvaliacoesMock = vi.fn();
const obterPerfilPublicoMock = vi.fn();
const removerAvaliacaoModeracaoMock = vi.fn();
let currentProfileId = "perfil-1";

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useParams: () => ({ id: currentProfileId }),
  };
});

vi.mock("../../../src/components/Header", () => ({ Header: () => <div>Header</div> }));
vi.mock("../../../src/components/Footer", () => ({ Footer: () => <div>Footer</div> }));
vi.mock("../../../src/components/profile/AvaliacoesCarousel", () => ({
  AvaliacoesCarousel: ({
    avaliacoes,
    onAbrirPerfil,
    onRemoverAvaliacao,
    podeRemover,
  }: {
    avaliacoes: Array<{ id: string }>;
    onAbrirPerfil: (id: string) => void;
    onRemoverAvaliacao?: (id: string) => void;
    podeRemover?: boolean;
  }) => (
    <div>
      <span>Avaliacoes:{avaliacoes.length}</span>
      <button onClick={() => onAbrirPerfil("outro-perfil")}>Abrir perfil</button>
      {podeRemover && onRemoverAvaliacao ? (
        <button onClick={() => onRemoverAvaliacao(avaliacoes[0]?.id ?? "a1")}>Remover avaliacao</button>
      ) : null}
    </div>
  ),
}));

vi.mock("../../../src/services/authService", () => ({
  authService: {
    getProfile: (...args: unknown[]) => getProfileMock(...args),
    isLoggedIn: (...args: unknown[]) => isLoggedInMock(...args),
    getUser: () => ({ perfil: "MODERADOR" }),
    deleteAccount: (...args: unknown[]) => deleteAccountMock(...args),
    deactivateAccount: (...args: unknown[]) => deactivateAccountMock(...args),
    updateProfile: (...args: unknown[]) => updateProfileMock(...args),
  },
}));

vi.mock("../../../src/services/avaliacaoService", () => ({
  listarAvaliacoesRecebidas: (...args: unknown[]) => listarAvaliacoesMock(...args),
}));

vi.mock("../../../src/services/perfilService", () => ({
  obterPerfilPublico: (...args: unknown[]) => obterPerfilPublicoMock(...args),
}));

vi.mock("../../../src/services/moderacaoService", () => ({
  removerAvaliacaoModeracao: (...args: unknown[]) => removerAvaliacaoModeracaoMock(...args),
}));

describe("paginas de perfil", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    getProfileMock.mockReset();
    isLoggedInMock.mockReset();
    deleteAccountMock.mockReset();
    deactivateAccountMock.mockReset();
    updateProfileMock.mockReset();
    listarAvaliacoesMock.mockReset();
    obterPerfilPublicoMock.mockReset();
    removerAvaliacaoModeracaoMock.mockReset();
    currentProfileId = "perfil-1";
    vi.useRealTimers();
  });

  it("deleta e desativa conta com confirmacao e trata erros", async () => {
    render(
      <MemoryRouter>
        <DeleteAccountPage />
        <DeactivateAccountPage />
      </MemoryRouter>,
    );

    const inputs = screen.getAllByPlaceholderText("Digite aqui...");
    fireEvent.change(inputs[0], { target: { value: "DELETAR MINHA CONTA" } });
    deleteAccountMock.mockResolvedValueOnce(undefined);
    fireEvent.click(screen.getByRole("button", { name: /excluir permanentemente/i }));
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith("/"));

    fireEvent.change(inputs[1], { target: { value: "DESATIVAR MINHA CONTA" } });
    deactivateAccountMock.mockRejectedValueOnce(new Error("Nao pode desativar"));
    fireEvent.click(screen.getByRole("button", { name: /desativar conta/i }));
    await waitFor(() => expect(screen.getByText(/nao pode desativar/i)).toBeInTheDocument());
  });

  it("carrega, valida arquivo e salva edicao de perfil", async () => {
    isLoggedInMock.mockReturnValue(true);
    getProfileMock.mockResolvedValueOnce({
      name: "Ana",
      phone: "11999999999",
      bio: "Bio antiga",
      avatarUrl: "/avatar.png",
    });

    render(
      <MemoryRouter>
        <EditProfilePage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByDisplayValue("Ana")).toBeInTheDocument());
    expect(screen.getByAltText("Preview")).toHaveAttribute("src", expect.stringContaining("/avatar.png"));

    const arquivoInvalido = new File(["txt"], "arquivo.txt", { type: "text/plain" });
    const inputArquivo = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(inputArquivo, { target: { files: [arquivoInvalido] } });
    expect(screen.getByText(/selecione uma imagem válida/i)).toBeInTheDocument();

    fireEvent.change(screen.getByDisplayValue("Ana"), { target: { value: "Ana Atualizada" } });
    updateProfileMock.mockResolvedValueOnce({});
    fireEvent.click(screen.getByRole("button", { name: /salvar alterações/i }));

    await waitFor(() => expect(screen.getByText(/perfil atualizado com sucesso/i)).toBeInTheDocument());
    expect(updateProfileMock).toHaveBeenCalledTimes(1);
  });

  it("carrega perfil privado com avaliacoes e permite navegar", async () => {
    isLoggedInMock.mockReturnValue(true);
    getProfileMock.mockResolvedValueOnce({
      id: "u1",
      name: "Ana",
      email: "ana@email.com",
      phone: "11999999999",
      cpf: "12345678901",
      bio: "",
      avatarUrl: null,
      reputationScore: 4.5,
      createdAt: "2026-01-01T00:00:00Z",
    });
    listarAvaliacoesMock.mockRejectedValueOnce(new Error("falhou"));

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText("Ana")).toBeInTheDocument());
    expect(screen.getByText(/este usuário ainda não adicionou uma biografia/i)).toBeInTheDocument();
    expect(screen.getByText("Avaliacoes:0")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /editar perfil/i }));
    fireEvent.click(screen.getByRole("button", { name: /desativar conta/i }));
    fireEvent.click(screen.getByRole("button", { name: /excluir conta/i }));
    fireEvent.click(screen.getByRole("button", { name: /abrir perfil/i }));

    expect(navigateMock).toHaveBeenCalledWith("/profile/edit");
    expect(navigateMock).toHaveBeenCalledWith("/profile/deactivate");
    expect(navigateMock).toHaveBeenCalledWith("/profile/delete");
    expect(navigateMock).toHaveBeenCalledWith("/perfil/outro-perfil");
  });

  it("carrega perfil publico, remove avaliacao e trata erro", async () => {
    obterPerfilPublicoMock.mockResolvedValueOnce({
      name: "Joao",
      bio: "Bio publica",
      avatarUrl: null,
      reputationScore: 4.8,
      anunciosAtivos: [
        { id: "a1", titulo: "Cadeira", nomeCategoria: "Casa", tipo: "DOACAO", imagensUrls: [] },
      ],
      avaliacoesRecebidas: [{ id: "av1" }],
    });

    render(
      <MemoryRouter>
        <PublicProfilePage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText("Joao")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /cadeira/i }));
    expect(navigateMock).toHaveBeenCalledWith("/anuncios/a1");

    removerAvaliacaoModeracaoMock.mockResolvedValueOnce(undefined);
    fireEvent.click(screen.getByRole("button", { name: /remover avaliacao/i }));
    await waitFor(() => expect(screen.getByText("Avaliacoes:0")).toBeInTheDocument());

    currentProfileId = "inexistente";
    obterPerfilPublicoMock.mockRejectedValueOnce(new Error("Perfil nao encontrado"));
    render(
      <MemoryRouter>
        <PublicProfilePage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText(/perfil não encontrado/i)).toBeInTheDocument());
  });
});
