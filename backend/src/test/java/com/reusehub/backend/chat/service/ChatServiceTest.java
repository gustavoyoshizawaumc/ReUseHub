package com.reusehub.backend.chat.service;

import com.reusehub.anuncio.exception.AcessoNegadoException;
import com.reusehub.anuncio.exception.RecursoNaoEncontradoException;
import com.reusehub.anuncio.exception.RegraNegocioException;
import com.reusehub.chat.document.Conversa;
import com.reusehub.chat.dto.ConversaRespostaDTO;
import com.reusehub.chat.dto.IniciarConversaDTO;
import com.reusehub.chat.dto.ListaConversasDTO;
import com.reusehub.chat.dto.MensagemCriacaoDTO;
import com.reusehub.chat.repository.ChatRepository;
import com.reusehub.anuncio.repository.AnuncioRepository;
import com.reusehub.auth.model.Usuario;
import com.reusehub.auth.repository.UsuarioRepository;
import com.reusehub.chat.service.ChatService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes Unitários de ChatService - Cobertura Expandida")
class ChatServiceTest {

    @Mock
    private ChatRepository chatRepository;
    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private AnuncioRepository anuncioRepository;

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

    @Nested
    @DisplayName("Cenários para enviarMensagem")
    class EnviarMensagemCenarios {

        @Test
        @DisplayName("1.1 - Deve anexar e salvar mensagem com sucesso")
        void sucesso() {
            MensagemCriacaoDTO dto = Mockito.mock(MensagemCriacaoDTO.class);
            Mockito.when(dto.conteudo()).thenReturn("Olá, aceita troca?");

            Mockito.when(usuarioRepository.findByEmail("remetente@reusehub.com")).thenReturn(Optional.of(remetente));
            Mockito.when(chatRepository.findById("conversa-123")).thenReturn(Optional.of(conversaModelo));

            assertDoesNotThrow(() -> chatService.enviarMensagem("remetente@reusehub.com", "conversa-123", dto));
            assertEquals(1, conversaModelo.getHistoricoMensagens().size());
            Mockito.verify(chatRepository, Mockito.times(1)).save(conversaModelo);
        }

        @Test
        @DisplayName("1.2 - Deve estourar AcessoNegadoException se um invasor tentar enviar mensagem")
        void erroInvasor() {
            Usuario invasor = new Usuario();
            invasor.setId(UUID.randomUUID());
            invasor.setEmail("invasor@test.com");
            MensagemCriacaoDTO dto = Mockito.mock(MensagemCriacaoDTO.class);

            Mockito.when(usuarioRepository.findByEmail("invasor@test.com")).thenReturn(Optional.of(invasor));
            Mockito.when(chatRepository.findById("conversa-123")).thenReturn(Optional.of(conversaModelo));

            assertThrows(AcessoNegadoException.class, () -> chatService.enviarMensagem("invasor@test.com", "conversa-123", dto));
        }

        @Test
        @DisplayName("1.3 - Deve estourar RecursoNaoEncontradoException se a conversa não existir")
        void erroConversaInexistente() {
            MensagemCriacaoDTO dto = Mockito.mock(MensagemCriacaoDTO.class);
            Mockito.when(usuarioRepository.findByEmail("remetente@reusehub.com")).thenReturn(Optional.of(remetente));
            Mockito.when(chatRepository.findById("conversa-nula")).thenReturn(Optional.empty());

            assertThrows(RecursoNaoEncontradoException.class, () -> chatService.enviarMensagem("remetente@reusehub.com", "conversa-nula", dto));
        }
    }

    @Nested
    @DisplayName("Cenários para iniciarOuRecuperarConversa")
    class IniciarConversaCenarios {

