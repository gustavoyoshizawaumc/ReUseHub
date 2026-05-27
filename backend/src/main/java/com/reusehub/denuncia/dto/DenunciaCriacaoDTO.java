package com.reusehub.denuncia.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record DenunciaCriacaoDTO(
        @NotNull UUID anuncioId,
        @NotBlank String motivo,
        String descricao
) {
}
