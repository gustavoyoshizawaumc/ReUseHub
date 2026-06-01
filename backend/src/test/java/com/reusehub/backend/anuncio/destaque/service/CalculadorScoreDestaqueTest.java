package com.reusehub.backend.anuncio.destaque.service;

import com.reusehub.anuncio.destaque.enums.ContextoDestaque;
import com.reusehub.anuncio.destaque.service.CalculadorScoreDestaque;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@DisplayName("Testes Unitarios de CalculadorScoreDestaque")
class CalculadorScoreDestaqueTest {

    private static final LocalDateTime AGORA = LocalDateTime.of(2026, 6, 1, 12, 0);

    private static final BigDecimal MARGEM_TOLERANCIA = new BigDecimal("0.001");

    private static BigDecimal calcularRecomendados(
            LocalDateTime criadoEm,
            int views,
            BigDecimal reputacao,
            BigDecimal afinidade
    ) {
        return CalculadorScoreDestaque.calcular(
                ContextoDestaque.RECOMENDADOS_PARA_VOCE, criadoEm, AGORA, views, reputacao, afinidade
        );
    }

    private static BigDecimal calcularMaisProcurados(
            LocalDateTime criadoEm,
            int views,
            BigDecimal reputacao
    ) {
        return CalculadorScoreDestaque.calcular(
                ContextoDestaque.MAIS_PROCURADOS, criadoEm, AGORA, views, reputacao, BigDecimal.ZERO
        );
    }

    private static boolean estaDentroDe(BigDecimal valor, double esperado) {
        return valor.subtract(new BigDecimal(esperado)).abs().compareTo(MARGEM_TOLERANCIA) <= 0;
    }

    @Nested
    @DisplayName("Decaimento de recencia com meia-vida real")
    class RecenciaCenarios {

        @Test
        @DisplayName("anuncio recem publicado tem recencia proxima de 1.0")
        void recenciaProximaDeUmRecemPublicado() {
            BigDecimal score = calcularMaisProcurados(AGORA.minusMinutes(1), 0, BigDecimal.ZERO);
            // peso 0.25 * recencia ~ 1.0 + restante 0
            assertTrue(score.compareTo(new BigDecimal("0.24")) >= 0,
                    "score deveria ser proximo de 0.25 (peso da recencia), foi " + score);
        }

        @Test
        @DisplayName("anuncio com 14 dias tem recencia 0.50 (meia-vida)")
        void recenciaCaiPelaMetadeNaMeiaVida() {
            BigDecimal score = calcularMaisProcurados(AGORA.minusDays(14), 0, BigDecimal.ZERO);
            // peso 0.25 * 0.50 = 0.125
            assertTrue(estaDentroDe(score, 0.125),
                    "score deveria ser ~0.125 em 14 dias, foi " + score);
        }

        @Test
        @DisplayName("anuncio com 28 dias tem recencia 0.25")
        void recenciaCaiAUmQuartoEmDuasMeiasVidas() {
            BigDecimal score = calcularMaisProcurados(AGORA.minusDays(28), 0, BigDecimal.ZERO);
            // peso 0.25 * 0.25 = 0.0625
            assertTrue(estaDentroDe(score, 0.0625),
                    "score deveria ser ~0.0625 em 28 dias, foi " + score);
        }
    }

    @Nested
    @DisplayName("Popularidade com escala logaritmica e teto")
    class PopularidadeCenarios {

        @Test
        @DisplayName("zero visualizacoes contribuem zero")
        void zeroVisualizacoesNaoContribuem() {
            BigDecimal score = calcularMaisProcurados(AGORA, 0, BigDecimal.ZERO);
            // recencia ~ 1.0 (peso 0.25), popularidade 0 (peso 0.50) = 0.25
            assertTrue(estaDentroDe(score, 0.25),
                    "score sem views deveria ser ~0.25 (so recencia), foi " + score);
        }

