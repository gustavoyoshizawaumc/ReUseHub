package com.reusehub.anuncio.visualizacao.dto;

import com.reusehub.anuncio.visualizacao.enums.OrigemVisualizacao;
import jakarta.validation.constraints.NotNull;

public record RegistroVisualizacaoRequestDTO(

        @NotNull(message = "origem e obrigatoria")
        OrigemVisualizacao origem
) {
}
