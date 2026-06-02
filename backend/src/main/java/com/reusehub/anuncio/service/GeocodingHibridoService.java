package com.reusehub.anuncio.service;

import com.reusehub.anuncio.dto.ResultadoGeocoding;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Orquestra a obtencao de coordenadas geograficas a partir de um endereco completo.
 *
 * <p>Estrategia atual (PR E.2):
 * <ol>
 *   <li>Verifica cache em memoria por chave normalizada — evita chamadas redundantes
 *       quando varios anuncios sao criados no mesmo CEP+numero.</li>
 *   <li>Chama o {@link TomTomGeocodingService} (fonte unica nessa fase).</li>
 *   <li>Se TomTom devolver coordenadas: {@code ResultadoGeocoding.geocodificado(...)}.</li>
 *   <li>Se nao devolver: {@code ResultadoGeocoding.indefinido()} + log de warning para
 *       observabilidade. <strong>Nunca</strong> retorna (0,0).</li>
 * </ol>
 *
 * <p>Por que cache local e nao Redis: volume de geocoding e baixo (criacao de anuncios
 * isoladas no tempo), poucos ganhos justificariam infra extra. {@code ConcurrentHashMap}
 * tem custo zero e atende. Quando o volume justificar, basta trocar a implementacao do
 * cache sem mexer nos consumidores.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GeocodingHibridoService {

    private final TomTomGeocodingService tomTomGeocodingService;

    /**
     * Cache em memoria de resultados ja obtidos.
     * Chave: endereco textual normalizado (mesmo string enviada ao geocoder).
     * Valor: resultado (inclui INDEFINIDA para evitar repetir chamada que ja falhou).
     */
    private final Map<String, ResultadoGeocoding> cacheDeResultados = new ConcurrentHashMap<>();

    public ResultadoGeocoding obterCoordenadasPorEndereco(String enderecoCompleto) {
        String chave = normalizar(enderecoCompleto);
        if (chave.isEmpty()) {
            return ResultadoGeocoding.indefinido();
        }

        ResultadoGeocoding emCache = cacheDeResultados.get(chave);
        if (emCache != null) {
            return emCache;
        }

        ResultadoGeocoding resultado = consultarGeocoder(enderecoCompleto);
        cacheDeResultados.put(chave, resultado);
        return resultado;
    }

    private ResultadoGeocoding consultarGeocoder(String enderecoCompleto) {
        Optional<TomTomGeocodingService.Coordenadas> coordenadas =
                tomTomGeocodingService.buscarCoordenadasPorEndereco(enderecoCompleto);

        if (coordenadas.isEmpty()) {
            log.warn("Geocoding indefinido para endereco '{}': nenhum provider retornou coordenadas",
                    enderecoCompleto);
            return ResultadoGeocoding.indefinido();
        }

        TomTomGeocodingService.Coordenadas coord = coordenadas.get();
        return ResultadoGeocoding.geocodificado(coord.latitude(), coord.longitude());
    }

    private String normalizar(String texto) {
        return texto == null ? "" : texto.trim().toLowerCase();
    }
}
