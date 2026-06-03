package com.reusehub.anuncio.visualizacao.dto;

import com.reusehub.anuncio.visualizacao.enums.OrigemVisualizacao;

import java.util.UUID;

/**
 * Carrega tudo que o controller ja resolveu (autenticacao, headers, IP, body)
 * para o {@code RegistroVisualizacaoService} processar.
 *
 * <p>Todos os campos opcionais sao {@code String} nullable em vez de
 * {@code Optional}, seguindo a convencao da Anthropic e do projeto: records
 * DTO mantem nullable; chamadores convertem para Optional na borda quando
 * conveniente.
 *
 * @param anuncioId    Id do anuncio visualizado (obrigatorio).
 * @param origem       De onde veio a visualizacao (obrigatorio).
 * @param emailUsuario Email do usuario autenticado, ou {@code null} se anonimo.
 * @param anonId       UUID do client em localStorage, ou {@code null} se ausente.
 * @param ipAddress    IP do cliente extraido respeitando X-Forwarded-For.
 */
public record RegistroVisualizacaoComando(
        UUID anuncioId,
        OrigemVisualizacao origem,
        String emailUsuario,
        String anonId,
        String ipAddress
) {
}
