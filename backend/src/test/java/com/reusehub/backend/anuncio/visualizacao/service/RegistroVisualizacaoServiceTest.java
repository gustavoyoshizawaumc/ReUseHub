package com.reusehub.backend.anuncio.visualizacao.service;

import com.reusehub.anuncio.exception.RecursoNaoEncontradoException;
import com.reusehub.anuncio.model.Anuncio;
import com.reusehub.anuncio.repository.AnuncioRepository;
import com.reusehub.anuncio.visualizacao.dto.RegistroVisualizacaoComando;
import com.reusehub.anuncio.visualizacao.enums.OrigemVisualizacao;
import com.reusehub.anuncio.visualizacao.model.VisualizacaoAnuncio;
import com.reusehub.anuncio.visualizacao.repository.VisualizacaoAnuncioRepository;
import com.reusehub.anuncio.visualizacao.service.RegistroVisualizacaoService;
import com.reusehub.auth.model.Usuario;
import com.reusehub.auth.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Testes unitarios de {@link RegistroVisualizacaoService}.
 *
 * <p>Cobertura focada em comportamento observavel: descarte do dono,
 * dedupe nas tres camadas, persistencia da origem e incremento atomico
 * do contador no Anuncio.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Testes Unitarios de RegistroVisualizacaoService")
class RegistroVisualizacaoServiceTest {

    private static final UUID ANUNCIO_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID DONO_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");
    private static final UUID VISITANTE_ID = UUID.fromString("33333333-3333-3333-3333-333333333333");
    private static final String EMAIL_VISITANTE = "visitante@example.com";
    private static final String EMAIL_DONO = "dono@example.com";
    private static final String ANON_ID = "anon-uuid-abc";
    private static final String IP = "203.0.113.10";

    @Mock
    private VisualizacaoAnuncioRepository visualizacaoRepository;

    @Mock
    private AnuncioRepository anuncioRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @InjectMocks
    private RegistroVisualizacaoService service;

    private Anuncio anuncioFake;
    private Usuario donoFake;
    private Usuario visitanteFake;

    @BeforeEach
    void setUp() {
        donoFake = Usuario.builder().email(EMAIL_DONO).build();
        donoFake.setId(DONO_ID);

        visitanteFake = Usuario.builder().email(EMAIL_VISITANTE).build();
        visitanteFake.setId(VISITANTE_ID);

        anuncioFake = Anuncio.builder()
                .id(ANUNCIO_ID)
                .usuario(donoFake)
                .totalVisualizacoes(0)
                .build();
    }

    private RegistroVisualizacaoComando comando(String email, String anon, String ip) {
        return new RegistroVisualizacaoComando(
                ANUNCIO_ID, OrigemVisualizacao.CARD_HOME, email, anon, ip
        );
    }

    @Nested
    @DisplayName("Cenarios de descarte: anuncio inexistente / dono")
    class DescarteCenarios {

        @Test
        @DisplayName("lanca RecursoNaoEncontradoException quando anuncio nao existe")
        void anuncioInexistente() {
            when(anuncioRepository.findById(ANUNCIO_ID)).thenReturn(Optional.empty());

            assertThrows(RecursoNaoEncontradoException.class,
                    () -> service.registrarSeValido(comando(null, ANON_ID, IP)));

            verify(visualizacaoRepository, never()).save(any());
            verify(anuncioRepository, never()).incrementarTotalVisualizacoes(any());
        }

        @Test
        @DisplayName("descarta silenciosamente quando o solicitante e o dono do anuncio")
        void donoDescartado() {
            when(anuncioRepository.findById(ANUNCIO_ID)).thenReturn(Optional.of(anuncioFake));
            when(usuarioRepository.findByEmail(EMAIL_DONO)).thenReturn(Optional.of(donoFake));

            service.registrarSeValido(comando(EMAIL_DONO, ANON_ID, IP));

            verify(visualizacaoRepository, never()).save(any());
            verify(anuncioRepository, never()).incrementarTotalVisualizacoes(any());
        }
    }

    @Nested
    @DisplayName("Dedupe camada 1: usuario logado")
    class DedupeUsuarioLogadoCenarios {

