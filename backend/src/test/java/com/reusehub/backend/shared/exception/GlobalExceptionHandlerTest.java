package com.reusehub.backend.shared.exception;

import com.reusehub.shared.exception.GlobalExceptionHandler;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Testes Unitários de GlobalExceptionHandler")
class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    @DisplayName("deve traduzir 'Bad credentials' do Spring para mensagem amigavel com status 401")
    void traduzBadCredentials() {
        // O Spring Security lanca BadCredentialsException com a mensagem crua "Bad credentials".
        ResponseEntity<Map<String, Object>> resposta =
                handler.handleBadCredentials(new BadCredentialsException("Bad credentials"));

        assertEquals(HttpStatus.UNAUTHORIZED, resposta.getStatusCode());

        Map<String, Object> corpo = resposta.getBody();
        assertNotNull(corpo);
        assertEquals("E-mail ou senha incorretos.", corpo.get("mensagem"));
        assertEquals(401, corpo.get("status"));
        // Nunca deve vazar a string original em ingles para o usuario.
        assertNotEquals("Bad credentials", corpo.get("mensagem"));
    }
}
