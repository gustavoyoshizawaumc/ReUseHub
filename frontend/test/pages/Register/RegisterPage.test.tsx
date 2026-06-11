import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RegisterPage } from "../../../src/pages/Register/RegisterPage";

const navigateMock = vi.fn();
const registerMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("../../../src/services/authService", () => ({
  authService: {
    register: (...args: unknown[]) => registerMock(...args),
  },
}));

describe("RegisterPage", () => {
  const preencherSenhas = (senha: string, confirmacao: string) => {
    const campos = screen.getAllByPlaceholderText("••••••");
    fireEvent.change(campos[0], { target: { value: senha } });
    fireEvent.change(campos[1], { target: { value: confirmacao } });
  };

  beforeEach(() => {
    navigateMock.mockReset();
    registerMock.mockReset();
  });

  it("valida campos obrigatorios e requisitos de senha", () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /criar conta/i }));

    expect(screen.getByText(/corrija os erros/i)).toBeInTheDocument();
    expect(screen.getByText(/cpf é obrigatório/i)).toBeInTheDocument();
    expect(screen.getByText(/você deve aceitar os termos da lgpd/i)).toBeInTheDocument();

    preencherSenhas("fraca", "fraca");
    expect(screen.getAllByText(/mínimo 8 caracteres/i).length).toBeGreaterThan(0);
  });

  it("cadastra com sucesso e navega para o login", async () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("Nome Completo"), { target: { value: "Maria Santos" } });
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "maria@email.com" } });
    fireEvent.change(screen.getByLabelText("CPF"), { target: { value: "52998224725" } });
    fireEvent.change(screen.getByLabelText("Telefone (Celular)"), { target: { value: "11987654321" } });
    preencherSenhas("Senha123!", "Senha123!");
    fireEvent.click(screen.getByLabelText(/li e concordo/i));

    registerMock.mockResolvedValueOnce({});
    fireEvent.click(screen.getByRole("button", { name: /criar conta/i }));

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledTimes(1);
      expect(navigateMock).toHaveBeenCalledWith("/login");
    });
  });

  it("mostra erro quando o cadastro falha", async () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("Nome Completo"), { target: { value: "Maria Santos" } });
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "maria@email.com" } });
    fireEvent.change(screen.getByLabelText("CPF"), { target: { value: "52998224725" } });
    fireEvent.change(screen.getByLabelText("Telefone (Celular)"), { target: { value: "11987654321" } });
    preencherSenhas("Senha123!", "Senha123!");
    fireEvent.click(screen.getByLabelText(/li e concordo/i));

    registerMock.mockRejectedValueOnce(new Error("E-mail já cadastrado"));
    fireEvent.click(screen.getByRole("button", { name: /criar conta/i }));

    await waitFor(() => {
      expect(screen.getByText(/e-mail já cadastrado/i)).toBeInTheDocument();
    });
  });
});
