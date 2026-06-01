package com.reusehub.anuncio.destaque.dto;

import com.reusehub.anuncio.destaque.enums.TipoSelecaoCategoria;
import com.reusehub.anuncio.model.Categoria;

/**
 * Categoria escolhida pelo backend para a secao de "Mais procurados" da home.
 * O campo {@code tipoSelecao} permite que o frontend renderize o titulo da
 * secao de forma diferente (ex.: "Baseado no seu interesse" vs.
 * "Mais procurados em ...").
 */
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
