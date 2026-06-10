package com.reusehub.backend.anuncio.service;

import com.reusehub.anuncio.dto.BuscaFiltroDTO;
import com.reusehub.anuncio.dto.ResultadoGeocoding;
import com.reusehub.anuncio.exception.OperacaoInvalidaException;
import com.reusehub.anuncio.exception.RecursoNaoEncontradoException;
import com.reusehub.anuncio.model.Endereco;
import com.reusehub.anuncio.repository.EnderecoRepository;
import com.reusehub.anuncio.service.GeocodingHibridoService;
import com.reusehub.anuncio.service.LocalizacaoService;
import com.reusehub.anuncio.service.ViaCepService;
import com.reusehub.auth.model.Usuario;
import com.reusehub.auth.repository.UsuarioRepository;
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
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes Unitarios de LocalizacaoService")
class LocalizacaoServiceTest {

    private static final String EMAIL_USUARIO = "usuario@reusehub.com";
    private static final String CEP = "01001-000";
    private static final Double RAIO_PADRAO_KM = 10.0;

    // Endereco textual que a busca DEVE enviar ao geocoder: completo, com rua, no mesmo
    // formato da criacao do anuncio (DadosCEP#paraEnderecoCompleto). Garante que o centro
    // da busca por raio saia do mesmo provider/precisao dos anuncios geocodificados.
    private static final ViaCepService.DadosCEP DADOS_CEP = new ViaCepService.DadosCEP(
            CEP, "Rua A", "Bairro B", "Cidade C", "SP"
    );
    private static final String ENDERECO_COMPLETO_ESPERADO = "Rua A, Bairro B, Cidade C, SP, Brasil";

    private static final BigDecimal LATITUDE = new BigDecimal("-23.55");
    private static final BigDecimal LONGITUDE = new BigDecimal("-46.63");

    @Mock
    private ViaCepService viaCepService;
    @Mock
    private GeocodingHibridoService geocodingHibridoService;
    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private EnderecoRepository enderecoRepository;

    @InjectMocks
    private LocalizacaoService localizacaoService;

    @Nested
    @DisplayName("Resolucao por CEP informado")
    class CepInformado {

        @Test
        @DisplayName("deve geocodificar o CEP via TomTom (endereco completo com rua) e aplicar o raio padrao")
        void geocodificaViaTomTomEAplicaRaioPadrao() {
            Mockito.when(viaCepService.buscarDadosCEP(CEP)).thenReturn(DADOS_CEP);
            Mockito.when(geocodingHibridoService.obterCoordenadasPorEndereco(Mockito.anyString()))
                    .thenReturn(ResultadoGeocoding.geocodificado(LATITUDE, LONGITUDE));

            BuscaFiltroDTO filtro = new BuscaFiltroDTO();
            filtro.setCep(CEP);

            localizacaoService.resolverLocalizacaoEmCascata(filtro, null);

            assertEquals(LATITUDE.doubleValue(), filtro.getLatitude());
            assertEquals(LONGITUDE.doubleValue(), filtro.getLongitude());
            assertEquals(RAIO_PADRAO_KM, filtro.getRaioKm());
            Mockito.verify(geocodingHibridoService).obterCoordenadasPorEndereco(ENDERECO_COMPLETO_ESPERADO);
        }

        @Test
        @DisplayName("deve preservar o raio informado pelo usuario em vez de sobrescrever com o padrao")
        void preservaRaioInformado() {
            Mockito.when(viaCepService.buscarDadosCEP(CEP)).thenReturn(DADOS_CEP);
            Mockito.when(geocodingHibridoService.obterCoordenadasPorEndereco(Mockito.anyString()))
                    .thenReturn(ResultadoGeocoding.geocodificado(LATITUDE, LONGITUDE));

            BuscaFiltroDTO filtro = new BuscaFiltroDTO();
            filtro.setCep(CEP);
            filtro.setRaioKm(25.0);

            localizacaoService.resolverLocalizacaoEmCascata(filtro, null);

            assertEquals(25.0, filtro.getRaioKm());
        }

