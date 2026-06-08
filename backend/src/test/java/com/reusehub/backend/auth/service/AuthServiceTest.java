package com.reusehub.backend.auth.service;

import com.reusehub.anuncio.exception.RecursoNaoEncontradoException;
import com.reusehub.anuncio.exception.RegraNegocioException;
import com.reusehub.auth.dto.AuthResponse;
import com.reusehub.auth.dto.LoginRequest;
import com.reusehub.auth.dto.RegisterRequest;
import com.reusehub.auth.dto.UsuarioRespostaDTO;
import com.reusehub.auth.model.Perfil;
import com.reusehub.auth.model.Usuario;
import com.reusehub.auth.repository.CredencialBloqueadaRepository;
import com.reusehub.auth.repository.UsuarioRepository;
import com.reusehub.auth.repository.TokenUsuarioRepository;
import com.reusehub.anuncio.repository.AnuncioFavoritoRepository;
import com.reusehub.anuncio.repository.AnuncioRepository;
import com.reusehub.anuncio.repository.EnderecoRepository;
import com.reusehub.anuncio.service.StorageService;
import com.reusehub.interesse.repository.InteresseTrocaRepository;
import com.reusehub.notificacao.repository.NotificacaoRepository;

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
import org.springframework.security.authentication.BadCredentialsException;
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
    private CredencialBloqueadaRepository credencialBloqueadaRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtService jwtService;
    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private TokenUsuarioRepository tokenUsuarioRepository;
    @Mock
    private AnuncioRepository anuncioRepository;
    @Mock
    private InteresseTrocaRepository interesseTrocaRepository;
    @Mock
    private AnuncioFavoritoRepository anuncioFavoritoRepository;
    @Mock
    private NotificacaoRepository notificacaoRepository;
    @Mock
    private EnderecoRepository enderecoRepository;
    @Mock
    private StorageService storageService;

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

    @Nested
    @DisplayName("Cenarios para ciclo de vida da conta")
    class CicloVidaContaCenarios {

        @Test
        @DisplayName("deve desativar conta sem negociacao em andamento")
        void desativarConta() {
            Mockito.when(usuarioRepository.findByEmail(usuarioModelo.getEmail()))
                    .thenReturn(Optional.of(usuarioModelo));

            authService.desativarContaPorEmail(usuarioModelo.getEmail());

            assertFalse(usuarioModelo.getIsActive());
            assertNotNull(usuarioModelo.getDesativadoEm());
            Mockito.verify(tokenUsuarioRepository).invalidarTokensAtivos(usuarioModelo.getId());
            Mockito.verify(interesseTrocaRepository).cancelarPendentesRelacionadosAoUsuario(usuarioModelo.getId());
            Mockito.verify(anuncioRepository).cancelarPublicacoesDoUsuario(Mockito.eq(usuarioModelo.getId()), Mockito.any());
        }

        @Test
        @DisplayName("deve bloquear encerramento se houver negociacao em andamento")
        void bloquearEncerramentoComNegociacao() {
            Mockito.when(usuarioRepository.findByEmail(usuarioModelo.getEmail()))
                    .thenReturn(Optional.of(usuarioModelo));
            Mockito.when(interesseTrocaRepository.existsNegociacaoEmAndamento(usuarioModelo.getId()))
                    .thenReturn(true);

            assertThrows(
                    RegraNegocioException.class,
                    () -> authService.desativarContaPorEmail(usuarioModelo.getEmail())
            );
            Mockito.verify(tokenUsuarioRepository, Mockito.never()).invalidarTokensAtivos(Mockito.any());
        }

        @Test
        @DisplayName("deve reativar conta desativada com senha valida")
        void reativarConta() {
            LoginRequest request = new LoginRequest();
            request.setEmail(usuarioModelo.getEmail());
            request.setPassword("senha123");
            usuarioModelo.setIsActive(false);

            Mockito.when(usuarioRepository.findByEmail(request.getEmail()))
                    .thenReturn(Optional.of(usuarioModelo));
            Mockito.when(passwordEncoder.matches(request.getPassword(), usuarioModelo.getPasswordHash()))
                    .thenReturn(true);
            Mockito.when(jwtService.gerarToken(Mockito.any())).thenReturn("token_reativado");

            AuthResponse response = authService.reativarConta(request);

            assertTrue(usuarioModelo.getIsActive());
            assertEquals("token_reativado", response.getToken());
            Mockito.verify(authenticationManager, Mockito.never()).authenticate(Mockito.any());
        }

        @Test
        @DisplayName("deve anonimizar dados ao excluir conta")
        void excluirConta() {
            Mockito.when(usuarioRepository.findByEmail(usuarioModelo.getEmail()))
                    .thenReturn(Optional.of(usuarioModelo));
            Mockito.when(enderecoRepository.findByUsuarioIdOrderByPrincipalDescCriadoEmDesc(usuarioModelo.getId()))
                    .thenReturn(java.util.List.of());
            Mockito.when(passwordEncoder.encode(Mockito.anyString())).thenReturn("senha_inutilizada");

            authService.deletarContaPorEmail(usuarioModelo.getEmail());

            assertFalse(usuarioModelo.getIsActive());
            assertTrue(usuarioModelo.getContaExcluida());
            assertEquals("Usuario excluido", usuarioModelo.getName());
            assertTrue(usuarioModelo.getEmail().startsWith("excluido+"));
            assertNull(usuarioModelo.getPhone());
            Mockito.verify(anuncioFavoritoRepository).deleteByUsuarioId(usuarioModelo.getId());
            Mockito.verify(notificacaoRepository).deleteByUsuarioId(usuarioModelo.getId());
        }
    }

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

        @Test
        @DisplayName("deve estourar BadCredentialsException generica quando o e-mail nao existir (anti-enumeration)")
        void erroEmailInexistente() {
            LoginRequest request = new LoginRequest();
            request.setEmail("inexistente@test.com");
            request.setPassword("senha123");

            Mockito.when(usuarioRepository.findByEmail(request.getEmail())).thenReturn(Optional.empty());

            BadCredentialsException ex = assertThrows(
                    BadCredentialsException.class,
                    () -> authService.login(request)
            );
            // Nao deve vazar o e-mail na mensagem (anti user-enumeration).
            // A mensagem amigavel exibida ao usuario e responsabilidade do GlobalExceptionHandler.
            assertFalse(ex.getMessage().contains(request.getEmail()));
        }

        @Test
        @DisplayName("deve propagar BadCredentialsException quando a senha estiver incorreta")
        void erroSenhaIncorreta() {
            LoginRequest request = new LoginRequest();
            request.setEmail("gustavo@reusehub.com");
            request.setPassword("senha_errada");

            Mockito.when(usuarioRepository.findByEmail(request.getEmail())).thenReturn(Optional.of(usuarioModelo));
            Mockito.when(authenticationManager.authenticate(Mockito.any()))
                    .thenThrow(new BadCredentialsException("Bad credentials"));

            assertThrows(BadCredentialsException.class, () -> authService.login(request));
            Mockito.verify(jwtService, Mockito.never()).gerarToken(Mockito.any());
        }
    }

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
