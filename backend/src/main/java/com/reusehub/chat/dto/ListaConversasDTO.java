package com.reusehub.chat.dto;

import java.time.LocalDateTime;
import java.util.List;

public record ListaConversasDTO(
    List<ConversaResumo> conversas
) {
    public record ConversaResumo(
        String id,
        String outroUsuarioId,
        String nomeOutroUsuario,
        String tituloAnuncio,
        String ultimaMensagem,
        LocalDateTime dataUltimaAtualizacao,
        long mensagensNaoLidas
    ) {}
}