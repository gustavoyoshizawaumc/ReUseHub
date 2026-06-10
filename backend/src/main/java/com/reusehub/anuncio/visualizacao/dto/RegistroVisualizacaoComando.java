package com.reusehub.anuncio.visualizacao.dto;

import com.reusehub.anuncio.visualizacao.enums.OrigemVisualizacao;

import java.util.UUID;

public record RegistroVisualizacaoComando(
        UUID anuncioId,
        OrigemVisualizacao origem,
        String emailUsuario,
        String anonId,
        String ipAddress
) {
}