        @Test
        @DisplayName("anuncio no teto de views tem popularidade 1.0")
        void atingeTeto() {
            BigDecimal score = calcularMaisProcurados(AGORA, 1000, BigDecimal.ZERO);
            // recencia ~ 1.0 * 0.25 + popularidade 1.0 * 0.50 = 0.75
            assertTrue(estaDentroDe(score, 0.75),
                    "score com views no teto deveria ser ~0.75, foi " + score);
        }

        @Test
        @DisplayName("views acima do teto sao clampadas (10x teto nao muda score)")
        void clampSuperior() {
            BigDecimal scoreNoTeto = calcularMaisProcurados(AGORA, 1000, BigDecimal.ZERO);
            BigDecimal scoreAcimaDoTeto = calcularMaisProcurados(AGORA, 10000, BigDecimal.ZERO);
            assertEquals(scoreNoTeto, scoreAcimaDoTeto,
                    "popularidade deveria saturar no teto");
        }
    }

    @Nested
    @DisplayName("Clamp defensivo")
    class ClampCenarios {

        @Test
        @DisplayName("reputacao acima do maximo nao quebra o score (clampa em 1.0)")
        void reputacaoForaDoRangeNaoExcedeUm() {
            BigDecimal score = calcularMaisProcurados(AGORA, 0, new BigDecimal("99"));
            // recencia 1.0 * 0.25 + reputacao clampada em 1.0 * 0.25 = 0.50
            assertTrue(estaDentroDe(score, 0.50),
                    "reputacao deveria ser clampada em 1.0, score esperado ~0.50, foi " + score);
        }

        @Test
        @DisplayName("views negativas sao tratadas como zero")
        void viewsNegativasTratadasComoZero() {
            BigDecimal score = calcularMaisProcurados(AGORA, -50, BigDecimal.ZERO);
            assertTrue(estaDentroDe(score, 0.25),
                    "views negativas deveriam ser tratadas como zero, foi " + score);
        }

        @Test
        @DisplayName("score combinado nunca passa de 1.0 mesmo com todos fatores maximos")
        void scoreNuncaUltrapassaUm() {
            BigDecimal score = CalculadorScoreDestaque.calcular(
                    ContextoDestaque.RECOMENDADOS_PARA_VOCE,
                    AGORA, AGORA, 10000, new BigDecimal("5"), BigDecimal.ONE
            );
            assertTrue(score.compareTo(BigDecimal.ONE) <= 0,
                    "score deveria ser <= 1.0, foi " + score);
        }
    }

    @Nested
    @DisplayName("Afinidade so e considerada em RECOMENDADOS_PARA_VOCE")
    class AfinidadeCenarios {

        @Test
        @DisplayName("MAIS_PROCURADOS ignora afinidade (peso 0)")
        void afinidadeNaoMudaScoreEmMaisProcurados() {
            BigDecimal semAfinidade = CalculadorScoreDestaque.calcular(
                    ContextoDestaque.MAIS_PROCURADOS, AGORA, AGORA, 0, BigDecimal.ZERO, BigDecimal.ZERO
            );
            BigDecimal comAfinidadeMaxima = CalculadorScoreDestaque.calcular(
                    ContextoDestaque.MAIS_PROCURADOS, AGORA, AGORA, 0, BigDecimal.ZERO, BigDecimal.ONE
            );
            assertEquals(semAfinidade, comAfinidadeMaxima);
        }

        @Test
        @DisplayName("RECOMENDADOS_PARA_VOCE diferencia anuncios pela afinidade do usuario")
        void afinidadeAumentaScoreEmRecomendados() {
            BigDecimal semAfinidade = calcularRecomendados(AGORA, 0, BigDecimal.ZERO, BigDecimal.ZERO);
            BigDecimal comAfinidade = calcularRecomendados(AGORA, 0, BigDecimal.ZERO, BigDecimal.ONE);
            assertTrue(comAfinidade.compareTo(semAfinidade) > 0,
                    "afinidade maxima deveria aumentar o score em RECOMENDADOS");
        }
    }
}
