import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Footer } from "../../src/components/Footer";
import { HeroBanner } from "../../src/components/HeroBanner";
import { EmptyStateHome } from "../../src/components/EmptyStateHome";
import { ErroAoCarregarHome } from "../../src/components/ErroAoCarregarHome";
import { HomeSkeleton } from "../../src/components/HomeSkeleton";
import { ManualUsuarioPage } from "../../src/pages/Institucional/ManualUsuarioPage";
import { PoliticaPrivacidadePage } from "../../src/pages/Institucional/PoliticaPrivacidadePage";

const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("../../src/components/Header", () => ({ Header: () => <div>Header Mock</div> }));

describe("componentes estaticos", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    vi.useRealTimers();
  });

  it("renderiza footer com links principais", () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );

    expect(screen.getByText("Marketplace")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /política de privacidade/i })).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`${new Date().getFullYear()} ReUseHub`, "i"))).toBeInTheDocument();
  });

  it("renderiza hero banner e responde aos controles", () => {
    vi.useFakeTimers();

    render(<HeroBanner />);

    fireEvent.click(screen.getByRole("button", { name: /slide 2/i }));
    fireEvent.click(screen.getByRole("button", { name: /slide anterior/i }));
    fireEvent.click(screen.getByRole("button", { name: /próximo slide/i }));
    vi.advanceTimersByTime(6000);

    expect(screen.getAllByRole("img")).toHaveLength(3);
  });

  it("renderiza estados da home e acoes", () => {
    const reloadSpy = vi.fn();
    Object.defineProperty(window, "location", {
      value: { ...window.location, reload: reloadSpy },
      configurable: true,
    });

    render(<EmptyStateHome />);
    fireEvent.click(screen.getByRole("button", { name: /publicar um anuncio/i }));
    expect(navigateMock).toHaveBeenCalledWith("/anuncios/novo");

    render(<ErroAoCarregarHome mensagem="Falhou geral" />);
    expect(screen.getByText("Falhou geral")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /tentar novamente/i }));
    expect(reloadSpy).toHaveBeenCalledTimes(1);

    render(<HomeSkeleton />);
    expect(document.querySelectorAll(".animate-pulse").length).toBeGreaterThan(10);

  });

  it("renderiza paginas institucionais", () => {
    render(
      <MemoryRouter>
        <ManualUsuarioPage />
        <PoliticaPrivacidadePage />
      </MemoryRouter>,
    );

    expect(screen.getAllByText("Header Mock").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: /manual do usuário/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /política de privacidade/i })).toBeInTheDocument();
    expect(screen.getByText("Cadastro e acesso")).toBeInTheDocument();
    expect(screen.getByText(/direitos do usuário/i)).toBeInTheDocument();
  });
});
