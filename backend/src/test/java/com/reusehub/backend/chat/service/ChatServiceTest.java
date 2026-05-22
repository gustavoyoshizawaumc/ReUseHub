package com.reusehub.backend.chat.service;

import com.reusehub.anuncio.exception.AcessoNegadoException;
import com.reusehub.anuncio.exception.RecursoNaoEncontradoException;
import com.reusehub.anuncio.repository.AnuncioRepository;
import com.reusehub.anuncio.repository.ImagemAnuncioRepository;
import com.reusehub.auth.model.Usuario;
import com.reusehub.auth.repository.UsuarioRepository;
import com.reusehub.avaliacao.repository.AvaliacaoRepository;
import com.reusehub.chat.document.Conversa;
import com.reusehub.chat.dto.MensagemCriacaoDTO;
import com.reusehub.chat.repository.ChatRepository;
import com.reusehub.chat.service.ChatService;
import com.reusehub.interesse.repository.InteresseTrocaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes unitarios de ChatService")
class ChatServiceTest {

    @Mock
    private ChatRepository chatRepository;
    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private AnuncioRepository anuncioRepository;
    @Mock
    private ImagemAnuncioRepository imagemAnuncioRepository;
    @Mock
    private InteresseTrocaRepository interesseTrocaRepository;
    @Mock
    private AvaliacaoRepository avaliacaoRepository;

    @InjectMocks
    private ChatService chatService;

    private Usuario remetente;
    private Usuario destinatario;
    private Conversa conversaModelo;

    @BeforeEach
    void setUp() {
        remetente = new Usuario();
        remetente.setId(UUID.randomUUID());
        remetente.setEmail("remetente@reusehub.com");
        remetente.setName("Remetente Teste");

        destinatario = new Usuario();
        destinatario.setId(UUID.randomUUID());
        destinatario.setEmail("destinatario@reusehub.com");
        destinatario.setName("Destinatario Teste");

        conversaModelo = Conversa.builder()
                .id("conversa-123")
                .anuncioId(UUID.randomUUID().toString())
                .remetente(remetente.getId().toString())
                .destinatario(destinatario.getId().toString())
                .historicoMensagens(new ArrayList<>())
                .lido(false)
                .build();
    }

    @Test
    @DisplayName("Deve anexar e salvar mensagem com sucesso")
    void enviarMensagemComSucesso() {
        MensagemCriacaoDTO dto = Mockito.mock(MensagemCriacaoDTO.class);
        Mockito.when(dto.conteudo()).thenReturn("Ola, aceita troca?");
        Mockito.when(usuarioRepository.findByEmail("remetente@reusehub.com")).thenReturn(Optional.of(remetente));
        Mockito.when(chatRepository.findById("conversa-123")).thenReturn(Optional.of(conversaModelo));
        Mockito.when(avaliacaoRepository.existsByAnuncioId(Mockito.any(UUID.class))).thenReturn(false);

        assertDoesNotThrow(() -> chatService.enviarMensagem("remetente@reusehub.com", "conversa-123", dto));

        assertEquals(1, conversaModelo.getHistoricoMensagens().size());
        Mockito.verify(chatRepository).save(conversaModelo);
    }

    @Test
    @DisplayName("Deve negar mensagem de usuario fora da conversa")
    void enviarMensagemComUsuarioInvasor() {
        Usuario invasor = new Usuario();
        invasor.setId(UUID.randomUUID());
        invasor.setEmail("invasor@test.com");
        MensagemCriacaoDTO dto = Mockito.mock(MensagemCriacaoDTO.class);

        Mockito.when(usuarioRepository.findByEmail("invasor@test.com")).thenReturn(Optional.of(invasor));
        Mockito.when(chatRepository.findById("conversa-123")).thenReturn(Optional.of(conversaModelo));

        assertThrows(AcessoNegadoException.class, () -> chatService.enviarMensagem("invasor@test.com", "conversa-123", dto));
    }

    @Test
    @DisplayName("Deve marcar como lido quando usuario e destinatario")
    void marcarComoLidoDestinatario() {
        Mockito.when(usuarioRepository.findByEmail("destinatario@reusehub.com")).thenReturn(Optional.of(destinatario));
        Mockito.when(chatRepository.findById("conversa-123")).thenReturn(Optional.of(conversaModelo));

        assertDoesNotThrow(() -> chatService.marcarComoLido("conversa-123", "destinatario@reusehub.com"));

        assertTrue(conversaModelo.isLido());
        Mockito.verify(chatRepository).save(conversaModelo);
    }

    @Test
    @DisplayName("Deve permitir remetente abrir conversa sem alterar lido")
    void marcarComoLidoRemetenteNaoAltera() {
        Mockito.when(usuarioRepository.findByEmail("remetente@reusehub.com")).thenReturn(Optional.of(remetente));
        Mockito.when(chatRepository.findById("conversa-123")).thenReturn(Optional.of(conversaModelo));

        assertDoesNotThrow(() -> chatService.marcarComoLido("conversa-123", "remetente@reusehub.com"));

        assertFalse(conversaModelo.isLido());
        Mockito.verify(chatRepository, Mockito.never()).save(conversaModelo);
    }

    @Test
    @DisplayName("Deve falhar quando conversa nao existe")
    void marcarComoLidoConversaInexistente() {
        Mockito.when(usuarioRepository.findByEmail("destinatario@reusehub.com")).thenReturn(Optional.of(destinatario));
        Mockito.when(chatRepository.findById("id-fantasma")).thenReturn(Optional.empty());

        assertThrows(RecursoNaoEncontradoException.class, () -> chatService.marcarComoLido("id-fantasma", "destinatario@reusehub.com"));
    }
}
