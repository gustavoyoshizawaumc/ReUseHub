package com.reusehub.anuncio.destaque.dto;

import com.reusehub.anuncio.destaque.enums.ContextoDestaque;

import java.util.List;

public record SecaoHomeDTO(
        ContextoDestaque contexto,
        Integer categoriaId,
        String titulo,
        String linkVerTodos,
        List<AnuncioDestaqueDTO> anuncios
) {
}
