import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginPage } from "../../src/pages/Login/LoginPage";
import { ForgotPasswordPage } from "../../src/pages/ForgotPassword/ForgotPasswordPage";
import { ResetPasswordPage } from "../../src/pages/ResetPassword/ResetPasswordPage";

const navigateMock = vi.fn();
const searchParamsState = new URLSearchParams();
const loginMock = vi.fn();
const reactivateMock = vi.fn();
const forgotMock = vi.fn();
const resetMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useSearchParams: () => [searchParamsState],
  };
});

vi.mock("../../src/services/authService", () => ({
  authService: {
    login: (...args: unknown[]) => loginMock(...args),
    reactivateAccount: (...args: unknown[]) => reactivateMock(...args),
    forgotPassword: (...args: unknown[]) => forgotMock(...args),
    resetPassword: (...args: unknown[]) => resetMock(...args),
  },
}));

describe("fluxos de autenticacao", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    loginMock.mockReset();
    reactivateMock.mockReset();
    forgotMock.mockReset();
    resetMock.mockReset();
    searchParamsState.delete("token");
  });

  it("valida login, navega em sucesso e permite reativar conta", async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /entrar/i }));
    expect(screen.getByText(/corrija os erros no formul/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "ana@email.com" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "Senha123!" } });

    loginMock.mockResolvedValueOnce({ perfil: "USUARIO" });
    fireEvent.click(screen.getByRole("button", { name: /entrar/i }));
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith("/"));

    loginMock.mockRejectedValueOnce(new Error("Conta desativada temporariamente"));
    fireEvent.click(screen.getByRole("button", { name: /entrar/i }));
    await waitFor(() => expect(screen.getByRole("button", { name: /reativar minha conta/i })).toBeInTheDocument());

    reactivateMock.mockResolvedValueOnce({ perfil: "MODERADOR" });
    fireEvent.click(screen.getByRole("button", { name: /reativar minha conta/i }));
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith("/moderacao"));
  });

  it("envia recuperacao de senha e sempre mostra tela de confirmacao", async () => {
    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /enviar link/i }));
    expect(screen.getByText(/obrigat/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "ana@email.com" } });
    forgotMock.mockRejectedValueOnce(new Error("offline"));
    fireEvent.click(screen.getByRole("button", { name: /enviar link/i }));

    await waitFor(() => {
      expect(screen.getByText(/verifique seu e-mail/i)).toBeInTheDocument();
    });
  });

  it("redireciona reset sem token, valida campos e conclui redefinicao", async () => {
    const { rerender } = render(
      <MemoryRouter>
        <ResetPasswordPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith("/esqueci-senha"));

    searchParamsState.set("token", "abc");
    rerender(
      <MemoryRouter>
        <ResetPasswordPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("Nova senha"), { target: { value: "fraca" } });
    fireEvent.change(screen.getByLabelText("Confirmar nova senha"), { target: { value: "outra" } });
    fireEvent.click(screen.getByRole("button", { name: /redefinir senha/i }));
    expect(screen.getByText(/as senhas n/i)).toBeInTheDocument();

    resetMock.mockRejectedValueOnce(new Error("Token expirado"));
    fireEvent.change(screen.getByLabelText("Nova senha"), { target: { value: "Senha123!" } });
    fireEvent.change(screen.getByLabelText("Confirmar nova senha"), { target: { value: "Senha123!" } });
    fireEvent.click(screen.getByRole("button", { name: /redefinir senha/i }));
    await waitFor(() => expect(screen.getByText(/token expirado/i)).toBeInTheDocument());

    resetMock.mockResolvedValueOnce(undefined);
    fireEvent.click(screen.getByRole("button", { name: /redefinir senha/i }));
    await waitFor(() => expect(screen.getByText(/senha alterada com sucesso/i)).toBeInTheDocument());
  });
});
