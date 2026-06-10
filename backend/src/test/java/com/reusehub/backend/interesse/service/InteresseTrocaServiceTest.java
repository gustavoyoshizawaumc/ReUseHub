package com.reusehub.backend.interesse.service;

import com.reusehub.anuncio.model.Anuncio;
import com.reusehub.anuncio.repository.AnuncioRepository;
import com.reusehub.anuncio.repository.ImagemAnuncioRepository;
import com.reusehub.anuncio.exception.RegraNegocioException;
import com.reusehub.auth.model.Usuario;
import com.reusehub.auth.repository.UsuarioRepository;
import com.reusehub.avaliacao.repository.AvaliacaoRepository;
import com.reusehub.chat.dto.ConversaRespostaDTO;
import com.reusehub.chat.service.ChatService;
import com.reusehub.interesse.dto.InteresseCriacaoDTO;
import com.reusehub.interesse.model.InteresseTroca;
import com.reusehub.interesse.repository.InteresseTrocaRepository;
import com.reusehub.interesse.service.InteresseTrocaService;
import com.reusehub.notificacao.service.NotificacaoService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes unitarios de InteresseTrocaService")
class InteresseTrocaServiceTest {

    @Mock private InteresseTrocaRepository interesseTrocaRepository;
    @Mock private UsuarioRepository usuarioRepository;
    @Mock private AnuncioRepository anuncioRepository;
    @Mock private ImagemAnuncioRepository imagemAnuncioRepository;
    @Mock private ChatService chatService;
    @Mock private NotificacaoService notificacaoService;
    @Mock private AvaliacaoRepository avaliacaoRepository;

    @InjectMocks
    private InteresseTrocaService interesseTrocaService;

    private Usuario dono;
    private Usuario interessado;
    private Anuncio anuncio;
    private InteresseTroca interesse;

    @BeforeEach
    void prepararNegociacao() {
        dono = usuario("dono@reusehub.com", "Dono");
        interessado = usuario("interessado@reusehub.com", "Interessado");
        anuncio = Anuncio.builder()
                .id(UUID.randomUUID())
                .usuario(dono)
                .titulo("Item para negociar")
                .tipo(Anuncio.TipoAnuncio.TROCA)
                .status(Anuncio.StatusAnuncio.ATIVO)
                .build();
        interesse = InteresseTroca.builder()
                .id(UUID.randomUUID())
                .anuncioDesejado(anuncio)
                .interessado(interessado)
                .status(InteresseTroca.StatusInteresse.ACEITO)
                .build();

        Mockito.lenient().when(interesseTrocaRepository.findById(interesse.getId())).thenReturn(Optional.of(interesse));
        Mockito.lenient().when(interesseTrocaRepository.save(interesse)).thenReturn(interesse);
    }

    @Test
    @DisplayName("dono pode cancelar negociacao aceita")
    void donoCancelaNegociacao() {
        Mockito.when(usuarioRepository.findByEmail(dono.getEmail())).thenReturn(Optional.of(dono));

        interesseTrocaService.cancelarNegociacao(interesse.getId(), dono.getEmail());

        assertEquals(InteresseTroca.StatusInteresse.CANCELADO, interesse.getStatus());
        assertEquals(dono, interesse.getCanceladoPor());
        assertNotNull(interesse.getCanceladoEm());
        Mockito.verify(notificacaoService).criar(
                Mockito.eq(interessado),
                Mockito.eq("NEGOCIACAO_CANCELADA"),
                Mockito.anyString(),
                Mockito.anyString(),
                Mockito.eq(interesse.getId()),
                Mockito.eq("INTERESSE")
        );
    }

