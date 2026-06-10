package com.reusehub.backend.auth.service;

import com.reusehub.anuncio.exception.OperacaoInvalidaException;
import com.reusehub.auth.service.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Testes Unitários de JwtService")
class JwtServiceTest {

    private JwtService jwtService;
    private UserDetails userDetails;

    private final String secretTesteBase64 = "bXUtcXVlcmlkby1wZmMtcmV1c2VodWItYmFja2VuZC10ZXN0ZS1zZWNyZXQtMjAyNg==";

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();

        ReflectionTestUtils.setField(jwtService, "secret", secretTesteBase64);
        ReflectionTestUtils.setField(jwtService, "expiration", 3600000L);

        userDetails = new User("gustavo@reusehub.com", "senha123", Collections.emptyList());
    }

    @Nested
    @DisplayName("Cenários de Sucesso")
    class SucessoCenarios {

        @Test
        @DisplayName("deve gerar token válido e extrair o e-mail (subject) com sucesso")
        void gerarEExtrairComSucesso() {
            String token = jwtService.gerarToken(userDetails);

            assertNotNull(token);
            assertFalse(token.isBlank());

            String emailExtraido = jwtService.extrairEmail(token);
            assertEquals("gustavo@reusehub.com", emailExtraido);

            assertTrue(jwtService.tokenValido(token, userDetails));
        }
    }

    @Nested
    @DisplayName("Cenários de Erro e Exceções")
    class ErroCenarios {

        @Test
        @DisplayName("deve estourar OperacaoInvalidaException ao tentar extrair claim de token corrompido")
        void erroTokenCorrompido() {
            String tokenInvalido = "eyJhbGciOiJIUzI1NiJ9.eyNjb3Jyb21waWRvUnVpbadb.hash_falso";

            assertThrows(OperacaoInvalidaException.class, () -> {
                jwtService.extrairEmail(tokenInvalido);
            });
        }

        @Test
        @DisplayName("deve retornar falso se validar o token contra um UserDetails com username diferente")
        void erroUsuarioDiferente() {
            String token = jwtService.gerarToken(userDetails);

            UserDetails outroUsuario = new User("invasor@reusehub.com", "senha", Collections.emptyList());

            assertFalse(jwtService.tokenValido(token, outroUsuario));
        }

        @Test
        @DisplayName("deve estourar OperacaoInvalidaException se o token enviado estiver com tempo expirado")
        void erroTokenExpirado() {
            ReflectionTestUtils.setField(jwtService, "expiration", -5000L);

            String tokenExpirado = jwtService.gerarToken(userDetails);

            assertThrows(OperacaoInvalidaException.class, () -> {
                jwtService.extrairEmail(tokenExpirado);
            });
        }
    }
}
