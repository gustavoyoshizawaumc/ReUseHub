package com.reusehub.anuncio.destaque.service;

import com.reusehub.anuncio.destaque.enums.ContextoDestaque;
import com.reusehub.anuncio.model.Anuncio;
import com.reusehub.anuncio.repository.AnuncioRepository;
import com.reusehub.anuncio.visualizacao.repository.VisualizacaoAnuncioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RelevanciaAnuncioService {

    private static final int ESCALA_COLUNA = 4;

    private final AnuncioRepository anuncioRepository;
    private final VisualizacaoAnuncioRepository visualizacaoAnuncioRepository;

    @Transactional
    public int recalcularTodosAtivos() {
        LocalDateTime agora = LocalDateTime.now();
        LocalDateTime limiteJanela = agora.minusDays(ConfiguracaoDestaque.JANELA_VISUALIZACOES_DIAS);

        List<Anuncio> ativos = anuncioRepository.findAtivosNaoExpiradosParaRelevancia();
        if (ativos.isEmpty()) {
            return 0;
        }

        Map<UUID, Integer> viewsJanela = carregarViewsJanela(ativos, limiteJanela);

        for (Anuncio anuncio : ativos) {
            anuncio.setNotaRelevancia(calcularRelevancia(anuncio, agora, viewsJanela));
        }
        return ativos.size();
    }

    private BigDecimal calcularRelevancia(
            Anuncio anuncio,
            LocalDateTime agora,
            Map<UUID, Integer> viewsJanela
    ) {
        BigDecimal reputacaoDono = anuncio.getUsuario().getReputationScore() != null
                ? anuncio.getUsuario().getReputationScore()
                : BigDecimal.ZERO;

        BigDecimal scoreUnitario = CalculadorScoreDestaque.calcular(
                ContextoDestaque.MAIS_PROCURADOS,
                anuncio.getCriadoEm(),
                agora,
                viewsJanela.getOrDefault(anuncio.getId(), 0),
                reputacaoDono,
                BigDecimal.ZERO
        );

        return scoreUnitario
                .multiply(ConfiguracaoDestaque.NOTA_MAXIMA)
                .setScale(ESCALA_COLUNA, RoundingMode.HALF_UP);
    }

    private Map<UUID, Integer> carregarViewsJanela(List<Anuncio> ativos, LocalDateTime limiteInferior) {
        List<UUID> ids = ativos.stream().map(Anuncio::getId).toList();
        Map<UUID, Integer> total = new HashMap<>();
        for (Object[] linha : visualizacaoAnuncioRepository.contarPorAnuncioDesde(ids, limiteInferior)) {
            total.put((UUID) linha[0], ((Number) linha[1]).intValue());
        }
        return total;
    }
}