        @Test
        @DisplayName("descarta quando ja existe visualizacao deste usuario neste anuncio em menos de 1h")
        void dedupeBloqueia() {
            when(anuncioRepository.findById(ANUNCIO_ID)).thenReturn(Optional.of(anuncioFake));
            when(usuarioRepository.findByEmail(EMAIL_VISITANTE)).thenReturn(Optional.of(visitanteFake));
            when(visualizacaoRepository.existsByUsuarioIdAndAnuncioIdAndVisualizadoEmAfter(
                    eq(VISITANTE_ID), eq(ANUNCIO_ID), any(LocalDateTime.class)
            )).thenReturn(true);

            service.registrarSeValido(comando(EMAIL_VISITANTE, ANON_ID, IP));

            verify(visualizacaoRepository, never()).save(any());
            verify(anuncioRepository, never()).incrementarTotalVisualizacoes(any());
        }

        @Test
        @DisplayName("persiste quando nao ha visualizacao recente do usuario neste anuncio")
        void dedupeLiberaPrimeira() {
            when(anuncioRepository.findById(ANUNCIO_ID)).thenReturn(Optional.of(anuncioFake));
            when(usuarioRepository.findByEmail(EMAIL_VISITANTE)).thenReturn(Optional.of(visitanteFake));
            when(visualizacaoRepository.existsByUsuarioIdAndAnuncioIdAndVisualizadoEmAfter(
                    eq(VISITANTE_ID), eq(ANUNCIO_ID), any(LocalDateTime.class)
            )).thenReturn(false);

            service.registrarSeValido(comando(EMAIL_VISITANTE, ANON_ID, IP));

            verify(visualizacaoRepository, times(1)).save(any());
            verify(anuncioRepository, times(1)).incrementarTotalVisualizacoes(ANUNCIO_ID);
        }
    }

    @Nested
    @DisplayName("Dedupe camada 2: anonimo identificado")
    class DedupeAnonimoCenarios {

        @Test
        @DisplayName("usa anon_id quando nao ha usuario logado")
        void anonIdComoChave() {
            when(anuncioRepository.findById(ANUNCIO_ID)).thenReturn(Optional.of(anuncioFake));
            when(visualizacaoRepository.existsByAnonIdAndAnuncioIdAndVisualizadoEmAfter(
                    eq(ANON_ID), eq(ANUNCIO_ID), any(LocalDateTime.class)
            )).thenReturn(false);

            service.registrarSeValido(comando(null, ANON_ID, IP));

            // confirma que NAO consultou camada 1 (sem usuario)
            verify(visualizacaoRepository, never())
                    .existsByUsuarioIdAndAnuncioIdAndVisualizadoEmAfter(any(), any(), any());
            verify(visualizacaoRepository, times(1)).save(any());
            verify(anuncioRepository, times(1)).incrementarTotalVisualizacoes(ANUNCIO_ID);
        }

        @Test
        @DisplayName("bloqueia quando ja existe visualizacao do mesmo anon_id em menos de 1h")
        void dedupeAnonimoBloqueia() {
            when(anuncioRepository.findById(ANUNCIO_ID)).thenReturn(Optional.of(anuncioFake));
            when(visualizacaoRepository.existsByAnonIdAndAnuncioIdAndVisualizadoEmAfter(
                    eq(ANON_ID), eq(ANUNCIO_ID), any(LocalDateTime.class)
            )).thenReturn(true);

            service.registrarSeValido(comando(null, ANON_ID, IP));

            verify(visualizacaoRepository, never()).save(any());
            verify(anuncioRepository, never()).incrementarTotalVisualizacoes(any());
        }
    }

    @Nested
    @DisplayName("Dedupe camada 3: fallback por IP")
    class DedupeIpCenarios {

        @Test
        @DisplayName("usa IP quando nao ha JWT nem anon_id")
        void ipComoChave() {
            when(anuncioRepository.findById(ANUNCIO_ID)).thenReturn(Optional.of(anuncioFake));
            when(visualizacaoRepository.existsByIpAddressAndAnuncioIdAndVisualizadoEmAfter(
                    eq(IP), eq(ANUNCIO_ID), any(LocalDateTime.class)
            )).thenReturn(false);

            service.registrarSeValido(comando(null, null, IP));

            verify(visualizacaoRepository, never())
                    .existsByUsuarioIdAndAnuncioIdAndVisualizadoEmAfter(any(), any(), any());
            verify(visualizacaoRepository, never())
                    .existsByAnonIdAndAnuncioIdAndVisualizadoEmAfter(anyString(), any(), any());
            verify(visualizacaoRepository, times(1)).save(any());
        }

