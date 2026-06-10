package com.reusehub.backend.moderacao.service;

import com.reusehub.anuncio.exception.RegraNegocioException;
import com.reusehub.anuncio.model.Anuncio;
import com.reusehub.anuncio.repository.AnuncioRepository;
import com.reusehub.anuncio.repository.ImagemAnuncioRepository;
import com.reusehub.auth.model.Perfil;
import com.reusehub.auth.model.Usuario;
import com.reusehub.auth.repository.UsuarioRepository;
import com.reusehub.avaliacao.model.Avaliacao;
import com.reusehub.avaliacao.repository.AvaliacaoRepository;
import com.reusehub.denuncia.dto.DenunciaCriacaoDTO;
import com.reusehub.denuncia.dto.DenunciaRespostaDTO;
import com.reusehub.denuncia.model.DenunciaAnuncio;
import com.reusehub.denuncia.repository.DenunciaAnuncioRepository;
import com.reusehub.interesse.model.InteresseTroca;
import com.reusehub.interesse.repository.InteresseTrocaRepository;
import com.reusehub.moderacao.repository.HistoricoModeracaoRepository;
import com.reusehub.moderacao.service.ModeracaoService;
import com.reusehub.notificacao.service.NotificacaoService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes Unitarios de ModeracaoService")
class ModeracaoServiceTest {

    private static final String EMAIL_DENUNCIANTE = "denunciante@reusehub.com";
    private static final String EMAIL_DONO_ANUNCIO = "dono@reusehub.com";
    private static final String MOTIVO_PADRAO = "CONTEUDO_INAPROPRIADO";
    private static final String DESCRICAO_PADRAO = "Descricao da denuncia para teste.";

    @Mock private UsuarioRepository usuarioRepository;
    @Mock private AnuncioRepository anuncioRepository;
    @Mock private ImagemAnuncioRepository imagemAnuncioRepository;
    @Mock private DenunciaAnuncioRepository denunciaRepository;
    @Mock private HistoricoModeracaoRepository historicoRepository;
    @Mock private AvaliacaoRepository avaliacaoRepository;
    @Mock private NotificacaoService notificacaoService;
    @Mock private InteresseTrocaRepository interesseTrocaRepository;

    @InjectMocks
    private ModeracaoService moderacaoService;

    private Usuario denunciante;
    private Usuario donoAnuncio;
    private Anuncio anuncioAlheio;

    @BeforeEach
    void prepararCenario() {
        denunciante = construirUsuario(EMAIL_DENUNCIANTE);
        donoAnuncio = construirUsuario(EMAIL_DONO_ANUNCIO);
        anuncioAlheio = construirAnuncioDe(donoAnuncio);
    }

    @Nested
    @DisplayName("Cenarios para criarDenuncia")
    class CriarDenunciaCenarios {

        @Test
        @DisplayName("deve criar denuncia com sucesso quando regras forem atendidas")
        void criarComSucesso() {
            DenunciaCriacaoDTO dto = novoDtoDenuncia(anuncioAlheio.getId());

            Mockito.when(usuarioRepository.findByEmail(EMAIL_DENUNCIANTE))
                    .thenReturn(Optional.of(denunciante));
            Mockito.when(anuncioRepository.findById(anuncioAlheio.getId()))
                    .thenReturn(Optional.of(anuncioAlheio));
            Mockito.when(denunciaRepository.existsByDenuncianteIdAndAnuncioId(
                    denunciante.getId(), anuncioAlheio.getId()
            )).thenReturn(false);
            Mockito.when(denunciaRepository.save(Mockito.any(DenunciaAnuncio.class)))
                    .thenAnswer(invocacao -> invocacao.getArgument(0));

            DenunciaRespostaDTO resultado = moderacaoService.criarDenuncia(EMAIL_DENUNCIANTE, dto);

            assertNotNull(resultado);
            Mockito.verify(denunciaRepository).save(Mockito.any(DenunciaAnuncio.class));
        }

        @Test
        @DisplayName("deve estourar RegraNegocioException ao tentar denunciar o proprio anuncio")
        void erroAoDenunciarProprioAnuncio() {
            Anuncio anuncioProprio = construirAnuncioDe(denunciante);
            DenunciaCriacaoDTO dto = novoDtoDenuncia(anuncioProprio.getId());

            Mockito.when(usuarioRepository.findByEmail(EMAIL_DENUNCIANTE))
                    .thenReturn(Optional.of(denunciante));
            Mockito.when(anuncioRepository.findById(anuncioProprio.getId()))
                    .thenReturn(Optional.of(anuncioProprio));

            RegraNegocioException erro = assertThrows(RegraNegocioException.class,
                    () -> moderacaoService.criarDenuncia(EMAIL_DENUNCIANTE, dto));

            assertEquals("Voce nao pode denunciar o proprio anuncio.", erro.getMessage());
            Mockito.verify(denunciaRepository, Mockito.never()).save(Mockito.any());
        }

