import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../src/App";

vi.mock("../src/pages/Home/HomePage", () => ({ HomePage: () => <div>Home Page</div> }));
vi.mock("../src/pages/Register/RegisterPage", () => ({ RegisterPage: () => <div>Register Page</div> }));
vi.mock("../src/pages/Login/LoginPage", () => ({ LoginPage: () => <div>Login Page</div> }));
vi.mock("../src/pages/ForgotPassword/ForgotPasswordPage", () => ({ ForgotPasswordPage: () => <div>Forgot Page</div> }));
vi.mock("../src/pages/ResetPassword/ResetPasswordPage", () => ({ ResetPasswordPage: () => <div>Reset Page</div> }));
vi.mock("../src/pages/Anuncios/CriarAnuncioPage", () => ({ CriarAnuncioPage: () => <div>Criar Anuncio</div> }));
vi.mock("../src/pages/Anuncios/EditarAnuncioPage", () => ({ EditarAnuncioPage: () => <div>Editar Anuncio</div> }));
vi.mock("../src/pages/Anuncios/ExplorarAnunciosPage", () => ({ ExplorarAnunciosPage: () => <div>Explorar Anuncios</div> }));
vi.mock("../src/pages/Anuncios/MeusAnunciosPage", () => ({ MeusAnunciosPage: () => <div>Meus Anuncios</div> }));
vi.mock("../src/pages/Anuncios/DetalhesAnuncioPage", () => ({ DetalhesAnuncioPage: () => <div>Detalhes Anuncio</div> }));
vi.mock("../src/pages/Anuncios/FavoritosPage", () => ({ FavoritosPage: () => <div>Favoritos Page</div> }));
vi.mock("../src/pages/Profile/ProfilePage", () => ({ ProfilePage: () => <div>Profile Page</div> }));
vi.mock("../src/pages/Profile/EditProfilePage", () => ({ EditProfilePage: () => <div>Edit Profile</div> }));
vi.mock("../src/pages/Profile/DeleteAccountPage", () => ({ DeleteAccountPage: () => <div>Delete Account</div> }));
vi.mock("../src/pages/Profile/DeactivateAccountPage", () => ({ DeactivateAccountPage: () => <div>Deactivate Account</div> }));
vi.mock("../src/pages/Profile/PublicProfilePage", () => ({ PublicProfilePage: () => <div>Public Profile</div> }));
vi.mock("../src/pages/Chat/ChatPage", () => ({ ChatPage: () => <div>Chat Page</div> }));
vi.mock("../src/pages/Interesse/InteressesRecebidosPage", () => ({ InteressesRecebidosPage: () => <div>Interesses</div> }));
vi.mock("../src/pages/Institucional/PoliticaPrivacidadePage", () => ({ PoliticaPrivacidadePage: () => <div>Privacidade</div> }));
vi.mock("../src/pages/Institucional/ManualUsuarioPage", () => ({ ManualUsuarioPage: () => <div>Manual</div> }));
vi.mock("../src/pages/Moderacao/ModeracaoPage", () => ({ ModeracaoPage: () => <div>Moderacao</div> }));
vi.mock("../src/components/ModeratorRoute", () => ({ ModeratorRoute: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("../src/components/UserOnlyRoute", () => ({ UserOnlyRoute: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("../src/components/MarketplaceOnlyRoute", () => ({ MarketplaceOnlyRoute: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("../src/components/feedback/FeedbackProvider", () => ({ FeedbackProvider: ({ children }: { children: React.ReactNode }) => <>{children}</> }));

describe("App", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/");
  });

  it("renderiza rotas principais e fallback 404", () => {
    const voltarSpy = vi.spyOn(window.history, "back").mockImplementation(() => undefined);

    window.history.pushState({}, "", "/login");
    const primeiraRenderizacao = render(<App />);
    expect(screen.getByText("Login Page")).toBeInTheDocument();
    primeiraRenderizacao.unmount();

    window.history.pushState({}, "", "/manual");
    render(<App />);
    expect(screen.getByText("Manual")).toBeInTheDocument();

    window.history.pushState({}, "", "/nao-existe");
    render(<App />);
    expect(screen.getByText("Ops! Página não encontrada.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /voltar para onde eu estava/i }));
    expect(voltarSpy).toHaveBeenCalledTimes(1);

    voltarSpy.mockRestore();
  });
});
