package com.reusehub.denuncia.dto;

import com.reusehub.denuncia.model.DenunciaAnuncio;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record DenunciaRespostaDTO(
        UUID id,
        UUID anuncioId,
        String tituloAnuncio,
        List<String> imagensUrls,
        String nomeAnunciante,
        String statusAnuncio,
        String tipoAnuncio,
        String categoriaAnuncio,
        UUID denuncianteId,
        String nomeDenunciante,
        String motivo,
        String descricao,
        DenunciaAnuncio.StatusDenuncia status,
        LocalDateTime criadoEm,
        long denunciasAbertasDoAnuncio
) {
}