        @Test
        @DisplayName("deve estourar RegraNegocioException ao tentar denunciar o mesmo anuncio duas vezes")
        void erroAoDenunciarMesmoAnuncioDuasVezes() {
            DenunciaCriacaoDTO dto = novoDtoDenuncia(anuncioAlheio.getId());

            Mockito.when(usuarioRepository.findByEmail(EMAIL_DENUNCIANTE))
                    .thenReturn(Optional.of(denunciante));
            Mockito.when(anuncioRepository.findById(anuncioAlheio.getId()))
                    .thenReturn(Optional.of(anuncioAlheio));
            Mockito.when(denunciaRepository.existsByDenuncianteIdAndAnuncioId(
                    denunciante.getId(), anuncioAlheio.getId()
            )).thenReturn(true);

            RegraNegocioException erro = assertThrows(RegraNegocioException.class,
                    () -> moderacaoService.criarDenuncia(EMAIL_DENUNCIANTE, dto));

            assertEquals("Voce ja denunciou este anuncio.", erro.getMessage());
            Mockito.verify(denunciaRepository, Mockito.never()).save(Mockito.any());
        }
    }

    @Nested
    @DisplayName("Cenarios para resolucao por anuncio (resolver junto)")
    class ResolucaoPorAnuncioCenarios {

        @Test
        @DisplayName("descartar deve fechar TODAS as denuncias abertas do anuncio")
        void descartarFechaTodasDoAnuncio() {
            Usuario moderador = construirModerador();
            DenunciaAnuncio d1 = construirDenunciaAberta();
            DenunciaAnuncio d2 = construirDenunciaAberta();

            Mockito.when(usuarioRepository.findByEmail(moderador.getEmail())).thenReturn(Optional.of(moderador));
            Mockito.when(denunciaRepository.findById(d1.getId())).thenReturn(Optional.of(d1));
            Mockito.when(denunciaRepository.findByAnuncioIdAndStatus(
                    anuncioAlheio.getId(), DenunciaAnuncio.StatusDenuncia.ABERTA
            )).thenReturn(List.of(d1, d2));

            moderacaoService.descartarDenuncia(d1.getId(), moderador.getEmail(), "Improcedente.");

            assertEquals(DenunciaAnuncio.StatusDenuncia.DESCARTADA, d1.getStatus());
            assertEquals(DenunciaAnuncio.StatusDenuncia.DESCARTADA, d2.getStatus());
            Mockito.verify(denunciaRepository).saveAll(Mockito.anyList());
        }

        @Test
        @DisplayName("suspender deve suspender o anuncio e fechar todas as denuncias abertas dele")
        void suspenderFechaTodasDoAnuncio() {
            Usuario moderador = construirModerador();
            DenunciaAnuncio d1 = construirDenunciaAberta();
            DenunciaAnuncio d2 = construirDenunciaAberta();
            InteresseTroca pendente = construirInteresse(InteresseTroca.StatusInteresse.PENDENTE);
            InteresseTroca aceito = construirInteresse(InteresseTroca.StatusInteresse.ACEITO);

            Mockito.when(usuarioRepository.findByEmail(moderador.getEmail())).thenReturn(Optional.of(moderador));
            Mockito.when(denunciaRepository.findById(d1.getId())).thenReturn(Optional.of(d1));
            Mockito.when(denunciaRepository.findByAnuncioIdAndStatus(
                    anuncioAlheio.getId(), DenunciaAnuncio.StatusDenuncia.ABERTA
            )).thenReturn(List.of(d1, d2));
            Mockito.when(interesseTrocaRepository.findByAnuncioDesejadoIdAndStatusInOrderByCriadoEmDesc(
                    Mockito.eq(anuncioAlheio.getId()), Mockito.anyList()
            )).thenReturn(List.of(pendente, aceito));

            moderacaoService.suspenderAnuncioPorDenuncia(d1.getId(), moderador.getEmail(), "Conteudo proibido.");

            assertEquals(Anuncio.StatusAnuncio.SUSPENSO, anuncioAlheio.getStatus());
            assertEquals(DenunciaAnuncio.StatusDenuncia.ANALISADA, d1.getStatus());
            assertEquals(DenunciaAnuncio.StatusDenuncia.ANALISADA, d2.getStatus());
            assertEquals(InteresseTroca.StatusInteresse.CANCELADO, pendente.getStatus());
            assertEquals(InteresseTroca.StatusInteresse.CANCELADO, aceito.getStatus());
            assertNotNull(pendente.getCanceladoEm());
            assertNotNull(aceito.getCanceladoEm());
            Mockito.verify(interesseTrocaRepository).saveAll(List.of(pendente, aceito));
            Mockito.verify(notificacaoService).criar(
                    Mockito.any(), Mockito.eq("ANUNCIO_SUSPENSO"), Mockito.anyString(), Mockito.anyString(),
                    Mockito.any(), Mockito.anyString()
            );
            Mockito.verify(notificacaoService, Mockito.times(2)).criar(
                    Mockito.any(), Mockito.eq("NEGOCIACAO_CANCELADA_MODERACAO"), Mockito.anyString(), Mockito.anyString(),
                    Mockito.any(), Mockito.eq("INTERESSE")
            );
        }
    }

