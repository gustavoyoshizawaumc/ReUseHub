package com.reusehub.anuncio.dto;

import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record AnuncioImagensAtualizacaoDTO(
        @NotNull List<UUID> idsParaManter
) {
}
