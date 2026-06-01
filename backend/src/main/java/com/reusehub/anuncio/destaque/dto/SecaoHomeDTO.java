package com.reusehub.anuncio.destaque.dto;

import com.reusehub.anuncio.destaque.enums.ContextoDestaque;

import java.util.List;

/**
 * Uma secao renderizada na home. Cada secao ja vem com seus anuncios
 * populados (sem waterfall de requests) e com a URL "Ver todos" pronta
 * - toda a inteligencia de exibicao mora no backend.
 *
 * @param contexto       Estrategia usada para popular esta secao.
 * @param categoriaId    Categoria associada (null em POPULARES, RECENTES, RECOMENDADOS).
 * @param titulo         Texto exibido como cabecalho da secao.
 * @param linkVerTodos   URL relativa de "Ver todos" (null para esconder o botao).
 * @param anuncios       Lista ordenada de anuncios; sera omitida da resposta
 *                       de bootstrap caso venha vazia.
 */
public record SecaoHomeDTO(
        ContextoDestaque contexto,
        Integer categoriaId,
        String titulo,
        String linkVerTodos,
        List<AnuncioDestaqueDTO> anuncios
) {
}
