package com.reusehub.anuncio.destaque.service;

import com.reusehub.anuncio.model.Categoria;
import com.reusehub.anuncio.repository.AnuncioRepository;
import com.reusehub.anuncio.repository.CategoriaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Escolhe a categoria rotativa do dia para a home (cenarios ANONIMO e
 * SEM_HISTORICO). A escolha e deterministica: dada a mesma data e o mesmo
 * pool de candidatas, sempre retorna a mesma categoria.
 *
 * <p><strong>Algoritmo</strong>:
 * <ol>
 *   <li>Busca top categorias com >= {@code MIN_ANUNCIOS_POR_CATEGORIA}
 *       anuncios ATIVOS (ate {@code TOP_CATEGORIAS_ROTACAO}).</li>
 *   <li>Se o pool estiver vazio, refaz com o limite reduzido
 *       ({@code MIN_ANUNCIOS_POR_CATEGORIA_FALLBACK}).</li>
 *   <li>Sorteia por dia juliano: {@code indice = epochDay % poolSize}.</li>
 *   <li>Se ainda zerado, devolve {@link Optional#empty()}.</li>
 * </ol>
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RotacaoDeCategoriaService {

    private final AnuncioRepository anuncioRepository;
    private final CategoriaRepository categoriaRepository;

    /**
     * @param dataReferencia Data usada como semente da rotacao (em geral
     *                       {@code LocalDate.now()}, mas injetavel pra testes).
     * @return Categoria escolhida ou {@code empty} se nao houver candidatas.
     */
    public Optional<Categoria> obterCategoriaDoDia(LocalDate dataReferencia) {
        List<Integer> idsElegiveis = buscarIdsElegiveis(ConfiguracaoDestaque.MIN_ANUNCIOS_POR_CATEGORIA);
        if (idsElegiveis.isEmpty()) {
            idsElegiveis = buscarIdsElegiveis(ConfiguracaoDestaque.MIN_ANUNCIOS_POR_CATEGORIA_FALLBACK);
        }
        if (idsElegiveis.isEmpty()) {
            return Optional.empty();
        }

        int indice = calcularIndiceDoDia(dataReferencia, idsElegiveis.size());
        Integer categoriaId = idsElegiveis.get(indice);
        return categoriaRepository.findById(categoriaId);
    }

    private List<Integer> buscarIdsElegiveis(long minimoAnuncios) {
        return anuncioRepository
                .listarCategoriasMaisPopulares(
                        minimoAnuncios,
                        PageRequest.of(0, ConfiguracaoDestaque.TOP_CATEGORIAS_ROTACAO)
                )
                .stream()
                .map(linha -> (Integer) linha[0])
                .toList();
    }

    private int calcularIndiceDoDia(LocalDate dataReferencia, int tamanhoPool) {
        // toEpochDay sempre cresce; modulo positivo garantido enquanto tamanhoPool > 0.
        long epochDay = dataReferencia.toEpochDay();
        return (int) Math.floorMod(epochDay, tamanhoPool);
    }
}
