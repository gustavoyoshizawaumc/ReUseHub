package com.reusehub.moderacao.dto;

import com.reusehub.anuncio.model.Anuncio;

import java.util.List;
import java.util.UUID;

public record AnuncioSuspeitoDTO(
        UUID anuncioId,
        String titulo,
        String nomeUsuario,
        Anuncio.StatusAnuncio status,
        long denunciasAbertas,
        List<String> imagensUrls
) {
}
