package com.reusehub.interesse.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record InteresseCriacaoDTO(
        @NotNull UUID anuncioDesejadoId,
        UUID anuncioOferecidoId,
        @NotBlank String mensagem
) {
}