        @Test
        @DisplayName("bloqueia quando ja existe visualizacao do mesmo IP em menos de 1h")
        void dedupeIpBloqueia() {
            when(anuncioRepository.findById(ANUNCIO_ID)).thenReturn(Optional.of(anuncioFake));
            when(visualizacaoRepository.existsByIpAddressAndAnuncioIdAndVisualizadoEmAfter(
                    eq(IP), eq(ANUNCIO_ID), any(LocalDateTime.class)
            )).thenReturn(true);

            service.registrarSeValido(comando(null, null, IP));

            verify(visualizacaoRepository, never()).save(any());
            verify(anuncioRepository, never()).incrementarTotalVisualizacoes(any());
        }
    }

    @Nested
    @DisplayName("Persistencia do registro")
    class PersistenciaCenarios {

        @Test
        @DisplayName("persiste a origem exatamente como recebida no comando")
        void origemPersistida() {
            when(anuncioRepository.findById(ANUNCIO_ID)).thenReturn(Optional.of(anuncioFake));
            when(visualizacaoRepository.existsByAnonIdAndAnuncioIdAndVisualizadoEmAfter(any(), any(), any()))
                    .thenReturn(false);

            service.registrarSeValido(new RegistroVisualizacaoComando(
                    ANUNCIO_ID, OrigemVisualizacao.FAVORITO, null, ANON_ID, IP
            ));

            ArgumentCaptor<VisualizacaoAnuncio> captor = ArgumentCaptor.forClass(VisualizacaoAnuncio.class);
            verify(visualizacaoRepository).save(captor.capture());
            VisualizacaoAnuncio persistido = captor.getValue();
            assertEquals(OrigemVisualizacao.FAVORITO, persistido.getOrigem());
            assertEquals(IP, persistido.getIpAddress());
            assertEquals(ANON_ID, persistido.getAnonId());
            assertNull(persistido.getUsuario(), "usuario deve ser null para visitante anonimo");
            assertNotNull(persistido.getAnuncio());
        }

        @Test
        @DisplayName("nao persiste anon_id quando ha usuario logado (mantem registro limpo)")
        void anonIdIgnoradoQuandoLogado() {
            when(anuncioRepository.findById(ANUNCIO_ID)).thenReturn(Optional.of(anuncioFake));
            when(usuarioRepository.findByEmail(EMAIL_VISITANTE)).thenReturn(Optional.of(visitanteFake));
            when(visualizacaoRepository.existsByUsuarioIdAndAnuncioIdAndVisualizadoEmAfter(any(), any(), any()))
                    .thenReturn(false);

            service.registrarSeValido(comando(EMAIL_VISITANTE, ANON_ID, IP));

            ArgumentCaptor<VisualizacaoAnuncio> captor = ArgumentCaptor.forClass(VisualizacaoAnuncio.class);
            verify(visualizacaoRepository).save(captor.capture());
            VisualizacaoAnuncio persistido = captor.getValue();
            assertEquals(visitanteFake, persistido.getUsuario());
            assertNull(persistido.getAnonId(), "anon_id nao deve duplicar quando ha usuario_id");
            assertEquals(IP, persistido.getIpAddress(), "IP continua persistido para observabilidade");
        }

        @Test
        @DisplayName("incrementa Anuncio.totalVisualizacoes exatamente uma vez por visualizacao valida")
        void contadorIncrementadoUmaVez() {
            when(anuncioRepository.findById(ANUNCIO_ID)).thenReturn(Optional.of(anuncioFake));
            when(visualizacaoRepository.existsByAnonIdAndAnuncioIdAndVisualizadoEmAfter(any(), any(), any()))
                    .thenReturn(false);

            service.registrarSeValido(comando(null, ANON_ID, IP));

            verify(anuncioRepository, times(1)).incrementarTotalVisualizacoes(ANUNCIO_ID);
        }
    }
}
