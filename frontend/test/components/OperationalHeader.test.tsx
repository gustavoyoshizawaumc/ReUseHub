import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OperationalHeader } from "../../src/components/OperationalHeader";

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

vi.mock("../../src/services/authService", () => ({
  AUTH_USER_UPDATED_EVENT: "auth:user-updated",
  authService: {
    getUser: () => getUserMock(),
    logout: () => logoutMock(),
  },
}));

describe("OperationalHeader", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    getUserMock.mockReset();
    logoutMock.mockReset();
  });

  it("renderiza nome do admin, reage a evento e faz logout", async () => {
    getUserMock
      .mockReturnValueOnce({ name: "Alice", perfil: "ADMIN" })
      .mockReturnValueOnce({ name: "Bruna", perfil: "MODERADOR" });

    render(
      <MemoryRouter>
        <OperationalHeader />
      </MemoryRouter>,
    );

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getAllByText("Admin").length).toBeGreaterThan(0);

    act(() => {
      window.dispatchEvent(new Event("auth:user-updated"));
    });
    await waitFor(() => expect(screen.getByText("Bruna")).toBeInTheDocument());
    expect(screen.getAllByText("Moderador").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: /modera/i }));
    fireEvent.click(screen.getByRole("button", { name: /sair/i }));

    expect(navigateMock).toHaveBeenCalledWith("/moderacao");
    expect(logoutMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith("/login");
  });
});
