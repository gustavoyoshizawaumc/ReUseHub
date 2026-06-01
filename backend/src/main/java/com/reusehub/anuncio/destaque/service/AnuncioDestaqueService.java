package com.reusehub.anuncio.destaque.service;

import com.reusehub.anuncio.destaque.dto.AnuncioDestaqueDTO;
import com.reusehub.anuncio.destaque.enums.ContextoDestaque;
import com.reusehub.anuncio.dto.AnuncioRespostaDTO;
import com.reusehub.anuncio.mapper.AnuncioRespostaMapper;
import com.reusehub.anuncio.model.Anuncio;
import com.reusehub.anuncio.repository.AnuncioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Orquestra a busca e o ranqueamento de anuncios em destaque para cada
 * contexto da home.
 *
 * <p>Estrategia por contexto:
 * <ul>
 *   <li>{@code RECOMENDADOS_PARA_VOCE} - carrega ate
 *       {@link #LIMITE_CANDIDATOS_PARA_RANKING} anuncios elegiveis e ranqueia
 *       por score multi-fator com afinidade do usuario.</li>
 *   <li>{@code MAIS_PROCURADOS} - mesmo fluxo, filtrado por categoria e sem
 *       afinidade (cada secao ja e por categoria).</li>
 *   <li>{@code POPULARES} - ordenacao direta por {@code totalVisualizacoes}.</li>
 *   <li>{@code RECENTES} - ordenacao direta por {@code criadoEm}.</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnuncioDestaqueService {

    /**
     * Quantidade maxima de anuncios carregados para o ranqueamento em memoria.
     * Mantem o calculo barato em bases medias; ajuste se a base crescer muito.
     */
    private static final int LIMITE_CANDIDATOS_PARA_RANKING = 200;

    private final AnuncioRepository anuncioRepository;
    private final AnuncioRespostaMapper anuncioRespostaMapper;
    private final CategoriaEmDestaqueService categoriaEmDestaqueService;

    /**
     * Executa o contexto solicitado e devolve ate {@code size} anuncios ja
     * ordenados. Sempre aplica clamp em {@code size} para evitar excesso.
     *
     * @param contexto    Estrategia de ranqueamento.
     * @param categoriaId Categoria a filtrar (obrigatorio em MAIS_PROCURADOS; ignorado nos demais).
     * @param size        Quantidade desejada de anuncios.
     * @param usuarioId   Id do usuario autenticado (obrigatorio em RECOMENDADOS_PARA_VOCE).
     */
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

    // -- Estrategias por contexto --------------------------------------------

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
        // Afinidade nao se aplica a MAIS_PROCURADOS (peso 0 no calculador),
        // mas mantemos a estrutura por simetria.
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
                .map(anuncio -> AnuncioDestaqueDTO.de(anuncioRespostaMapper.mapear(anuncio), null))
                .toList();
    }

    private List<AnuncioDestaqueDTO> obterRecentes(int size) {
        return anuncioRepository.findElegiveisParaDestaque(PageRequest.of(0, size))
                .stream()
                .map(anuncio -> AnuncioDestaqueDTO.de(anuncioRespostaMapper.mapear(anuncio), null))
                .toList();
    }

    // -- Pipeline de ranqueamento por score -----------------------------------

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

        record AnuncioComScore(Anuncio anuncio, BigDecimal score) {
        }

        return candidatos.stream()
                .map(anuncio -> new AnuncioComScore(
                        anuncio,
                        CalculadorScoreDestaque.calcular(
                                contexto,
                                anuncio.getCriadoEm(),
                                agora,
                                Optional.ofNullable(anuncio.getTotalVisualizacoes()).orElse(0),
                                Optional.ofNullable(anuncio.getUsuario().getReputationScore())
                                        .orElse(BigDecimal.ZERO),
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
                        anuncioRespostaMapper.mapear(item.anuncio()),
                        item.score()
                ))
                .toList();
    }
}