        @Test
        @DisplayName("2.1 - Deve recuperar conversa existente caso ela já tenha sido criada")
        void sucessoRecuperar() {
            IniciarConversaDTO dto = Mockito.mock(IniciarConversaDTO.class);
            Mockito.when(dto.anuncioId()).thenReturn(conversaModelo.getAnuncioId());
            Mockito.when(dto.destinatarioId()).thenReturn(destinatario.getId().toString());

            Mockito.when(usuarioRepository.findByEmail("remetente@reusehub.com")).thenReturn(Optional.of(remetente));
            Mockito.when(chatRepository.findByAnuncioIdAndUsuarios(Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                   .thenReturn(Optional.of(conversaModelo));

            ConversaRespostaDTO resposta = chatService.iniciarOuRecuperarConversa("remetente@reusehub.com", dto);
            assertNotNull(resposta);
            assertEquals("conversa-123", resposta.id());
        }

        @Test
        @DisplayName("2.2 - Deve criar e salvar uma nova conversa se não encontrar histórico")
        void sucessoCriarNova() {
            IniciarConversaDTO dto = Mockito.mock(IniciarConversaDTO.class);
            Mockito.when(dto.anuncioId()).thenReturn("novo-anuncio");
            Mockito.when(dto.destinatarioId()).thenReturn(destinatario.getId().toString());

            Mockito.when(usuarioRepository.findByEmail("remetente@reusehub.com")).thenReturn(Optional.of(remetente));
            Mockito.when(chatRepository.findByAnuncioIdAndUsuarios("novo-anuncio", remetente.getId().toString(), destinatario.getId().toString()))
                   .thenReturn(Optional.empty());
            Mockito.when(chatRepository.save(Mockito.any(Conversa.class))).thenReturn(conversaModelo);

            ConversaRespostaDTO resposta = chatService.iniciarOuRecuperarConversa("remetente@reusehub.com", dto);
            assertNotNull(resposta);
        }

        @Test
        @DisplayName("2.3 - Deve estourar RegraNegocioException ao tentar iniciar conversa consigo mesmo")
        void erroConsigoMesmo() {
            IniciarConversaDTO dto = Mockito.mock(IniciarConversaDTO.class);
            Mockito.when(dto.destinatarioId()).thenReturn(remetente.getId().toString());

            Mockito.when(usuarioRepository.findByEmail("remetente@reusehub.com")).thenReturn(Optional.of(remetente));

            assertThrows(RegraNegocioException.class, () -> chatService.iniciarOuRecuperarConversa("remetente@reusehub.com", dto));
        }
    }

    @Nested
    @DisplayName("Cenários para recuperarHistoricoConversa")
    class RecuperarHistoricoCenarios {

        @Test
        @DisplayName("3.1 - Deve retornar o histórico quando o remetente busca pelo destinatário")
        void sucessoRemetenteBusca() {
            Mockito.when(usuarioRepository.findByEmail("remetente@reusehub.com")).thenReturn(Optional.of(remetente));
            Mockito.when(chatRepository.findByRemetenteAndDestinatario(remetente.getId().toString(), destinatario.getId().toString()))
                   .thenReturn(Optional.of(conversaModelo));

            ConversaRespostaDTO resposta = chatService.recuperarHistoricoConversa("remetente@reusehub.com", destinatario.getId().toString());
            assertNotNull(resposta);
        }

        @Test
        @DisplayName("3.2 - Deve retornar o histórico de forma invertida (quando destinatário busca pelo remetente)")
        void sucessoDestinatarioBusca() {
            Mockito.when(usuarioRepository.findByEmail("destinatario@reusehub.com")).thenReturn(Optional.of(destinatario));
            Mockito.when(chatRepository.findByRemetenteAndDestinatario(destinatario.getId().toString(), remetente.getId().toString()))
                   .thenReturn(Optional.empty());
            Mockito.when(chatRepository.findByRemetenteAndDestinatario(remetente.getId().toString(), destinatario.getId().toString()))
                   .thenReturn(Optional.of(conversaModelo));

            ConversaRespostaDTO resposta = chatService.recuperarHistoricoConversa("destinatario@reusehub.com", remetente.getId().toString());
            assertNotNull(resposta);
        }

        @Test
        @DisplayName("3.3 - Deve lançar RecursoNaoEncontradoException caso nenhuma conversa exista entre os dois")
        void erroInexistente() {
            Mockito.when(usuarioRepository.findByEmail("remetente@reusehub.com")).thenReturn(Optional.of(remetente));
            Mockito.when(chatRepository.findByRemetenteAndDestinatario(Mockito.anyString(), Mockito.anyString())).thenReturn(Optional.empty());

            assertThrows(RecursoNaoEncontradoException.class, () -> 
                chatService.recuperarHistoricoConversa("remetente@reusehub.com", destinatario.getId().toString())
            );
        }
    }

    @Nested
    @DisplayName("Cenários para recuperarConversaPorId")
    class RecuperarPorIdCenarios {

        @Test
        @DisplayName("4.1 - Deve retornar conversa se o usuário logado for o remetente")
        void sucessoDonoRemetente() {
            Mockito.when(usuarioRepository.findByEmail("remetente@reusehub.com")).thenReturn(Optional.of(remetente));
            Mockito.when(chatRepository.findById("conversa-123")).thenReturn(Optional.of(conversaModelo));

            ConversaRespostaDTO resposta = chatService.recuperarConversaPorId("conversa-123", "remetente@reusehub.com");
            assertNotNull(resposta);
        }

        @Test
        @DisplayName("4.2 - Deve lançar AcessoNegadoException se o usuário logado não pertencer à conversa")
        void erroUsuarioInvasor() {
            Usuario invasor = new Usuario();
            invasor.setId(UUID.randomUUID());
            invasor.setEmail("hacker@reusehub.com");

            Mockito.when(usuarioRepository.findByEmail("hacker@reusehub.com")).thenReturn(Optional.of(invasor));
            Mockito.when(chatRepository.findById("conversa-123")).thenReturn(Optional.of(conversaModelo));

            assertThrows(AcessoNegadoException.class, () -> chatService.recuperarConversaPorId("conversa-123", "hacker@reusehub.com"));
        }

        @Test
        @DisplayName("4.3 - Deve lançar RecursoNaoEncontradoException se o ID da conversa não existir")
        void erroIdInexistente() {
            Mockito.when(usuarioRepository.findByEmail("remetente@reusehub.com")).thenReturn(Optional.of(remetente));
            Mockito.when(chatRepository.findById("invalido")).thenReturn(Optional.empty());

            assertThrows(RecursoNaoEncontradoException.class, () -> chatService.recuperarConversaPorId("invalido", "remetente@reusehub.com"));
        }
    }

    @Nested
    @DisplayName("Cenários para listarConversasUsuario")
    class ListarConversasCenarios {

        @Test
        @DisplayName("5.1 - Deve retornar uma lista preenchida se o usuário possuir chats ativos")
        void sucessoListaPreenchida() {
            Mockito.when(usuarioRepository.findByEmail("remetente@reusehub.com")).thenReturn(Optional.of(remetente));
            Mockito.when(chatRepository.findByUsuario(remetente.getId().toString())).thenReturn(List.of(conversaModelo));

            ListaConversasDTO resultado = chatService.listarConversasUsuario("remetente@reusehub.com");
            assertNotNull(resultado);
            assertNotNull(resultado.conversas());
        }

        @Test
        @DisplayName("5.2 - Deve retornar uma lista vazia caso o usuário não tenha conversas")
        void sucessoListaVazia() {
            Mockito.when(usuarioRepository.findByEmail("remetente@reusehub.com")).thenReturn(Optional.of(remetente));
            Mockito.when(chatRepository.findByUsuario(remetente.getId().toString())).thenReturn(List.of());

            ListaConversasDTO resultado = chatService.listarConversasUsuario("remetente@reusehub.com");
            assertNotNull(resultado);
            assertTrue(resultado.conversas().isEmpty());
        }

        @Test
        @DisplayName("5.3 - Deve estourar RecursoNaoEncontradoException se o e-mail pesquisado não existir no sistema")
        void erroEmailInexistente() {
            Mockito.when(usuarioRepository.findByEmail("fantasma@reusehub.com")).thenReturn(Optional.empty());

            assertThrows(RecursoNaoEncontradoException.class, () -> chatService.listarConversasUsuario("fantasma@reusehub.com"));
        }
    }

    @Nested
    @DisplayName("Cenários para marcarComoLido")
    class MarcarComoLidoCenarios {

        @Test
        @DisplayName("6.1 - Deve marcar como lido com sucesso caso o usuário seja o destinatário")
        void sucessoDestinatario() {
            Mockito.when(usuarioRepository.findByEmail("destinatario@reusehub.com")).thenReturn(Optional.of(destinatario));
            Mockito.when(chatRepository.findById("conversa-123")).thenReturn(Optional.of(conversaModelo));

            assertDoesNotThrow(() -> chatService.marcarComoLido("conversa-123", "destinatario@reusehub.com"));
            assertTrue(conversaModelo.isLido());
            Mockito.verify(chatRepository, Mockito.times(1)).save(conversaModelo);
        }

        @Test
        @DisplayName("6.2 - Deve lançar AcessoNegadoException se o remetente original tentar forçar o status lido")
        void erroRemetenteTentaMarcar() {
            Mockito.when(usuarioRepository.findByEmail("remetente@reusehub.com")).thenReturn(Optional.of(remetente));
            Mockito.when(chatRepository.findById("conversa-123")).thenReturn(Optional.of(conversaModelo));

            assertThrows(AcessoNegadoException.class, () -> chatService.marcarComoLido("conversa-123", "remetente@reusehub.com"));
        }

        @Test
        @DisplayName("6.3 - Deve lançar RecursoNaoEncontradoException se a conversa informada não for localizada")
        void erroConversaNaoLocalizada() {
            Mockito.when(usuarioRepository.findByEmail("destinatario@reusehub.com")).thenReturn(Optional.of(destinatario));
            Mockito.when(chatRepository.findById("id-fantasma")).thenReturn(Optional.empty());

            assertThrows(RecursoNaoEncontradoException.class, () -> chatService.marcarComoLido("id-fantasma", "destinatario@reusehub.com"));
        }
    }
}
