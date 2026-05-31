package com.reusehub.anuncio.dto;

import com.reusehub.anuncio.model.ImagemAnuncio;

import java.util.UUID;

/**
 * Representacao de uma imagem do anuncio na camada de resposta da API.
 * Expor o id e necessario para o frontend distinguir imagens existentes
 * (que podem ser mantidas/removidas) das novas (enviadas como Multipart).
 */
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
