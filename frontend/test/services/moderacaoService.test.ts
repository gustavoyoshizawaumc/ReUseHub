import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/utils/sessao", () => ({
  obterTokenAtivoOuEncerrarSessao: () => '"token-123"',
}));

import {
  alterarUsuarioAdmin,
  anonimizarUsuarioAdmin,
  aprovarAnuncio,
  criarAdministrador,
  criarModerador,
  descartarDenuncia,
  listarAnunciosModeracao,
  listarAnunciosPendentes,
  listarAuditoria,
  listarAvaliacoesModeracao,
  listarDenuncias,
  listarMeuHistorico,
  listarUsuariosAdmin,
  obterDashboardAdmin,
  reativarAnuncio,
  removerAvaliacaoModeracao,
  reprovarAnuncio,
  reprovarSuspeito,
} from "../../src/services/moderacaoService";

const fetchMock = vi.fn();

const jsonResponse = (payload: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });

describe("moderacaoService", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("monta chamadas de listagem com filtros e authorization", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ content: [], totalElements: 0, totalPages: 0, currentPage: 0, pageSize: 10, hasNext: false, hasPrevious: false }))
      .mockResolvedValueOnce(jsonResponse({ content: [], totalElements: 0, totalPages: 0, currentPage: 0, pageSize: 10, hasNext: false, hasPrevious: false }))
      .mockResolvedValueOnce(jsonResponse({ content: [], totalElements: 0, totalPages: 0, currentPage: 0, pageSize: 10, hasNext: false, hasPrevious: false }))
      .mockResolvedValueOnce(jsonResponse({ content: [], totalElements: 0, totalPages: 0, currentPage: 0, pageSize: 10, hasNext: false, hasPrevious: false }))
      .mockResolvedValueOnce(jsonResponse({ content: [], totalElements: 0, totalPages: 0, currentPage: 0, pageSize: 10, hasNext: false, hasPrevious: false }))
      .mockResolvedValueOnce(jsonResponse({ content: [], totalElements: 0, totalPages: 0, currentPage: 0, pageSize: 10, hasNext: false, hasPrevious: false }));

    await listarAnunciosPendentes(2, 5);
    await listarAnunciosModeracao({ termo: " cadeira ", status: "ATIVO" }, 1, 20);
    await listarDenuncias("ABERTA", 0, 15);
    await listarMeuHistorico({ termo: "acao", acao: "BANIR", criadoDe: "2026-01-01", criadoAte: "2026-01-31" });
    await listarAvaliacoesModeracao({ termo: "ana", nota: 5, criadoDe: "2026-01-01", criadoAte: "2026-01-31" });
    await listarAuditoria({ termo: "root", acao: "LOGIN" }, 3, 7);

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("/api/anuncios/moderacao/pendentes?page=2&size=5"),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer token-123' }) }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(2, expect.stringContaining("termo=cadeira"), expect.any(Object));
    expect(fetchMock).toHaveBeenNthCalledWith(2, expect.stringContaining("status=ATIVO"), expect.any(Object));
    expect(fetchMock).toHaveBeenNthCalledWith(3, expect.stringContaining("/denuncias?page=0&size=15&status=ABERTA"), expect.any(Object));
    expect(fetchMock).toHaveBeenNthCalledWith(4, expect.stringContaining("acao=BANIR"), expect.any(Object));
    expect(fetchMock).toHaveBeenNthCalledWith(5, expect.stringContaining("nota=5"), expect.any(Object));
    expect(fetchMock).toHaveBeenNthCalledWith(6, expect.stringContaining("/api/admin/auditoria?page=3&size=7"), expect.any(Object));
  });

  it("executa mutacoes administrativas e normaliza dashboard", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ id: "a1" }))
      .mockResolvedValueOnce(jsonResponse({ id: "a2" }))
      .mockResolvedValueOnce(jsonResponse({ id: "d1" }))
      .mockResolvedValueOnce(jsonResponse({ id: "s1" }))
      .mockResolvedValueOnce(jsonResponse({ id: "s2" }))
      .mockResolvedValueOnce(jsonResponse(undefined, { status: 204 }))
      .mockResolvedValueOnce(jsonResponse({ content: [], totalElements: 0, totalPages: 0, currentPage: 0, pageSize: 10, hasNext: false, hasPrevious: false }))
      .mockResolvedValueOnce(jsonResponse({
        totalUsuarios: 10,
        usuariosAtivos: 9,
        usuariosBanidos: 1,
        totalAnuncios: 20,
        anunciosAtivos: 5,
        anunciosPendentes: 2,
        anunciosReprovados: 1,
        anunciosConcluidos: 3,
        anunciosDoacao: 11,
        anunciosTroca: 9,
        denunciasAbertas: 4,
        denunciasResolvidas: 8,
      }))
      .mockResolvedValueOnce(jsonResponse({ id: "m1" }))
      .mockResolvedValueOnce(jsonResponse({ id: "a1" }))
      .mockResolvedValueOnce(jsonResponse({ id: "u1" }))
      .mockResolvedValueOnce(jsonResponse(undefined, { status: 204 }));

    await aprovarAnuncio("a1");
    await reprovarAnuncio("a2", "motivo");
    await descartarDenuncia("d1", "sem base");
    await reativarAnuncio("s1", "ok");
    await reprovarSuspeito("s2", "abuso");
    await removerAvaliacaoModeracao("av1", "ofensiva");
    await listarUsuariosAdmin(0, 10, { termo: " maria ", perfil: "MODERADOR", ativo: true, banido: false, criadoDe: "2026-01-01", criadoAte: "2026-01-31" });
    const dashboard = await obterDashboardAdmin({ criadoDe: "2026-01-01", tipo: "DOACAO", categoriaId: 3 });
    await criarModerador({ name: "Mod", email: "mod@email.com", password: "12345678" });
    await criarAdministrador({ name: "Admin", email: "admin@email.com", password: "12345678" });
    await alterarUsuarioAdmin("u1", "banir");
    await anonimizarUsuarioAdmin("u2");

    expect(fetchMock).toHaveBeenNthCalledWith(1, expect.stringContaining("/a1/aprovar"), expect.objectContaining({ method: "PATCH" }));
    expect(fetchMock).toHaveBeenNthCalledWith(2, expect.any(String), expect.objectContaining({ body: JSON.stringify({ justificativa: "motivo" }) }));
    expect(fetchMock).toHaveBeenNthCalledWith(6, expect.stringContaining("/avaliacoes/av1"), expect.objectContaining({ method: "DELETE" }));
    expect(fetchMock).toHaveBeenNthCalledWith(7, expect.stringContaining("termo=maria"), expect.any(Object));
    expect(fetchMock).toHaveBeenNthCalledWith(8, expect.stringContaining("/dashboard?criadoDe=2026-01-01"), expect.any(Object));
    expect(dashboard.usuariosPorMes).toEqual([]);
    expect(dashboard.anunciosMaisVisualizados).toEqual([]);
    expect(fetchMock).toHaveBeenNthCalledWith(12, expect.stringContaining("/usuarios/u2"), expect.objectContaining({ method: "DELETE" }));
  });

  it("propaga mensagens de erro do backend", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ mensagem: "Nao autorizado" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(aprovarAnuncio("erro")).rejects.toThrow("Nao autorizado");
  });
});
