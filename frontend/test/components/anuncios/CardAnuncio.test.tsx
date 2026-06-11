import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CardAnuncio } from "../../../src/components/anuncios/CardAnuncio";

const navigateMock = vi.fn();
const getUserMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("../../../src/services/authService", () => ({
  authService: {
    getUser: () => getUserMock(),
  },
}));

vi.mock("../../../src/components/denuncia/DenunciaAnuncioModal", () => ({
  DenunciaAnuncioModal: ({
    open,
    onClose,
    anuncioTitulo,
  }: {
    open: boolean;
    onClose: () => void;
    anuncioTitulo: string;
  }) =>
    open ? (
      <div>
        <span>Modal denuncia {anuncioTitulo}</span>
        <button onClick={onClose}>Fechar denuncia</button>
      </div>
    ) : null,
}));

const anuncioBase = {
  id: "a1",
  titulo: "Mesa dobravel",
  descricao: "Mesa em bom estado",
  tipo: "DOACAO" as const,
  condicao: "BOM" as const,
  status: "ATIVO" as const,
  totalVisualizacoes: 14,
  notaRelevancia: null,
  criadoEm: "2026-01-01T00:00:00Z",
  atualizadoEm: "2026-01-02T00:00:00Z",
  usuarioId: "u2",
  nomeUsuario: "Carlos",
  notaReputacaoUsuario: 4.7,
  categoriaId: 1,
  nomeCategoria: "Moveis",
  enderecoId: "e1",
  cidade: "Sao Paulo",
  uf: "SP",
  imagensUrls: ["/img/mesa.jpg"],
};

describe("CardAnuncio", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    getUserMock.mockReset();
    localStorage.clear();
  });

  it("renderiza card em grade e executa acoes principais", () => {
    getUserMock.mockReturnValue({ id: "u1" });
    const toggleMock = vi.fn();

    render(
      <MemoryRouter>
        <CardAnuncio anuncio={anuncioBase} variant="grid" isFavorito onToggleFavorito={toggleMock} origem="RECENTES" />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByTitle(/favoritar anuncio/i));
    expect(toggleMock).toHaveBeenCalledWith("a1");

    fireEvent.click(screen.getByTitle(/denunciar anuncio/i));
    expect(navigateMock).toHaveBeenCalledWith("/login");

    localStorage.setItem("token", "abc");
    fireEvent.click(screen.getByTitle(/denunciar anuncio/i));
    expect(screen.getByText(/modal denuncia mesa dobravel/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/fechar denuncia/i));
    fireEvent.click(screen.getAllByRole("button", { name: /mesa dobravel/i })[0]);
    expect(navigateMock).toHaveBeenCalledWith("/anuncios/a1", { state: { origem: "RECENTES" } });
  });

  it("renderiza card em lista com status e exclusao", () => {
    getUserMock.mockReturnValue({ id: "u1" });
    const deleteMock = vi.fn();

    render(
      <MemoryRouter>
        <CardAnuncio
          anuncio={{ ...anuncioBase, id: "a2", status: "SUSPENSO", motivoSuspensao: "Conteudo irregular", imagensUrls: [], cidade: undefined, uf: undefined }}
          onDelete={deleteMock}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText(/motivo da suspensao/i)).toBeInTheDocument();
    expect(screen.getByText(/conteudo irregular/i)).toBeInTheDocument();
    expect(screen.getByText(/localização não informada/i)).toBeInTheDocument();

    fireEvent.click(screen.getByTitle(/deletar anuncio/i));
    expect(deleteMock).toHaveBeenCalledWith("a2");
  });

  it("nao permite abrir anuncio inativo e oculta acoes do dono", () => {
    getUserMock.mockReturnValue({ id: "u2" });

    render(
      <MemoryRouter>
        <CardAnuncio anuncio={{ ...anuncioBase, status: "REPROVADO", motivoReprovacao: "Foto ruim" }} variant="list" onDelete={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByText(/motivo da reprovacao/i)).toBeInTheDocument();
    expect(screen.queryByTitle(/favoritar anuncio/i)).not.toBeInTheDocument();
    expect(screen.queryByTitle(/denunciar anuncio/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByText(/mesa dobravel/i));
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
