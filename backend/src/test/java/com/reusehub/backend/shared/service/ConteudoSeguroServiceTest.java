package com.reusehub.backend.shared.service;

import com.reusehub.anuncio.exception.RegraNegocioException;
import com.reusehub.shared.service.ConteudoSeguroService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

@DisplayName("Testes unitarios de ConteudoSeguroService")
class ConteudoSeguroServiceTest {

    private final ConteudoSeguroService service = new ConteudoSeguroService();

    @Test
    @DisplayName("bloqueia termo proibido mesmo com pontuacao")
    void bloqueiaTermoComPontuacao() {
        assertThrows(
                RegraNegocioException.class,
                () -> service.validarTextoSeguro("i.d.i.o.t.a", "Texto bloqueado.")
        );
    }

    @Test
    @DisplayName("bloqueia termo proibido com acento")
    void bloqueiaTermoComAcento() {
        assertThrows(
                RegraNegocioException.class,
                () -> service.validarTextoSeguro("Atendimento de otario", "Texto bloqueado.")
        );
    }

    @Test
    @DisplayName("permite texto sem termos proibidos")
    void permiteTextoLimpo() {
        assertDoesNotThrow(() -> service.validarTextoSeguro(
                "Gustavo Santos",
                "Texto bloqueado."
        ));
    }

    @Test
    @DisplayName("nao bloqueia termo curto dentro de palavra valida")
    void naoBloqueiaTermoCurtoDentroDePalavra() {
        assertDoesNotThrow(() -> service.validarTextoSeguro(
                "Lucas Cunha",
                "Texto bloqueado."
        ));
    }

    @Test
    @DisplayName("nao bloqueia termo proibido como parte de outra palavra")
    void naoBloqueiaTermoComoParteDeOutraPalavra() {
        assertDoesNotThrow(() -> service.validarTextoSeguro(
                "Computador em otimo estado",
                "Texto bloqueado."
        ));
    }
}
