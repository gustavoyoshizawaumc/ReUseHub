package com.reusehub.chat.dto;

import jakarta.validation.constraints.NotBlank;

public record IniciarConversaDTO(
    @NotBlank(message = "ID do anúncio é obrigatório")
    String anuncioId,

    @NotBlank(message = "ID do destinatário é obrigatório")
    String destinatarioId
) {}