    @Test
    @DisplayName("interessado pode cancelar entrega pendente sem mudar o status do anuncio")
    void interessadoCancelaEntregaPendente() {
        anuncio.setStatus(Anuncio.StatusAnuncio.ATIVO);
        interesse.setEntreguePeloDonoEm(LocalDateTime.now());
        Mockito.when(usuarioRepository.findByEmail(interessado.getEmail())).thenReturn(Optional.of(interessado));

        interesseTrocaService.cancelarNegociacao(interesse.getId(), interessado.getEmail());

        assertEquals(InteresseTroca.StatusInteresse.CANCELADO, interesse.getStatus());
        assertEquals(Anuncio.StatusAnuncio.ATIVO, anuncio.getStatus());
        assertEquals(interessado, interesse.getCanceladoPor());
        Mockito.verify(anuncioRepository, Mockito.never()).save(Mockito.any(Anuncio.class));
    }

    @Test
    @DisplayName("troca exige anuncio oferecido de troca ativo")
    void trocaExigeAnuncioOferecido() {
        Mockito.when(usuarioRepository.findByEmail(interessado.getEmail())).thenReturn(Optional.of(interessado));
        Mockito.when(anuncioRepository.findById(anuncio.getId())).thenReturn(Optional.of(anuncio));

        assertThrows(RegraNegocioException.class, () -> interesseTrocaService.criarInteresse(
                interessado.getEmail(),
                new InteresseCriacaoDTO(anuncio.getId(), null, "Tenho interesse na troca")
        ));
    }

    @Test
    @DisplayName("troca nao aceita anuncio oferecido de doacao")
    void trocaNaoAceitaAnuncioOferecidoDeDoacao() {
        Anuncio anuncioOferecido = anuncioDoInteressado(Anuncio.TipoAnuncio.DOACAO, Anuncio.StatusAnuncio.ATIVO);
        Mockito.when(usuarioRepository.findByEmail(interessado.getEmail())).thenReturn(Optional.of(interessado));
        Mockito.when(anuncioRepository.findById(anuncio.getId())).thenReturn(Optional.of(anuncio));
        Mockito.when(anuncioRepository.findById(anuncioOferecido.getId())).thenReturn(Optional.of(anuncioOferecido));

        assertThrows(RegraNegocioException.class, () -> interesseTrocaService.criarInteresse(
                interessado.getEmail(),
                new InteresseCriacaoDTO(anuncio.getId(), anuncioOferecido.getId(), "Tenho interesse na troca")
        ));
    }

    @Test
    @DisplayName("bloqueia nova solicitacao ativa para o mesmo anuncio usando o mesmo item")
    void bloqueiaSolicitacaoDuplicadaComMesmoItemOferecido() {
        Anuncio anuncioOferecido = anuncioDoInteressado(Anuncio.TipoAnuncio.TROCA, Anuncio.StatusAnuncio.ATIVO);
        Mockito.when(usuarioRepository.findByEmail(interessado.getEmail())).thenReturn(Optional.of(interessado));
        Mockito.when(anuncioRepository.findById(anuncio.getId())).thenReturn(Optional.of(anuncio));
        Mockito.when(anuncioRepository.findById(anuncioOferecido.getId())).thenReturn(Optional.of(anuncioOferecido));
        Mockito.when(interesseTrocaRepository.existsByAnuncioDesejadoIdAndInteressadoIdAndStatus(
                anuncio.getId(),
                interessado.getId(),
                InteresseTroca.StatusInteresse.ACEITO
        )).thenReturn(false);
        Mockito.when(interesseTrocaRepository.existsByAnuncioDesejadoIdAndInteressadoIdAndAnuncioOferecidoIdAndStatus(
                anuncio.getId(),
                interessado.getId(),
                anuncioOferecido.getId(),
                InteresseTroca.StatusInteresse.PENDENTE
        )).thenReturn(true);

        assertThrows(RegraNegocioException.class, () -> interesseTrocaService.criarInteresse(
                interessado.getEmail(),
                new InteresseCriacaoDTO(anuncio.getId(), anuncioOferecido.getId(), "Tenho interesse na troca")
        ));

        Mockito.verify(interesseTrocaRepository, Mockito.never()).save(Mockito.any(InteresseTroca.class));
    }

