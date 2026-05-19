package com.reusehub.backend.auth.service;

import com.reusehub.anuncio.exception.RecursoNaoEncontradoException;
import com.reusehub.anuncio.exception.RegraNegocioException;
import com.reusehub.auth.dto.AuthResponse;
import com.reusehub.auth.dto.LoginRequest;
import com.reusehub.auth.dto.RegisterRequest;
import com.reusehub.auth.dto.UsuarioRespostaDTO;
import com.reusehub.auth.model.Perfil;
import com.reusehub.auth.model.Usuario;
import com.reusehub.auth.repository.UsuarioRepository;

import com.reusehub.auth.service.AuthService;
import com.reusehub.auth.service.JwtService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes Unitários de AuthService - Autenticação")
class AuthServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtService jwtService;
    @Mock
    private AuthenticationManager authenticationManager;

    @InjectMocks
    private AuthService authService;

    private Usuario usuarioModelo;

    @BeforeEach
    void setUp() {
        usuarioModelo = new Usuario();
        usuarioModelo.setId(UUID.randomUUID());
        usuarioModelo.setEmail("gustavo@reusehub.com");
        usuarioModelo.setName("Gustavo");
        usuarioModelo.setCpf("12345678900");
        usuarioModelo.setPasswordHash("hash_seguro");
        usuarioModelo.setPerfil(Perfil.USUARIO);
        usuarioModelo.setIsActive(true);
    }

    // registrar
    @Nested
    @DisplayName("Cenários para Registro")
    class RegistroCenarios {

        @Test
        @DisplayName("deve registrar novo usuário com sucesso")
        void registrarComSucesso() {
            RegisterRequest request = new RegisterRequest();
            request.setEmail("novo@test.com");
            request.setCpf("00011122233");
            request.setPassword("senha");
            request.setName("Novo User");

            Mockito.when(usuarioRepository.existsByEmail(request.getEmail())).thenReturn(false);
            Mockito.when(usuarioRepository.existsByCpf(request.getCpf())).thenReturn(false);
            Mockito.when(passwordEncoder.encode(request.getPassword())).thenReturn("encoded_pass");
            Mockito.when(usuarioRepository.save(Mockito.any(Usuario.class))).thenAnswer(i -> {
                Usuario u = i.getArgument(0);
                u.setId(UUID.randomUUID());
                return u;
            });
            Mockito.when(jwtService.gerarToken(Mockito.any())).thenReturn("token_jwt");

            AuthResponse response = authService.registrar(request);

            assertNotNull(response);
            assertEquals("token_jwt", response.getToken());
        }

        @Test
        @DisplayName("deve estourar RegraNegocioException se o e-mail já existir")
        void erroEmailDuplicado() {
            RegisterRequest request = new RegisterRequest();
            request.setEmail("gustavo@reusehub.com");

            Mockito.when(usuarioRepository.existsByEmail(request.getEmail())).thenReturn(true);

            assertThrows(RegraNegocioException.class, () -> authService.registrar(request));
        }

        @Test
        @DisplayName("deve estourar RegraNegocioException se o CPF já existir")
        void erroCpfDuplicado() {
            RegisterRequest request = new RegisterRequest();
            request.setEmail("novo@test.com");
            request.setCpf("12345678900");

            Mockito.when(usuarioRepository.existsByEmail(request.getEmail())).thenReturn(false);
            Mockito.when(usuarioRepository.existsByCpf(request.getCpf())).thenReturn(true);

            assertThrows(RegraNegocioException.class, () -> authService.registrar(request));
        }
    }

    // login
    @Nested
    @DisplayName("Cenários para Login")
    class LoginCenarios {

        @Test
        @DisplayName("deve autenticar com sucesso")
        void loginSucesso() {
            LoginRequest request = new LoginRequest();
            request.setEmail("gustavo@reusehub.com");
            request.setPassword("senha123");

            Mockito.when(usuarioRepository.findByEmail(request.getEmail())).thenReturn(Optional.of(usuarioModelo));
            Mockito.when(jwtService.gerarToken(Mockito.any())).thenReturn("token_gerado");

            AuthResponse response = authService.login(request);

            assertNotNull(response);
            assertEquals("token_gerado", response.getToken());
        }

        @Test
        @DisplayName("deve estourar RegraNegocioException ao tentar logar em conta inativa")
        void erroContaInativa() {
            LoginRequest request = new LoginRequest();
            request.setEmail("gustavo@reusehub.com");
            usuarioModelo.setIsActive(false);

            Mockito.when(usuarioRepository.findByEmail(request.getEmail())).thenReturn(Optional.of(usuarioModelo));

            assertThrows(RegraNegocioException.class, () -> authService.login(request));
        }
    }

    // obterPerfilPorEmail
    @Nested
    @DisplayName("Cenários para obterPerfilPorEmail")
    class ObterPerfilCenarios {

        @Test
        @DisplayName("deve retornar DTO se o usuário existir")
        void obterPerfilSucesso() {
            Mockito.when(usuarioRepository.findByEmail("gustavo@reusehub.com")).thenReturn(Optional.of(usuarioModelo));

            UsuarioRespostaDTO resposta = authService.obterPerfilPorEmail("gustavo@reusehub.com");

            assertNotNull(resposta);
            assertEquals("Gustavo", resposta.getName());
        }

        @Test
        @DisplayName("deve estourar RecursoNaoEncontradoException se e-mail não existir")
        void erroPerfilInexistente() {
            Mockito.when(usuarioRepository.findByEmail("inexistente@test.com")).thenReturn(Optional.empty());

            assertThrows(RecursoNaoEncontradoException.class, () -> authService.obterPerfilPorEmail("inexistente@test.com"));
        }
    }
}