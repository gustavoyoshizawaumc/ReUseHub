package com.reusehub.chat.dto;

import jakarta.validation.constraints.NotBlank;

public record MensagemCriacaoDTO(
    @NotBlank(message = "ID da conversa é obrigatório")
    String conversaId,
    
    @NotBlank(message = "Conteúdo da mensagem não pode estar em branco")
    String conteudo
) {}