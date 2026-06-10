package com.reusehub.backend.chat.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.reusehub.chat.dto.ConversaRespostaDTO;
import com.reusehub.chat.dto.IniciarConversaDTO;
import com.reusehub.chat.dto.ListaConversasDTO;
import com.reusehub.chat.dto.MensagemCriacaoDTO;
import com.reusehub.chat.service.ChatService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(classes = com.reusehub.backend.BackendApplication.class)
@AutoConfigureMockMvc
@TestPropertySource(properties = {
    "spring.flyway.enabled=false",
    "spring.jpa.hibernate.ddl-auto=none",
    "spring.data.mongodb.uri=mongodb://localhost:27017/test"
})
@DisplayName("Testes do ChatController - Camada Web")
class ChatControllerTest {

    private static final String EMAIL_USUARIO_TESTE = "gustavo@reusehub.com";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ChatService chatService;

    @MockBean
    private com.reusehub.auth.repository.UsuarioRepository usuarioRepository;

    @MockBean
    private org.springframework.security.authentication.AuthenticationProvider authenticationProvider;

    @Nested
    @DisplayName("Cenários para /enviar")
    class EnviarMensagemCenarios {

        @Test
        @WithMockUser(username = "gustavo@reusehub.com", roles = "USUARIO")
        @DisplayName("deve enviar mensagem com sucesso retornando 201 Created")
        void enviarSucesso() throws Exception {
            MensagemCriacaoDTO dto = new MensagemCriacaoDTO("conversa-xyz", "Olá, tenho interesse no item!");

            mockMvc.perform(post("/api/chat/enviar")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(dto))
                    .with(csrf()))
                    .andExpect(status().isCreated());

            Mockito.verify(chatService, Mockito.times(1))
                   .enviarMensagem(Mockito.eq(EMAIL_USUARIO_TESTE), Mockito.eq("conversa-xyz"), Mockito.any());
        }
    }

    @Nested
    @DisplayName("Cenários para /iniciar")
    class IniciarConversaCenarios {

        @Test
        @WithMockUser(username = "gustavo@reusehub.com", roles = "USUARIO")
        @DisplayName("deve iniciar ou recuperar uma conversa com sucesso")
        void iniciarSucesso() throws Exception {
            IniciarConversaDTO dto = new IniciarConversaDTO("anuncio-123", "destinatario-456");

            ConversaRespostaDTO mockResposta = Mockito.mock(ConversaRespostaDTO.class);

            Mockito.when(chatService.iniciarOuRecuperarConversa(Mockito.anyString(), Mockito.any()))
                   .thenReturn(mockResposta);

            mockMvc.perform(post("/api/chat/iniciar")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(dto))
                    .with(csrf()))
                    .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("Cenários para /minhas-conversas")
    class MinhasConversasCenarios {

        @Test
        @WithMockUser(username = "gustavo@reusehub.com", roles = "USUARIO")
        @DisplayName("deve listar conversas do usuário logado")
        void listarSucesso() throws Exception {
            ListaConversasDTO mockLista = Mockito.mock(ListaConversasDTO.class);

            Mockito.when(chatService.listarConversasUsuario(EMAIL_USUARIO_TESTE))
                   .thenReturn(mockLista);

            mockMvc.perform(get("/api/chat/minhas-conversas"))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("deve barrar acesso e retornar 403 Forbidden se o usuário não estiver autenticado")
        void erroSemAutenticacao() throws Exception {
            mockMvc.perform(get("/api/chat/minhas-conversas"))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("Cenários para /{conversaId}/lido")
    class MarcarComoLidoCenarios {

        @Test
        @WithMockUser(username = "gustavo@reusehub.com", roles = "USUARIO")
        @DisplayName("deve marcar mensagens da conversa como lidas")
        void marcarLidoSucesso() throws Exception {
            mockMvc.perform(patch("/api/chat/conversa-123/lido").with(csrf()))
                    .andExpect(status().isOk());

            Mockito.verify(chatService, Mockito.times(1))
                   .marcarComoLido("conversa-123", EMAIL_USUARIO_TESTE);
        }
    }
}
