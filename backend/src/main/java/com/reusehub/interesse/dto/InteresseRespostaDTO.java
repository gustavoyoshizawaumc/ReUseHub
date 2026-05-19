package com.reusehub.interesse.dto;

import com.reusehub.interesse.model.InteresseTroca;

import java.time.LocalDateTime;
import java.util.UUID;

public record InteresseRespostaDTO(
        UUID id,
        UUID anuncioDesejadoId,
        String anuncioDesejadoTitulo,
        UUID interessadoId,
        String interessadoNome,
        UUID anuncioOferecidoId,
        String anuncioOferecidoTitulo,
        String mensagem,
        InteresseTroca.StatusInteresse status,
        LocalDateTime criadoEm,
        String conversaId
) {
}