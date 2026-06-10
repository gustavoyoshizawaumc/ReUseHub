package com.reusehub.backend.auth.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.reusehub.anuncio.service.StorageService;
import com.reusehub.auth.dto.*;
import com.reusehub.auth.service.AuthService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

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
@DisplayName("Testes do AuthController - Camada Web")
class AuthControllerTest {

    private static final String CPF_VALIDO_PARA_REGISTRO = "52998224725";
    private static final String EMAIL_NOVO_USUARIO = "novo@reusehub.com";
    private static final String NOME_PADRAO = "Gustavo";
    private static final String TELEFONE_VALIDO = "11999999999";
    private static final String SENHA_FORTE = "Senha@123";
    private static final String SENHA_FRACA = "12345";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @MockBean
    private StorageService storageService;

    @MockBean
    private com.reusehub.auth.repository.UsuarioRepository usuarioRepository;

    @MockBean
    private org.springframework.security.authentication.AuthenticationProvider authenticationProvider;

    @Nested
    @DisplayName("Cenários para /registrar")
    class RegisterCenarios {

        @Test
        @DisplayName("deve registrar usuário com sucesso")
        void registrarSucesso() throws Exception {
            RegisterRequest request = novoRegisterRequestValido();

            AuthResponse mockResponse = Mockito.mock(AuthResponse.class);
            Mockito.when(authService.registrar(Mockito.any())).thenReturn(mockResponse);

            executarRegistroComBody(request)
                    .andExpect(status().isCreated());
        }

