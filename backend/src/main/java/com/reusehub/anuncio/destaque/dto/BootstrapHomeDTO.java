package com.reusehub.anuncio.destaque.dto;

import com.reusehub.anuncio.destaque.enums.CenarioHome;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/**
 * Receita completa para renderizar a home. Devolvida pelo endpoint
 * {@code GET /api/anuncios/destaques/bootstrap-home} em uma unica request.
 *
 * @param cenario             Cenario detectado para o usuario corrente.
 * @param categoriaEmDestaque Categoria escolhida (rotativa ou de interesse);
 *                            null quando nenhuma se aplica.
 * @param secoes              Lista de secoes ja populadas, na ordem de exibicao.
 *                            Secoes que viriam vazias sao omitidas pelo backend.
 * @param geradoEm            Timestamp UTC da geracao da resposta (debug/observabilidade).
 * @param dataRotacao         Data usada como semente da rotacao de categoria;
 *                            o cliente deve invalidar cache quando essa data mudar
 *                            (e nao comparar com a data local do browser).
 */
public record BootstrapHomeDTO(
        CenarioHome cenario,
        CategoriaEmDestaqueDTO categoriaEmDestaque,
        List<SecaoHomeDTO> secoes,
        Instant geradoEm,
        LocalDate dataRotacao
) {
}
