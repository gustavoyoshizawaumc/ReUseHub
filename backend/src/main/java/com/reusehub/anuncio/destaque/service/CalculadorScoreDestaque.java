package com.reusehub.anuncio.destaque.service;

import com.reusehub.anuncio.destaque.enums.ContextoDestaque;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;

public final class CalculadorScoreDestaque {

    private static final BigDecimal UM = BigDecimal.ONE;
    private static final BigDecimal MEIO = new BigDecimal("0.5");
    private static final BigDecimal ZERO = BigDecimal.ZERO;
    private static final int ESCALA = 6;

    private static final Map<ContextoDestaque, PesosDestaque> PESOS_POR_CONTEXTO = Map.of(
            ContextoDestaque.RECOMENDADOS_PARA_VOCE, new PesosDestaque(
                    new BigDecimal("0.25"),
                    new BigDecimal("0.20"),
                    new BigDecimal("0.20"),
                    new BigDecimal("0.35")
            ),
            ContextoDestaque.MAIS_PROCURADOS, new PesosDestaque(
                    new BigDecimal("0.25"),
                    new BigDecimal("0.50"),
                    new BigDecimal("0.25"),
                    ZERO
            )
    );

    private CalculadorScoreDestaque() {
        throw new UnsupportedOperationException("Utility class");
    }

    public static BigDecimal calcular(
            ContextoDestaque contexto,
            LocalDateTime criadoEm,
            LocalDateTime agora,
            int totalVisualizacoes,
            BigDecimal reputacaoDoDono,
            BigDecimal afinidadeComCategoria
    ) {
        PesosDestaque pesos = obterPesos(contexto);

        BigDecimal recencia = recencia(criadoEm, agora);
        BigDecimal popularidade = popularidade(totalVisualizacoes);
        BigDecimal reputacao = reputacao(reputacaoDoDono);
        BigDecimal afinidade = clampUnitario(afinidadeComCategoria);

        BigDecimal score = pesos.recencia().multiply(recencia)
                .add(pesos.popularidade().multiply(popularidade))
                .add(pesos.reputacao().multiply(reputacao))
                .add(pesos.afinidade().multiply(afinidade));

        return clampUnitario(score).setScale(ESCALA, RoundingMode.HALF_UP);
    }

    static BigDecimal recencia(LocalDateTime criadoEm, LocalDateTime agora) {
        if (criadoEm == null || agora == null) {
            return ZERO;
        }
        double minutosDecorridos = Duration.between(criadoEm, agora).toMinutes();
        if (minutosDecorridos <= 0) {
            return UM;
        }
        double idadeEmDiasFracionada = minutosDecorridos / (60.0 * 24.0);
        double valor = Math.pow(0.5, idadeEmDiasFracionada / ConfiguracaoDestaque.HALFLIFE_DIAS);
        return clampUnitario(BigDecimal.valueOf(valor));
    }

    static BigDecimal popularidade(int totalVisualizacoes) {
        int viewsClampadas = Math.max(0, totalVisualizacoes);
        double numerador = Math.log10(1 + viewsClampadas);
        double denominador = Math.log10(1 + ConfiguracaoDestaque.TETO_VISUALIZACOES);
        double valor = numerador / denominador;
        return clampUnitario(BigDecimal.valueOf(valor));
    }

    static BigDecimal reputacao(BigDecimal reputacaoDoDono) {
        if (reputacaoDoDono == null) {
            return ZERO;
        }
        BigDecimal normalizada = reputacaoDoDono.divide(
                ConfiguracaoDestaque.NOTA_MAXIMA, ESCALA, RoundingMode.HALF_UP
        );
        return clampUnitario(normalizada);
    }

    private static PesosDestaque obterPesos(ContextoDestaque contexto) {
        PesosDestaque pesos = PESOS_POR_CONTEXTO.get(contexto);
        if (pesos == null) {
            throw new IllegalArgumentException(
                    "Contexto " + contexto + " nao usa CalculadorScoreDestaque."
            );
        }
        return pesos;
    }

    private static BigDecimal clampUnitario(BigDecimal valor) {
        if (valor == null) {
            return ZERO;
        }
        if (valor.compareTo(ZERO) < 0) {
            return ZERO;
        }
        if (valor.compareTo(UM) > 0) {
            return UM;
        }
        return valor;
    }

    private record PesosDestaque(
            BigDecimal recencia,
            BigDecimal popularidade,
            BigDecimal reputacao,
            BigDecimal afinidade
    ) {
    }
}
