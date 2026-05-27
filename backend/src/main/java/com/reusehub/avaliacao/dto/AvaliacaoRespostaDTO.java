package com.reusehub.avaliacao.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record AvaliacaoRespostaDTO(
        UUID id,
        UUID avaliadorId,
        String avaliadorNome,
        UUID avaliadoId,
        String avaliadoNome,
        UUID anuncioId,
        String anuncioTitulo,
        short nota,
        String comentario,
        LocalDateTime criadoEm
) {
}
