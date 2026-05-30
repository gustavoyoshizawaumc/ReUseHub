package com.reusehub.anuncio.dto;

import com.reusehub.anuncio.model.Categoria;

public record CategoriaRespostaDTO(
        Integer id,
        String nome,
        String slug,
        String urlIcone,
        Integer categoriaPaiId
) {

    public static CategoriaRespostaDTO deEntidade(Categoria categoria) {
        return new CategoriaRespostaDTO(
                categoria.getId(),
                categoria.getNome(),
                categoria.getSlug(),
                categoria.getUrlIcone(),
                categoria.getCategoriaPaiId()
        );
    }
}
