import type {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
} from "../types/auth.types";

const API_URL = "http://localhost:8080/api/auth";

export const authService = {
  // Cadastro
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Erro ao cadastrar");
    }

    const result: AuthResponse = await response.json();
    localStorage.setItem("token", result.token);
    localStorage.setItem("user", JSON.stringify(result));
    return result;
  },

  // Login
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Erro ao fazer login");
    }

    const result: AuthResponse = await response.json();
    localStorage.setItem("token", result.token);
    localStorage.setItem("user", JSON.stringify(result));
    return result;
  },

  // Logout
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  // Get token
  getToken: (): string | null => {
    return localStorage.getItem("token");
  },

  // Get user
  getUser: () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },
};
