import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ModeracaoLayout } from "../../../src/components/moderacao/ModeracaoLayout";

const navigateMock = vi.fn();
const getUserMock = vi.fn();
const logoutMock = vi.fn();

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
    logout: () => logoutMock(),
  },
}));

describe("ModeracaoLayout", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    getUserMock.mockReset();
    logoutMock.mockReset();
  });

  it("renderiza menu admin, alterna menu mobile e faz logout", () => {
    getUserMock.mockReturnValue({ name: "Alice", perfil: "ADMIN" });

    render(
      <MemoryRouter>
        <ModeracaoLayout title="Usuarios" description="Gerencie acessos" counts={{ anuncios: 2, denuncias: 1, avaliacoes: 3 }}>
          <div>Conteudo interno</div>
        </ModeracaoLayout>
      </MemoryRouter>,
    );

    expect(screen.getByText("Conteudo interno")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Usuarios" })).toBeInTheDocument();
    expect(screen.getAllByText("Alice").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /usuarios/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /abrir menu/i }));
    expect(screen.getAllByRole("button", { name: /fechar menu/i }).length).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByRole("button", { name: /sair/i })[0]);
    expect(logoutMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith("/login");
  });
});