    @Test
    @DisplayName("permite nova solicitacao quando nao existe interesse ativo com o mesmo item")
    void permiteNovaSolicitacaoQuandoAnteriorFoiRejeitada() {
        Anuncio anuncioOferecido = anuncioDoInteressado(Anuncio.TipoAnuncio.TROCA, Anuncio.StatusAnuncio.ATIVO);
        Mockito.when(usuarioRepository.findByEmail(interessado.getEmail())).thenReturn(Optional.of(interessado));
        Mockito.when(anuncioRepository.findById(anuncio.getId())).thenReturn(Optional.of(anuncio));
        Mockito.when(anuncioRepository.findById(anuncioOferecido.getId())).thenReturn(Optional.of(anuncioOferecido));
        Mockito.when(interesseTrocaRepository.existsByAnuncioDesejadoIdAndInteressadoIdAndStatus(
                anuncio.getId(),
                interessado.getId(),
                InteresseTroca.StatusInteresse.ACEITO
        )).thenReturn(false);
        Mockito.when(interesseTrocaRepository.existsByAnuncioDesejadoIdAndInteressadoIdAndAnuncioOferecidoIdAndStatus(
                anuncio.getId(),
                interessado.getId(),
                anuncioOferecido.getId(),
                InteresseTroca.StatusInteresse.PENDENTE
        )).thenReturn(false);
        Mockito.when(interesseTrocaRepository.save(Mockito.any(InteresseTroca.class))).thenAnswer(invocation -> {
            InteresseTroca novoInteresse = invocation.getArgument(0);
            novoInteresse.setId(UUID.randomUUID());
            novoInteresse.setCriadoEm(LocalDateTime.now());
            return novoInteresse;
        });
        Mockito.when(imagemAnuncioRepository.findByAnuncioIdOrderByOrdemExibicaoAsc(anuncio.getId()))
                .thenReturn(java.util.List.of());

        assertDoesNotThrow(() -> interesseTrocaService.criarInteresse(
                interessado.getEmail(),
                new InteresseCriacaoDTO(anuncio.getId(), anuncioOferecido.getId(), "Tenho interesse na troca")
        ));

        Mockito.verify(interesseTrocaRepository).save(Mockito.any(InteresseTroca.class));
    }

    @Test
    @DisplayName("bloqueia nova solicitacao para anuncio que o interessado ja esta negociando")
    void bloqueiaNovaSolicitacaoQuandoInteresseJaFoiAceito() {
        Anuncio outroItemOferecido = anuncioDoInteressado(Anuncio.TipoAnuncio.TROCA, Anuncio.StatusAnuncio.ATIVO);
        Mockito.when(usuarioRepository.findByEmail(interessado.getEmail())).thenReturn(Optional.of(interessado));
        Mockito.when(anuncioRepository.findById(anuncio.getId())).thenReturn(Optional.of(anuncio));
        Mockito.when(anuncioRepository.findById(outroItemOferecido.getId())).thenReturn(Optional.of(outroItemOferecido));
        Mockito.when(interesseTrocaRepository.existsByAnuncioDesejadoIdAndInteressadoIdAndStatus(
                anuncio.getId(),
                interessado.getId(),
                InteresseTroca.StatusInteresse.ACEITO
        )).thenReturn(true);

        RegraNegocioException excecao = assertThrows(RegraNegocioException.class, () -> interesseTrocaService.criarInteresse(
                interessado.getEmail(),
                new InteresseCriacaoDTO(anuncio.getId(), outroItemOferecido.getId(), "Tenho outra proposta")
        ));

        assertTrue(excecao.getMessage().contains("negociando este anúncio"));
        Mockito.verify(interesseTrocaRepository, Mockito.never()).existsByAnuncioDesejadoIdAndInteressadoIdAndAnuncioOferecidoIdAndStatus(
                anuncio.getId(),
                interessado.getId(),
                outroItemOferecido.getId(),
                InteresseTroca.StatusInteresse.PENDENTE
        );
        Mockito.verify(interesseTrocaRepository, Mockito.never()).save(Mockito.any(InteresseTroca.class));
    }

