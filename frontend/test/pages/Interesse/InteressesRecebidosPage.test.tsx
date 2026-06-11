import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InteressesRecebidosPage } from "../../../src/pages/Interesse/InteressesRecebidosPage";

const navigateMock = vi.fn();
const notifyMock = vi.fn();
const listarHistoricoInteressesMock = vi.fn();
const aceitarInteresseMock = vi.fn();
const recusarInteresseMock = vi.fn();
const getUserMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("../../../src/components/Header", () => ({ Header: () => <div>Header</div> }));
vi.mock("../../../src/components/feedback/feedbackContext", () => ({
  useFeedback: () => ({
    notify: notifyMock,
  }),
}));
vi.mock("../../../src/components/avaliacao/AvaliacaoModal", () => ({
  AvaliacaoModal: ({
    open,
    avaliadoNome,
    onClose,
    onSuccess,
  }: {
    open: boolean;
    avaliadoNome: string;
    onClose: () => void;
    onSuccess: () => Promise<void>;
  }) =>
    open ? (
      <div>
        <span>Avaliando {avaliadoNome}</span>
        <button onClick={() => void onSuccess()}>Salvar avaliacao</button>
        <button onClick={onClose}>Fechar avaliacao</button>
      </div>
    ) : null,
}));

vi.mock("../../../src/services/authService", () => ({
  authService: {
    getUser: () => getUserMock(),
  },
}));

vi.mock("../../../src/services/interesseService", () => ({
  listarHistoricoInteresses: (...args: unknown[]) => listarHistoricoInteressesMock(...args),
  aceitarInteresse: (...args: unknown[]) => aceitarInteresseMock(...args),
  recusarInteresse: (...args: unknown[]) => recusarInteresseMock(...args),
}));

const interesseRecebido = {
  id: "i1",
  interessadoId: "u2",
  interessadoNome: "Joao",
  interessadoNotaReputacao: 4.1,
  anuncianteId: "u1",
  anuncianteNome: "Maria",
  anuncianteNotaReputacao: 4.8,
  anuncioDesejadoId: "ad1",
  anuncioDesejadoTitulo: "Bicicleta infantil",
  anuncioDesejadoTipo: "DOACAO",
  anuncioDesejadoStatus: "ATIVO",
  anuncioDesejadoImagemUrl: null,
  anuncioOferecidoTitulo: "Capacete",
  anuncioOferecidoImagemUrl: null,
  mensagem: "Tenho interesse",
  status: "PENDENTE",
  criadoEm: "2026-02-01T00:00:00Z",
  canceladoEm: null,
  recebimentoConfirmadoEm: null,
  usuarioJaAvaliou: false,
};

const interesseConcluido = {
  ...interesseRecebido,
  id: "i2",
  interessadoId: "u1",
  interessadoNome: "Maria",
  anuncianteId: "u3",
  anuncianteNome: "Pedro",
  anuncianteNotaReputacao: 4.4,
  anuncioDesejadoTitulo: "Livro de matematica",
  anuncioDesejadoTipo: "TROCA",
  anuncioDesejadoStatus: "CONCLUIDO",
  status: "ACEITO",
  usuarioJaAvaliou: false,
  recebimentoConfirmadoEm: "2026-02-10T00:00:00Z",
};

describe("InteressesRecebidosPage", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    notifyMock.mockReset();
    listarHistoricoInteressesMock.mockReset();
    aceitarInteresseMock.mockReset();
    recusarInteresseMock.mockReset();
    getUserMock.mockReset();
    getUserMock.mockReturnValue({ id: "u1" });
  });

  it("carrega negociacoes, filtra, aceita, recusa e avalia", async () => {
    listarHistoricoInteressesMock.mockResolvedValue([interesseRecebido, interesseConcluido]);
    aceitarInteresseMock.mockResolvedValue({ conversaId: "c1" });
    recusarInteresseMock.mockResolvedValue({});

    render(
      <MemoryRouter>
        <InteressesRecebidosPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText(/interesses e propostas/i)).toBeInTheDocument());
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText(/bicicleta infantil/i)).toBeInTheDocument();
    expect(screen.getByText(/livro de matematica/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /recebidas/i }));
    expect(screen.queryByText(/livro de matematica/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /todas/i }));
    fireEvent.click(screen.getByRole("button", { name: /^joao$/i }));
    expect(navigateMock).toHaveBeenCalledWith("/perfil/u2");

    fireEvent.click(screen.getByRole("button", { name: /^aceitar$/i }));
    await waitFor(() => expect(aceitarInteresseMock).toHaveBeenCalledWith("i1"));
    expect(navigateMock).toHaveBeenCalledWith("/chat", { state: { conversaId: "c1" } });

    fireEvent.click(screen.getByRole("button", { name: /^recusar$/i }));
    await waitFor(() => expect(recusarInteresseMock).toHaveBeenCalledWith("i1"));

    fireEvent.click(screen.getByRole("button", { name: /concluidas/i }));
    fireEvent.click(screen.getByRole("button", { name: /avaliar pedro/i }));
    expect(screen.getByText(/avaliando pedro/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /salvar avaliacao/i }));
    await waitFor(() => expect(listarHistoricoInteressesMock.mock.calls.length).toBeGreaterThanOrEqual(4));
  });

  it("mostra estado vazio e erro de carregamento", async () => {
    listarHistoricoInteressesMock.mockRejectedValueOnce(new Error("falhou geral"));

    const { rerender } = render(
      <MemoryRouter>
        <InteressesRecebidosPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(notifyMock).toHaveBeenCalled());
    expect(notifyMock.mock.calls[0][0].title).toMatch(/erro ao carregar negociacoes/i);

    listarHistoricoInteressesMock.mockResolvedValueOnce([]);
    rerender(
      <MemoryRouter>
        <InteressesRecebidosPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText(/nenhuma negociacao encontrada/i)).toBeInTheDocument());
  });
});
