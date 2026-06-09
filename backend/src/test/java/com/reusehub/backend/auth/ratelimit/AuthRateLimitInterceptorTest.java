package com.reusehub.backend.auth.ratelimit;

import com.reusehub.auth.ratelimit.AuthRateLimitInterceptor;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Testes Unitários do Rate Limit de Autenticação")
class AuthRateLimitInterceptorTest {

    private AuthRateLimitInterceptor interceptor;

    @BeforeEach
    void setUp() {
        interceptor = new AuthRateLimitInterceptor();
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private MockHttpServletRequest request(String metodo, String path, String ip) {
        MockHttpServletRequest request = new MockHttpServletRequest(metodo, path);
        request.setRemoteAddr(ip);
        return request;
    }

    private boolean executar(String metodo, String path, String ip) throws Exception {
        return interceptor.preHandle(request(metodo, path, ip), new MockHttpServletResponse(), new Object());
    }

    @Nested
    @DisplayName("Rotas sem regra configurada")
    class RotasSemRegra {

        @Test
        @DisplayName("Deve liberar rota não monitorada independente do volume")
        void liberaRotaSemRegra() throws Exception {
            for (int i = 0; i < 100; i++) {
                assertTrue(executar("GET", "/api/anuncios", "10.0.0.1"));
            }
        }
    }

    @Nested
    @DisplayName("Login")
    class Login {

        @Test
        @DisplayName("Deve liberar até o limite e bloquear a partir do excedente")
        void bloqueiaAposLimite() throws Exception {
            String ip = "10.0.0.2";
            for (int i = 0; i < 10; i++) {
                assertTrue(executar("POST", "/api/auth/login", ip), "tentativa " + (i + 1) + " deveria passar");
            }

            assertFalse(executar("POST", "/api/auth/login", ip), "11ª tentativa deveria ser bloqueada");
        }

        @Test
        @DisplayName("Deve responder 429 com corpo JSON ao bloquear")
        void retorna429ComCorpo() throws Exception {
            String ip = "10.0.0.3";
            for (int i = 0; i < 10; i++) {
                interceptor.preHandle(request("POST", "/api/auth/login", ip), new MockHttpServletResponse(), new Object());
            }

            MockHttpServletResponse response = new MockHttpServletResponse();
            boolean permitido = interceptor.preHandle(request("POST", "/api/auth/login", ip), response, new Object());

            assertFalse(permitido);
            assertEquals(HttpStatus.TOO_MANY_REQUESTS.value(), response.getStatus());
            assertTrue(response.getContentAsString().contains("Muitas tentativas"));
        }

        @Test
        @DisplayName("Deve isolar contadores por IP distinto")
        void isolaPorIp() throws Exception {
            String ipA = "10.0.0.4";
            String ipB = "10.0.0.5";

            for (int i = 0; i < 10; i++) {
                executar("POST", "/api/auth/login", ipA);
            }
            assertFalse(executar("POST", "/api/auth/login", ipA), "IP A deveria estar bloqueado");
            assertTrue(executar("POST", "/api/auth/login", ipB), "IP B não deveria ser afetado");
        }
    }

    @Nested
    @DisplayName("Recuperação de senha")
    class RecuperacaoSenha {

        @Test
        @DisplayName("Deve bloquear esqueci-senha após 5 tentativas")
        void bloqueiaEsqueciSenha() throws Exception {
            String ip = "10.0.0.6";
            for (int i = 0; i < 5; i++) {
                assertTrue(executar("POST", "/api/auth/esqueci-senha", ip));
            }
            assertFalse(executar("POST", "/api/auth/esqueci-senha", ip));
        }

        @Test
        @DisplayName("Deve bloquear redefinir-senha após 10 tentativas")
        void bloqueiaRedefinirSenha() throws Exception {
            String ip = "10.0.0.7";
            for (int i = 0; i < 10; i++) {
                assertTrue(executar("POST", "/api/auth/redefinir-senha", ip));
            }
            assertFalse(executar("POST", "/api/auth/redefinir-senha", ip));
        }

        @Test
        @DisplayName("Deve manter contadores independentes entre regras diferentes")
        void regrasIndependentes() throws Exception {
            String ip = "10.0.0.8";
            for (int i = 0; i < 5; i++) {
                executar("POST", "/api/auth/esqueci-senha", ip);
            }
            assertFalse(executar("POST", "/api/auth/esqueci-senha", ip), "esqueci-senha deveria estar bloqueado");
            assertTrue(executar("POST", "/api/auth/login", ip), "login não deveria ser afetado");
        }
    }
}