        @Test
        @DisplayName("nao deve gravar coordenadas quando o geocoding for INDEFINIDO (nunca (0,0))")
        void naoGravaCoordenadasQuandoGeocodingIndefinido() {
            Mockito.when(viaCepService.buscarDadosCEP(CEP)).thenReturn(DADOS_CEP);
            Mockito.when(geocodingHibridoService.obterCoordenadasPorEndereco(Mockito.anyString()))
                    .thenReturn(ResultadoGeocoding.indefinido());

            BuscaFiltroDTO filtro = new BuscaFiltroDTO();
            filtro.setCep(CEP);

            localizacaoService.resolverLocalizacaoEmCascata(filtro, null);

            assertNull(filtro.getLatitude(), "latitude deve permanecer null em geocoding INDEFINIDO");
            assertNull(filtro.getLongitude(), "longitude deve permanecer null em geocoding INDEFINIDO");
            // A busca prossegue sem filtro geografico; o raio padrao ainda e preenchido.
            assertEquals(RAIO_PADRAO_KM, filtro.getRaioKm());
        }

        @Test
        @DisplayName("deve degradar sem quebrar quando o ViaCEP lanca OperacaoInvalidaException")
        void degradaQuandoViaCepLancaOperacaoInvalida() {
            Mockito.when(viaCepService.buscarDadosCEP(CEP))
                    .thenThrow(new OperacaoInvalidaException("Formato de CEP invalido"));

            BuscaFiltroDTO filtro = new BuscaFiltroDTO();
            filtro.setCep(CEP);

            assertDoesNotThrow(() -> localizacaoService.resolverLocalizacaoEmCascata(filtro, null));

            assertNull(filtro.getLatitude());
            assertNull(filtro.getLongitude());
            Mockito.verifyNoInteractions(geocodingHibridoService);
        }

        @Test
        @DisplayName("deve degradar sem quebrar quando o CEP nao e encontrado (RecursoNaoEncontradoException)")
        void degradaQuandoCepNaoEncontrado() {
            Mockito.when(viaCepService.buscarDadosCEP(CEP))
                    .thenThrow(new RecursoNaoEncontradoException("CEP", CEP));

            BuscaFiltroDTO filtro = new BuscaFiltroDTO();
            filtro.setCep(CEP);

            assertDoesNotThrow(() -> localizacaoService.resolverLocalizacaoEmCascata(filtro, null));

            assertNull(filtro.getLatitude());
            Mockito.verifyNoInteractions(geocodingHibridoService);
        }
    }

    @Nested
    @DisplayName("Coordenadas ja presentes no filtro")
    class CoordenadasPresentes {

        @Test
        @DisplayName("nao deve consultar ViaCEP/geocoder/repositorios quando o filtro ja tem coordenadas")
        void naoConsultaServicosExternosQuandoJaTemCoordenadas() {
            BuscaFiltroDTO filtro = new BuscaFiltroDTO();
            filtro.setLatitude(LATITUDE.doubleValue());
            filtro.setLongitude(LONGITUDE.doubleValue());

            localizacaoService.resolverLocalizacaoEmCascata(filtro, EMAIL_USUARIO);

            assertEquals(RAIO_PADRAO_KM, filtro.getRaioKm());
            Mockito.verifyNoInteractions(
                    viaCepService, geocodingHibridoService, usuarioRepository, enderecoRepository
            );
        }
    }

    @Nested
    @DisplayName("Fallback por endereco principal do usuario")
    class EnderecoPrincipal {

