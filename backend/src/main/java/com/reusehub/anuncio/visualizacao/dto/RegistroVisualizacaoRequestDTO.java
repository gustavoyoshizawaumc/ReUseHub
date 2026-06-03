package com.reusehub.anuncio.visualizacao.dto;

import com.reusehub.anuncio.visualizacao.enums.OrigemVisualizacao;
import jakarta.validation.constraints.NotNull;

/**
 * Body do {@code POST /api/anuncios/{id}/visualizacao}.
 *
 * <p>Apenas {@code origem} no body: anuncioId vem do path; identificacao
 * (JWT/anon_id/IP) e resolvida pelo controller a partir de headers e contexto.
 */
public record RegistroVisualizacaoRequestDTO(

        @NotNull(message = "origem e obrigatoria")
        OrigemVisualizacao origem
) {
}