    @Test
    @DisplayName("aceitar proposta rejeita outras pendentes do mesmo interessado no anuncio")
    void aceitarRejeitaOutrasPendentesDoMesmoInteressadoNoAnuncio() {
        Anuncio anuncioOferecido = anuncioDoInteressado(Anuncio.TipoAnuncio.TROCA, Anuncio.StatusAnuncio.ATIVO);
        interesse.setStatus(InteresseTroca.StatusInteresse.PENDENTE);
        interesse.setAnuncioOferecido(anuncioOferecido);
        Mockito.when(usuarioRepository.findByEmail(dono.getEmail())).thenReturn(Optional.of(dono));
        Mockito.when(interesseTrocaRepository.existsByAnuncioDesejadoIdAndStatus(
                anuncio.getId(),
                InteresseTroca.StatusInteresse.ACEITO
        )).thenReturn(false);
        Mockito.when(chatService.iniciarOuRecuperarConversaComOferta(
                Mockito.eq(dono.getEmail()),
                Mockito.any(),
                Mockito.eq(anuncioOferecido.getId().toString())
        )).thenReturn(new ConversaRespostaDTO(
                "conversa-1",
                interessado.getId().toString(),
                interessado.getName(),
                null,
                anuncio.getId().toString(),
                anuncio.getTitulo(),
                null,
                anuncioOferecido.getId().toString(),
                anuncioOferecido.getTitulo(),
                null,
                interesse.getId().toString(),
                anuncio.getStatus().name(),
                null,
                null,
                null,
                false,
                false,
                true,
                false,
                false,
                false,
                false,
                List.of()
        ));
        Mockito.when(imagemAnuncioRepository.findByAnuncioIdOrderByOrdemExibicaoAsc(anuncio.getId()))
                .thenReturn(List.of());
        Mockito.when(imagemAnuncioRepository.findByAnuncioIdOrderByOrdemExibicaoAsc(anuncioOferecido.getId()))
                .thenReturn(List.of());

        interesseTrocaService.aceitarInteresse(interesse.getId(), dono.getEmail());

        assertEquals(InteresseTroca.StatusInteresse.ACEITO, interesse.getStatus());
        Mockito.verify(interesseTrocaRepository).rejeitarPendentesDoMesmoInteressadoNoAnuncio(
                interesse.getId(),
                anuncio.getId(),
                interessado.getId()
        );
        Mockito.verify(interesseTrocaRepository).save(interesse);
    }

    @Test
    @DisplayName("confirmacao de recebimento conclui o anuncio desejado e o oferecido")
    void confirmarRecebimentoConcluiAnuncioDesejadoEOferecido() {
        Anuncio anuncioOferecido = anuncioDoInteressado(Anuncio.TipoAnuncio.TROCA, Anuncio.StatusAnuncio.ATIVO);
        interesse.setAnuncioOferecido(anuncioOferecido);
        interesse.setEntreguePeloDonoEm(LocalDateTime.now());
        Mockito.when(usuarioRepository.findByEmail(interessado.getEmail())).thenReturn(Optional.of(interessado));

        interesseTrocaService.confirmarRecebimento(interesse.getId(), interessado.getEmail());

        assertEquals(Anuncio.StatusAnuncio.CONCLUIDO, anuncio.getStatus());
        assertEquals(Anuncio.StatusAnuncio.CONCLUIDO, anuncioOferecido.getStatus());
        Mockito.verify(anuncioRepository).save(anuncio);
        Mockito.verify(anuncioRepository).save(anuncioOferecido);
    }

    private Usuario usuario(String email, String nome) {
        Usuario usuario = new Usuario();
        usuario.setId(UUID.randomUUID());
        usuario.setEmail(email);
        usuario.setName(nome);
        return usuario;
    }

    private Anuncio anuncioDoInteressado(Anuncio.TipoAnuncio tipo, Anuncio.StatusAnuncio status) {
        return Anuncio.builder()
                .id(UUID.randomUUID())
                .usuario(interessado)
                .titulo("Item oferecido")
                .tipo(tipo)
                .status(status)
                .build();
    }
}