        @Test
        @DisplayName("deve usar o endereco principal quando nao ha CEP nem coordenadas no filtro")
        void usaEnderecoPrincipalQuandoNaoHaCepNemCoordenadas() {
            Usuario usuario = novoUsuario();
            Endereco principal = Endereco.builder()
                    .latitude(LATITUDE)
                    .longitude(LONGITUDE)
                    .build();

            Mockito.when(usuarioRepository.findByEmail(EMAIL_USUARIO)).thenReturn(Optional.of(usuario));
            Mockito.when(enderecoRepository.findFirstByUsuarioIdAndPrincipalTrue(Mockito.any()))
                    .thenReturn(Optional.of(principal));

            BuscaFiltroDTO filtro = new BuscaFiltroDTO();

            localizacaoService.resolverLocalizacaoEmCascata(filtro, EMAIL_USUARIO);

            assertEquals(LATITUDE.doubleValue(), filtro.getLatitude());
            assertEquals(LONGITUDE.doubleValue(), filtro.getLongitude());
            assertEquals(RAIO_PADRAO_KM, filtro.getRaioKm());
            Mockito.verifyNoInteractions(viaCepService, geocodingHibridoService);
        }

        @Test
        @DisplayName("deve ignorar endereco principal com coordenadas (0,0) (lixo legado)")
        void ignoraEnderecoPrincipalComCoordenadasZero() {
            Usuario usuario = novoUsuario();
            Endereco principal = Endereco.builder()
                    .latitude(BigDecimal.ZERO)
                    .longitude(BigDecimal.ZERO)
                    .build();

            Mockito.when(usuarioRepository.findByEmail(EMAIL_USUARIO)).thenReturn(Optional.of(usuario));
            Mockito.when(enderecoRepository.findFirstByUsuarioIdAndPrincipalTrue(Mockito.any()))
                    .thenReturn(Optional.of(principal));

            BuscaFiltroDTO filtro = new BuscaFiltroDTO();

            localizacaoService.resolverLocalizacaoEmCascata(filtro, EMAIL_USUARIO);

            assertNull(filtro.getLatitude());
            assertNull(filtro.getLongitude());
            assertNull(filtro.getRaioKm(), "sem coordenadas validas nao deve aplicar raio");
        }

        @Test
        @DisplayName("nao deve fazer nada quando nao ha CEP, coordenadas nem email")
        void naoFazNadaSemContextoGeografico() {
            BuscaFiltroDTO filtro = new BuscaFiltroDTO();

            localizacaoService.resolverLocalizacaoEmCascata(filtro, null);

            assertNull(filtro.getLatitude());
            assertNull(filtro.getRaioKm());
            Mockito.verifyNoInteractions(
                    viaCepService, geocodingHibridoService, usuarioRepository, enderecoRepository
            );
        }
    }

    @Nested
    @DisplayName("converterCepEmCoordenadas")
    class ConverterCepEmCoordenadas {

        @Test
        @DisplayName("deve montar o endereco completo (com rua) e delegar ao GeocodingHibridoService")
        void montaEnderecoCompletoComRuaEDelega() {
            Mockito.when(viaCepService.buscarDadosCEP(CEP)).thenReturn(DADOS_CEP);
            Mockito.when(geocodingHibridoService.obterCoordenadasPorEndereco(Mockito.anyString()))
                    .thenReturn(ResultadoGeocoding.geocodificado(LATITUDE, LONGITUDE));

            ResultadoGeocoding resultado = localizacaoService.converterCepEmCoordenadas(CEP);

            assertTrue(resultado.possuiCoordenadas());
            Mockito.verify(geocodingHibridoService).obterCoordenadasPorEndereco(ENDERECO_COMPLETO_ESPERADO);
        }
    }

    private Usuario novoUsuario() {
        Usuario usuario = new Usuario();
        usuario.setEmail(EMAIL_USUARIO);
        try {
            usuario.setId(UUID.randomUUID());
        } catch (Exception ignored) {
            // setId pode ter visibilidade restrita em algumas versoes do modelo; id real
            // e irrelevante aqui porque o lookup do endereco e mockado com any().
        }
        return usuario;
    }
}