        @Test
        @DisplayName("deve retornar 400 se dados obrigatórios estiverem ausentes")
        void registrarDadosInvalidos() throws Exception {
            RegisterRequest request = new RegisterRequest();

            executarRegistroComBody(request)
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("deve retornar 400 quando a senha nao atender ao padrao de senha forte")
        void registrarSenhaFraca() throws Exception {
            RegisterRequest request = novoRegisterRequestValido();
            request.setPassword(SENHA_FRACA);

            executarRegistroComBody(request)
                    .andExpect(status().isBadRequest());

            Mockito.verify(authService, Mockito.never()).registrar(Mockito.any());
        }

        private RegisterRequest novoRegisterRequestValido() {
            RegisterRequest request = new RegisterRequest();
            request.setName(NOME_PADRAO);
            request.setCpf(CPF_VALIDO_PARA_REGISTRO);
            request.setEmail(EMAIL_NOVO_USUARIO);
            request.setPassword(SENHA_FORTE);
            request.setPhone(TELEFONE_VALIDO);
            request.setLgpdConsent(true);
            return request;
        }

        private org.springframework.test.web.servlet.ResultActions executarRegistroComBody(RegisterRequest request) throws Exception {
            return mockMvc.perform(post("/api/auth/registrar")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request))
                    .with(csrf()));
        }
    }

    @Nested
    @DisplayName("Cenários para /login")
    class LoginCenarios {

        @Test
        @DisplayName("deve autenticar com sucesso")
        void loginSucesso() throws Exception {
            LoginRequest request = new LoginRequest();
            request.setEmail("usuario@email.com");
            request.setPassword("senha123");

            AuthResponse mockResponse = Mockito.mock(AuthResponse.class);
            Mockito.when(authService.login(Mockito.any())).thenReturn(mockResponse);

            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request))
                    .with(csrf()))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("deve retornar 400 se login estiver inválido")
        void loginDadosInvalidos() throws Exception {
            LoginRequest request = new LoginRequest();

            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request))
                    .with(csrf()))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("Cenarios para /reativar-conta")
    class ReativarContaCenarios {

        @Test
        @DisplayName("deve permitir reativacao sem sessao ativa")
        void reativarConta() throws Exception {
            LoginRequest request = new LoginRequest();
            request.setEmail("usuario@email.com");
            request.setPassword("senha123");

            Mockito.when(authService.reativarConta(Mockito.any())).thenReturn(Mockito.mock(AuthResponse.class));

            mockMvc.perform(post("/api/auth/reativar-conta")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request))
                    .with(csrf()))
                    .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("Cenários para /minha-conta (GET)")
    class ObterPerfilCenarios {

        @Test
        @WithMockUser(username = "usuario@email.com")
        @DisplayName("deve retornar dados do perfil logado")
        void perfilLogado() throws Exception {
            Mockito.when(authService.obterPerfilPorEmail("usuario@email.com")).thenReturn(new UsuarioRespostaDTO());

            mockMvc.perform(get("/api/auth/minha-conta"))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("deve bloquear acesso ao perfil se anônimo")
        void perfilAnonimo() throws Exception {
            mockMvc.perform(get("/api/auth/minha-conta"))
                    .andExpect(status().isForbidden());
        }
        @Test
        @WithMockUser(username = "usuario@email.com")
        @DisplayName("deve chamar service com email do usuário autenticado")
        void perfilChamaServiceComEmailCorreto() throws Exception {
            Mockito.when(authService.obterPerfilPorEmail("usuario@email.com"))
                    .thenReturn(new UsuarioRespostaDTO());

            mockMvc.perform(get("/api/auth/minha-conta"))
                    .andExpect(status().isOk());

            Mockito.verify(authService).obterPerfilPorEmail("usuario@email.com");
        }
    }

    @Nested
    @DisplayName("Cenários para /minha-conta (PUT Multipart)")
    class FluxoAtualizarPerfil {

        @Test
        @WithMockUser(username = "usuario@email.com")
        @DisplayName("deve atualizar perfil com imagem de avatar com sucesso")
        void atualizarComArquivoSucesso() throws Exception {
            MockMultipartFile avatar = new MockMultipartFile("avatarFile", "avatar.png", "image/png", "bytes".getBytes());

            Mockito.when(storageService.salvarImagens(Mockito.any())).thenReturn(Collections.singletonList("https://reusehub-uploads.s3.us-east-2.amazonaws.com/fake.png"));
            Mockito.when(authService.atualizarPerfilPorEmail(Mockito.anyString(), Mockito.any())).thenReturn(new UsuarioRespostaDTO());

            mockMvc.perform(multipart("/api/auth/minha-conta")
                    .file(avatar)
                    .param("name", "Gustavo Yoshizawa")
                    .with(csrf())
                    .with(request -> { request.setMethod("PUT"); return request; }))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("deve bloquear atualização se usuário anônimo")
        void atualizarPerfilAnonimo() throws Exception {
            mockMvc.perform(multipart("/api/auth/minha-conta")
                    .param("name", "Gustavo")
                    .with(csrf())
                    .with(request -> {
                        request.setMethod("PUT");
                        return request;
                    }))
                    .andExpect(status().isForbidden());
        }

        @Test
        @WithMockUser(username = "usuario@email.com")
        @DisplayName("deve atualizar perfil sem imagem")
        void atualizarSemImagem() throws Exception {
            Mockito.when(authService.atualizarPerfilPorEmail(Mockito.anyString(), Mockito.any()))
                    .thenReturn(new UsuarioRespostaDTO());

            mockMvc.perform(multipart("/api/auth/minha-conta")
                    .param("name", "Gustavo Yoshizawa")
                    .param("phone", "11999999999")
                    .with(csrf())
                    .with(request -> {
                        request.setMethod("PUT");
                        return request;
                    }))
                    .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("Cenários para /minha-conta (DELETE)")
    class DeletarContaCenarios {

        @Test
        @WithMockUser(username = "usuario@email.com")
        @DisplayName("deve deletar conta do usuário logado")
        void deletarSucesso() throws Exception {
            mockMvc.perform(delete("/api/auth/minha-conta").with(csrf()))
                    .andExpect(status().isNoContent());

            Mockito.verify(authService, Mockito.times(1)).deletarContaPorEmail("usuario@email.com");
        }

    }

    @Nested
    @DisplayName("Cenarios para /minha-conta/desativar (PATCH)")
    class DesativarContaCenarios {

        @Test
        @WithMockUser(username = "usuario@email.com")
        @DisplayName("deve desativar conta do usuario logado")
        void desativarSucesso() throws Exception {
            mockMvc.perform(patch("/api/auth/minha-conta/desativar").with(csrf()))
                    .andExpect(status().isNoContent());

            Mockito.verify(authService).desativarContaPorEmail("usuario@email.com");
        }
    }
}
