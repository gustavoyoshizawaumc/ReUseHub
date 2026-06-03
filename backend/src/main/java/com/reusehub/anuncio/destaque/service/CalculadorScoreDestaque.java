package com.reusehub.anuncio.destaque.service;

import com.reusehub.anuncio.destaque.enums.ContextoDestaque;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * Funcao pura (sem Spring, sem IO) que calcula a pontuacao de destaque
 * de um anuncio. Recebe um snapshot ja resolvido (sem lazy loading);
 * portanto e 100% testavel via {@code assertEquals}, sem mocks.
 *
 * <p><strong>Nota tecnica (PR D.2):</strong> o parametro nomeado
 * {@code totalVisualizacoes} semanticamente representa visualizacoes em
 * janela temporal ({@link ConfiguracaoDestaque#JANELA_VISUALIZACOES_DIAS} dias),
 * nao o total historico. Mantemos o nome do parametro por compatibilidade
 * com os testes existentes, mas o caller (AnuncioDestaqueService) agora passa
 * a agregacao da tabela {@code visualizacoes_anuncio} via
 * {@link com.reusehub.anuncio.visualizacao.repository.VisualizacaoAnuncioRepository}.
 */
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

    /**
     * Calcula a pontuacao final do anuncio para o contexto informado,
     * retornando um valor em {@code [0, 1]} (pode ser comparado diretamente).
     *
     * @param contexto                 Estrategia de pesos a aplicar.
     * @param criadoEm                 Data de criacao do anuncio (usada na recencia).
     * @param agora                    Momento de referencia (injetado para testabilidade).
     * @param totalVisualizacoes       Visualizacoes acumuladas no anuncio.
     * @param reputacaoDoDono          Nota de reputacao do anunciante (range historico 0..NOTA_MAXIMA).
     * @param afinidadeComCategoria    Score de afinidade ja normalizado em [0,1]; use 0 quando ausente.
     * @return Score combinado, sempre clampado em {@code [0, 1]}.
     */
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

    /**
     * Recencia com decaimento de meia-vida real (HALFLIFE_DIAS).
     * Em 14 dias: 0.5 exato. Em 28 dias: 0.25. Sempre decrescente.
     */
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

    /**
     * Popularidade com escala logaritmica e teto explicito; evita que um
     * anuncio com 50k visualizacoes domine completamente a home.
     */
    static BigDecimal popularidade(int totalVisualizacoes) {
        int viewsClampadas = Math.max(0, totalVisualizacoes);
        double numerador = Math.log10(1 + viewsClampadas);
        double denominador = Math.log10(1 + ConfiguracaoDestaque.TETO_VISUALIZACOES);
        double valor = numerador / denominador;
        return clampUnitario(BigDecimal.valueOf(valor));
    }

    /**
     * Reputacao normalizada em [0, 1], com clamp defensivo caso o valor
     * persistido esteja fora do range historico (0..NOTA_MAXIMA).
     */
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

    /**
     * Vetor de pesos (recencia, popularidade, reputacao, afinidade) usado
     * para combinar os fatores. A soma dos quatro pesos deve ser 1.0;
     * o teste {@code PesosDestaqueIntegridadeTest} valida essa invariante.
     */
    private record PesosDestaque(
            BigDecimal recencia,
            BigDecimal popularidade,
            BigDecimal reputacao,
            BigDecimal afinidade
    ) {
    }
}