    @Nested
    @DisplayName("Cenarios para removerAvaliacao")
    class RemoverAvaliacaoCenarios {

        @Test
        @DisplayName("deve marcar a avaliacao como removida (soft delete) sem apaga-la do banco")
        void removerFazSoftDelete() {
            Usuario moderador = construirModerador();
            Avaliacao avaliacao = construirAvaliacao();

            Mockito.when(usuarioRepository.findByEmail(moderador.getEmail())).thenReturn(Optional.of(moderador));
            Mockito.when(avaliacaoRepository.findById(avaliacao.getId())).thenReturn(Optional.of(avaliacao));
            Mockito.when(avaliacaoRepository.calcularMediaDoAvaliado(donoAnuncio.getId())).thenReturn(null);

            moderacaoService.removerAvaliacao(avaliacao.getId(), moderador.getEmail(), "Conteudo ofensivo.");

            assertTrue(avaliacao.estaRemovida(), "avaliacao deve ficar marcada como removida (soft delete)");
            Mockito.verify(avaliacaoRepository).save(avaliacao);
            Mockito.verify(avaliacaoRepository, Mockito.never()).delete(Mockito.any(Avaliacao.class));
            Mockito.verify(historicoRepository).save(Mockito.any());
        }
    }

    private Avaliacao construirAvaliacao() {
        return Avaliacao.builder()
                .id(UUID.randomUUID())
                .avaliador(denunciante)
                .avaliado(donoAnuncio)
                .anuncio(anuncioAlheio)
                .nota((short) 1)
                .comentario("comentario qualquer")
                .build();
    }

    private Usuario construirModerador() {
        Usuario moderador = construirUsuario("moderador@reusehub.com");
        moderador.setPerfil(Perfil.MODERADOR);
        return moderador;
    }

    private DenunciaAnuncio construirDenunciaAberta() {
        return DenunciaAnuncio.builder()
                .id(UUID.randomUUID())
                .anuncio(anuncioAlheio)
                .denunciante(denunciante)
                .motivo(MOTIVO_PADRAO)
                .descricao(DESCRICAO_PADRAO)
                .status(DenunciaAnuncio.StatusDenuncia.ABERTA)
                .build();
    }

    private InteresseTroca construirInteresse(InteresseTroca.StatusInteresse status) {
        return InteresseTroca.builder()
                .id(UUID.randomUUID())
                .anuncioDesejado(anuncioAlheio)
                .interessado(construirUsuario("interessado-" + status + "@reusehub.com"))
                .status(status)
                .build();
    }

    private Usuario construirUsuario(String email) {
        Usuario usuario = new Usuario();
        usuario.setId(UUID.randomUUID());
        usuario.setEmail(email);
        usuario.setName("Usuario " + email);
        return usuario;
    }

    private Anuncio construirAnuncioDe(Usuario dono) {
        return Anuncio.builder()
                .id(UUID.randomUUID())
                .usuario(dono)
                .titulo("Anuncio para teste")
                .status(Anuncio.StatusAnuncio.ATIVO)
                .build();
    }

    private DenunciaCriacaoDTO novoDtoDenuncia(UUID anuncioId) {
        return new DenunciaCriacaoDTO(anuncioId, MOTIVO_PADRAO, DESCRICAO_PADRAO);
    }
}
