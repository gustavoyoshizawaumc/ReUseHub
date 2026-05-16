package com.reusehub.chat.dto;

import java.time.LocalDateTime;
import java.util.List;

public record ConversaRespostaDTO(
    String id,
    String outroUsuarioId,
    String nomeOutroUsuario,
    String tituloAnuncio,
    List<MensagemDto> mensagens
) {
    public record MensagemDto(
        String conteudo,
        String remetente,
        LocalDateTime timestamp
    ) {}
}