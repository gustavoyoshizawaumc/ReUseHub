package com.reusehub.moderacao.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record HistoricoModeracaoDTO(
        UUID id,
        UUID moderadorId,
        String nomeModerador,
        String acao,
        String alvoTipo,
        UUID alvoId,
        String detalhes,
        LocalDateTime criadoEm
) {
}
