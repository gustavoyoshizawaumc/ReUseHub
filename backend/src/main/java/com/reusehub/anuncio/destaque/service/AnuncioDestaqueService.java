package com.reusehub.anuncio.destaque.service;

import com.reusehub.anuncio.destaque.dto.AnuncioDestaqueDTO;
import com.reusehub.anuncio.destaque.enums.ContextoDestaque;
import com.reusehub.anuncio.dto.AnuncioRespostaDTO;
import com.reusehub.anuncio.mapper.AnuncioRespostaMapper;
import com.reusehub.anuncio.model.Anuncio;
import com.reusehub.anuncio.repository.AnuncioRepository;
import com.reusehub.anuncio.visualizacao.repository.VisualizacaoAnuncioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnuncioDestaqueService {

    private static final int LIMITE_CANDIDATOS_PARA_RANKING = 200;

    private final AnuncioRepository anuncioRepository;
    private final AnuncioRespostaMapper anuncioRespostaMapper;
    private final CategoriaEmDestaqueService categoriaEmDestaqueService;
    private final VisualizacaoAnuncioRepository visualizacaoAnuncioRepository;

    public List<AnuncioDestaqueDTO> obterDestaques(
            ContextoDestaque contexto,
            Integer categoriaId,
            int size,
            UUID usuarioId
    ) {
        int sizeClampado = Math.min(Math.max(1, size), ConfiguracaoDestaque.LIMITE_MAXIMO_SIZE);

        return switch (contexto) {
            case RECOMENDADOS_PARA_VOCE -> obterRecomendadosParaVoce(sizeClampado, usuarioId);
            case MAIS_PROCURADOS -> obterMaisProcurados(sizeClampado, categoriaId, usuarioId);
            case POPULARES -> obterPopulares(sizeClampado);
            case RECENTES -> obterRecentes(sizeClampado);
        };
    }

    private List<AnuncioDestaqueDTO> obterRecomendadosParaVoce(int size, UUID usuarioId) {
        if (usuarioId == null) {
            return List.of();
        }
        List<Anuncio> candidatos = anuncioRepository.findElegiveisParaDestaque(
                PageRequest.of(0, LIMITE_CANDIDATOS_PARA_RANKING)
        );
        Map<Integer, BigDecimal> afinidadePorCategoria =
                categoriaEmDestaqueService.calcularAfinidadeNormalizada(usuarioId);

        return ranquearPorScore(
                candidatos,
                ContextoDestaque.RECOMENDADOS_PARA_VOCE,
                afinidadePorCategoria,
                size
        );
    }

    private List<AnuncioDestaqueDTO> obterMaisProcurados(int size, Integer categoriaId, UUID usuarioId) {
        if (categoriaId == null) {
            return List.of();
        }
        List<Anuncio> candidatos = anuncioRepository.findElegiveisParaDestaquePorCategoria(
                categoriaId,
                PageRequest.of(0, LIMITE_CANDIDATOS_PARA_RANKING)
        );
        return ranquearPorScore(
                candidatos,
                ContextoDestaque.MAIS_PROCURADOS,
                Map.of(),
                size
        );
    }

    private List<AnuncioDestaqueDTO> obterPopulares(int size) {
        return anuncioRepository.findElegiveisOrdenadosPorPopularidade(PageRequest.of(0, size))
                .stream()
                .map(anuncio -> AnuncioDestaqueDTO.de(anuncioRespostaMapper.mapearPublico(anuncio), null))
                .toList();
    }

    private List<AnuncioDestaqueDTO> obterRecentes(int size) {
        return anuncioRepository.findElegiveisParaDestaque(PageRequest.of(0, size))
                .stream()
                .map(anuncio -> AnuncioDestaqueDTO.de(anuncioRespostaMapper.mapearPublico(anuncio), null))
                .toList();
    }

    private List<AnuncioDestaqueDTO> ranquearPorScore(
            List<Anuncio> candidatos,
            ContextoDestaque contexto,
            Map<Integer, BigDecimal> afinidadePorCategoria,
            int size
    ) {
        if (candidatos.isEmpty()) {
            return List.of();
        }
        LocalDateTime agora = LocalDateTime.now();
        Map<UUID, Integer> visualizacoesRecentesPorAnuncio = carregarVisualizacoesRecentes(candidatos, agora);

        record AnuncioComScore(Anuncio anuncio, BigDecimal score) {
        }

        return candidatos.stream()
                .map(anuncio -> new AnuncioComScore(
                        anuncio,
                        CalculadorScoreDestaque.calcular(
                                contexto,
                                anuncio.getCriadoEm(),
                                agora,
                                visualizacoesRecentesPorAnuncio.getOrDefault(anuncio.getId(), 0),
                                anuncio.getUsuario().getReputationScore() != null
                                        ? anuncio.getUsuario().getReputationScore()
                                        : BigDecimal.ZERO,
                                afinidadePorCategoria.getOrDefault(
                                        anuncio.getCategoria().getId(),
                                        BigDecimal.ZERO
                                )
                        )
                ))
                .sorted(
                        Comparator.<AnuncioComScore, BigDecimal>comparing(AnuncioComScore::score)
                                .reversed()
                                .thenComparing((AnuncioComScore item) -> item.anuncio().getCriadoEm(),
                                        Comparator.reverseOrder())
                )
                .limit(size)
                .map(item -> AnuncioDestaqueDTO.de(
                        anuncioRespostaMapper.mapearPublico(item.anuncio()),
                        item.score()
                ))
                .toList();
    }

    private Map<UUID, Integer> carregarVisualizacoesRecentes(List<Anuncio> candidatos, LocalDateTime agora) {
        List<UUID> ids = candidatos.stream().map(Anuncio::getId).toList();
        LocalDateTime limiteInferior = agora.minusDays(ConfiguracaoDestaque.JANELA_VISUALIZACOES_DIAS);

        Map<UUID, Integer> total = new HashMap<>();
        for (Object[] linha : visualizacaoAnuncioRepository.contarPorAnuncioDesde(ids, limiteInferior)) {
            UUID anuncioId = (UUID) linha[0];
            long quantidade = ((Number) linha[1]).longValue();
            total.put(anuncioId, Math.toIntExact(quantidade));
        }
        return total;
    }
}
