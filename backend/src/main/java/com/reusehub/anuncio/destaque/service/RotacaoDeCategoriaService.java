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

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RotacaoDeCategoriaService {

    private final AnuncioRepository anuncioRepository;
    private final CategoriaRepository categoriaRepository;

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
        long epochDay = dataReferencia.toEpochDay();
        return (int) Math.floorMod(epochDay, tamanhoPool);
    }
}
