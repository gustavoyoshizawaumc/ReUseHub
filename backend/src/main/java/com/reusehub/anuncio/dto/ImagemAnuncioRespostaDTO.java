package com.reusehub.anuncio.dto;

import com.reusehub.anuncio.model.ImagemAnuncio;

import java.util.UUID;

public record ImagemAnuncioRespostaDTO(
        UUID id,
        String urlImagem,
        Short ordemExibicao,
        Boolean capa
) {
    public static ImagemAnuncioRespostaDTO deEntidade(ImagemAnuncio imagem) {
        return new ImagemAnuncioRespostaDTO(
                imagem.getId(),
                imagem.getUrlImagem(),
                imagem.getOrdemExibicao(),
                imagem.getCapa()
        );
    }
}
