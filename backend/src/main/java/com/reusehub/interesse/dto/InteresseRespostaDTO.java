package com.reusehub.interesse.dto;

import com.reusehub.anuncio.model.Anuncio;
import com.reusehub.interesse.model.InteresseTroca;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record InteresseRespostaDTO(
        UUID id,
        UUID anuncioDesejadoId,
        String anuncioDesejadoTitulo,
        String anuncioDesejadoImagemUrl,
        Anuncio.StatusAnuncio anuncioDesejadoStatus,
        UUID interessadoId,
        String interessadoNome,
        String interessadoAvatarUrl,
        BigDecimal interessadoNotaReputacao,
        UUID anuncioOferecidoId,
        String anuncioOferecidoTitulo,
        String anuncioOferecidoImagemUrl,
        String mensagem,
        InteresseTroca.StatusInteresse status,
        LocalDateTime criadoEm,
        LocalDateTime entreguePeloDonoEm,
        LocalDateTime recebimentoConfirmadoEm,
        boolean donoJaAvaliou,
        String conversaId
) {
}
