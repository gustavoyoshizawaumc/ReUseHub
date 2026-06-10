package com.reusehub.anuncio.destaque.dto;

import com.reusehub.anuncio.destaque.enums.TipoSelecaoCategoria;
import com.reusehub.anuncio.model.Categoria;

public record CategoriaEmDestaqueDTO(
        Integer id,
        String nome,
        String slug,
        TipoSelecaoCategoria tipoSelecao
) {
    public static CategoriaEmDestaqueDTO deEntidade(Categoria categoria, TipoSelecaoCategoria tipoSelecao) {
        return new CategoriaEmDestaqueDTO(
                categoria.getId(),
                categoria.getNome(),
                categoria.getSlug(),
                tipoSelecao
        );
    }
}
