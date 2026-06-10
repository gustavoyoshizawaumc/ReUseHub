package com.reusehub.anuncio.destaque.service;

import com.reusehub.anuncio.destaque.dto.CategoriaEmDestaqueDTO;
import com.reusehub.anuncio.destaque.enums.TipoSelecaoCategoria;
import com.reusehub.anuncio.model.Categoria;
import com.reusehub.anuncio.repository.AnuncioFavoritoRepository;
import com.reusehub.anuncio.repository.CategoriaRepository;
import com.reusehub.interesse.repository.InteresseTrocaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Comparator;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoriaEmDestaqueService {

    private final AnuncioFavoritoRepository anuncioFavoritoRepository;
    private final InteresseTrocaRepository interesseTrocaRepository;
    private final CategoriaRepository categoriaRepository;
    private final RotacaoDeCategoriaService rotacaoDeCategoriaService;

    public Optional<CategoriaEmDestaqueDTO> obterParaUsuarioComHistorico(UUID usuarioId) {
        Map<Integer, BigDecimal> pontosPorCategoria = calcularAfinidadePorCategoria(usuarioId);
        if (pontosPorCategoria.isEmpty()) {
            return Optional.empty();
        }

        return pontosPorCategoria.entrySet().stream()
                .max(Comparator.comparing(Map.Entry::getValue))
                .map(Map.Entry::getKey)
                .flatMap(categoriaRepository::findById)
                .map(categoria -> CategoriaEmDestaqueDTO.deEntidade(
                        categoria, TipoSelecaoCategoria.INTERESSE_USUARIO
                ));
    }

    public Optional<CategoriaEmDestaqueDTO> obterRotativaDoDia(java.time.LocalDate dataReferencia) {
        return rotacaoDeCategoriaService.obterCategoriaDoDia(dataReferencia)
                .map(categoria -> CategoriaEmDestaqueDTO.deEntidade(
                        categoria, TipoSelecaoCategoria.ROTATIVA
                ));
    }

    Map<Integer, BigDecimal> calcularAfinidadePorCategoria(UUID usuarioId) {
        Map<Integer, BigDecimal> pontos = new HashMap<>();

        for (Object[] linha : anuncioFavoritoRepository.contarFavoritosPorCategoria(usuarioId)) {
            Integer categoriaId = (Integer) linha[0];
            long quantidade = ((Number) linha[1]).longValue();
            BigDecimal contribuicao = ConfiguracaoDestaque.PESO_FAVORITO
                    .multiply(BigDecimal.valueOf(quantidade));
            pontos.merge(categoriaId, contribuicao, BigDecimal::add);
        }

        for (Object[] linha : interesseTrocaRepository.contarInteressesPorCategoria(usuarioId)) {
            Integer categoriaId = (Integer) linha[0];
            long quantidade = ((Number) linha[1]).longValue();
            BigDecimal contribuicao = ConfiguracaoDestaque.PESO_INTERESSE
                    .multiply(BigDecimal.valueOf(quantidade));
            pontos.merge(categoriaId, contribuicao, BigDecimal::add);
        }

        return pontos;
    }

    public Map<Integer, BigDecimal> calcularAfinidadeNormalizada(UUID usuarioId) {
        Map<Integer, BigDecimal> pontos = calcularAfinidadePorCategoria(usuarioId);
        if (pontos.isEmpty()) {
            return Map.of();
        }
        BigDecimal total = pontos.values().stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (total.signum() == 0) {
            return Map.of();
        }

        Map<Integer, BigDecimal> normalizada = new HashMap<>();
        pontos.forEach((categoriaId, valor) ->
                normalizada.put(
                        categoriaId,
                        valor.divide(total, 6, java.math.RoundingMode.HALF_UP)
                )
        );
        return normalizada;
    }
}
