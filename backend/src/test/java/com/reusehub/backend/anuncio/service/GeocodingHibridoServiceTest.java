package com.reusehub.backend.anuncio.service;

import com.reusehub.anuncio.dto.ResultadoGeocoding;
import com.reusehub.anuncio.enums.PrecisaoLocalizacao;
import com.reusehub.anuncio.service.GeocodingHibridoService;
import com.reusehub.anuncio.service.TomTomGeocodingService;
import com.reusehub.anuncio.service.TomTomGeocodingService.Coordenadas;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes Unitarios de GeocodingHibridoService")
class GeocodingHibridoServiceTest {

    private static final String ENDERECO_VALIDO = "Avenida Paulista, 100, Bela Vista, Sao Paulo, SP, Brasil";
    private static final BigDecimal LATITUDE_PAULISTA = new BigDecimal("-23.5632188");
    private static final BigDecimal LONGITUDE_PAULISTA = new BigDecimal("-46.6542596");

    @Mock
    private TomTomGeocodingService tomTomGeocodingService;

    @InjectMocks
    private GeocodingHibridoService geocodingHibridoService;

    @Nested
    @DisplayName("Cenarios de obterCoordenadasPorEndereco")
    class ObterCoordenadasCenarios {

        @Test
        @DisplayName("deve devolver ENDERECO_GEOCODIFICADO quando TomTom encontrar coordenadas")
        void devolverGeocodificadoQuandoTomTomAcertar() {
            Mockito.when(tomTomGeocodingService.buscarCoordenadasPorEndereco(ENDERECO_VALIDO))
                    .thenReturn(Optional.of(new Coordenadas(LATITUDE_PAULISTA, LONGITUDE_PAULISTA)));

            ResultadoGeocoding resultado = geocodingHibridoService.obterCoordenadasPorEndereco(ENDERECO_VALIDO);

            assertEquals(PrecisaoLocalizacao.ENDERECO_GEOCODIFICADO, resultado.precisao());
            assertEquals(LATITUDE_PAULISTA, resultado.latitude());
            assertEquals(LONGITUDE_PAULISTA, resultado.longitude());
        }

        @Test
        @DisplayName("deve devolver INDEFINIDA quando TomTom nao encontrar (sem gravar 0,0)")
        void devolverIndefinidaQuandoTomTomFalhar() {
            Mockito.when(tomTomGeocodingService.buscarCoordenadasPorEndereco(Mockito.anyString()))
                    .thenReturn(Optional.empty());

            ResultadoGeocoding resultado = geocodingHibridoService.obterCoordenadasPorEndereco(
                    "Rua Inexistente XYZ, 999, Bairro Fantasma, Cidade Imaginaria, SP, Brasil"
            );

            assertEquals(PrecisaoLocalizacao.INDEFINIDA, resultado.precisao());
            assertNull(resultado.latitude(), "latitude deve ser null em INDEFINIDA (nunca (0,0))");
            assertNull(resultado.longitude(), "longitude deve ser null em INDEFINIDA (nunca (0,0))");
        }

        @Test
        @DisplayName("deve devolver INDEFINIDA quando endereco for null ou vazio")
        void devolverIndefinidaQuandoEnderecoForVazio() {
            ResultadoGeocoding resultadoNull = geocodingHibridoService.obterCoordenadasPorEndereco(null);
            ResultadoGeocoding resultadoVazio = geocodingHibridoService.obterCoordenadasPorEndereco("   ");

            assertEquals(PrecisaoLocalizacao.INDEFINIDA, resultadoNull.precisao());
            assertEquals(PrecisaoLocalizacao.INDEFINIDA, resultadoVazio.precisao());
            Mockito.verifyNoInteractions(tomTomGeocodingService);
        }
    }

    @Nested
    @DisplayName("Cenarios de cache")
    class CacheCenarios {

        @Test
        @DisplayName("deve consultar TomTom apenas uma vez quando o mesmo endereco e consultado N vezes")
        void cacheImpedeRequisicaoDuplicada() {
            Mockito.when(tomTomGeocodingService.buscarCoordenadasPorEndereco(ENDERECO_VALIDO))
                    .thenReturn(Optional.of(new Coordenadas(LATITUDE_PAULISTA, LONGITUDE_PAULISTA)));

            ResultadoGeocoding primeiro = geocodingHibridoService.obterCoordenadasPorEndereco(ENDERECO_VALIDO);
            ResultadoGeocoding segundo = geocodingHibridoService.obterCoordenadasPorEndereco(ENDERECO_VALIDO);
            ResultadoGeocoding terceiro = geocodingHibridoService.obterCoordenadasPorEndereco(ENDERECO_VALIDO);

            assertNotNull(primeiro.latitude());
            assertEquals(primeiro.latitude(), segundo.latitude());
            assertEquals(primeiro.latitude(), terceiro.latitude());
            Mockito.verify(tomTomGeocodingService, Mockito.times(1))
                    .buscarCoordenadasPorEndereco(ENDERECO_VALIDO);
        }

        @Test
        @DisplayName("deve cachear tambem resultados INDEFINIDA para evitar reconsulta de enderecos invalidos")
        void cacheEvitaReconsultaDeFalhas() {
            Mockito.when(tomTomGeocodingService.buscarCoordenadasPorEndereco(Mockito.anyString()))
                    .thenReturn(Optional.empty());

            String enderecoRuim = "Endereco que falha, 1, Bairro, Cidade, XX, Brasil";
            geocodingHibridoService.obterCoordenadasPorEndereco(enderecoRuim);
            geocodingHibridoService.obterCoordenadasPorEndereco(enderecoRuim);
            geocodingHibridoService.obterCoordenadasPorEndereco(enderecoRuim);

            Mockito.verify(tomTomGeocodingService, Mockito.times(1))
                    .buscarCoordenadasPorEndereco(enderecoRuim);
        }

        @Test
        @DisplayName("deve usar mesma chave para variacoes de caixa/espaco (normalizacao)")
        void normalizacaoUneEntradasEquivalentes() {
            Mockito.when(tomTomGeocodingService.buscarCoordenadasPorEndereco(Mockito.anyString()))
                    .thenReturn(Optional.of(new Coordenadas(LATITUDE_PAULISTA, LONGITUDE_PAULISTA)));

            geocodingHibridoService.obterCoordenadasPorEndereco("Rua X, 10, Bairro, Cidade, SP, Brasil");
            geocodingHibridoService.obterCoordenadasPorEndereco("   rua x, 10, bairro, cidade, sp, brasil  ");

            Mockito.verify(tomTomGeocodingService, Mockito.times(1))
                    .buscarCoordenadasPorEndereco(Mockito.anyString());
        }
    }

    @Nested
    @DisplayName("Helpers do ResultadoGeocoding")
    class ResultadoGeocodingHelpers {

        @Test
        @DisplayName("possuiCoordenadas e true quando geocodificado e false quando indefinido")
        void possuiCoordenadas() {
            assertTrue(ResultadoGeocoding.geocodificado(BigDecimal.ONE, BigDecimal.TEN).possuiCoordenadas());
            assertEquals(false, ResultadoGeocoding.indefinido().possuiCoordenadas());
        }
    }
}
