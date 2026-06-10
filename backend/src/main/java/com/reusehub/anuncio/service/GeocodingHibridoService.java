package com.reusehub.anuncio.service;

import com.reusehub.anuncio.dto.ResultadoGeocoding;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class GeocodingHibridoService {

    private final TomTomGeocodingService tomTomGeocodingService;

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
