package com.reusehub.backend.config;

import com.reusehub.auth.repository.UsuarioRepository;
import com.reusehub.auth.service.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.servlet.HandlerExceptionResolver;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes Unitários de SecurityConfig - Configurações de Infraestrutura")
class SecurityConfigTest {

    private SecurityConfig securityConfig;

    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private JwtService jwtService;
    @Mock
    private HandlerExceptionResolver handlerExceptionResolver;
    @Mock
    private AuthenticationConfiguration authenticationConfiguration;
    @Mock
    private AuthenticationManager authenticationManager;

    @BeforeEach
    void setUp() {
        securityConfig = new SecurityConfig(usuarioRepository, jwtService, handlerExceptionResolver);
    }

    @Nested
    @DisplayName("Cenários de Inicialização de Beans")
    class BeansCenarios {

        @Test
        @DisplayName("deve instanciar o PasswordEncoder correto (BCrypt)")
        void deveInstanciarBCryptPasswordEncoder() {
            PasswordEncoder encoder = securityConfig.passwordEncoder();

            assertNotNull(encoder);
            assertTrue(encoder instanceof BCryptPasswordEncoder);
        }

        @Test
        @DisplayName("deve construir o UserDetailsService e AuthenticationProvider vinculados")
        void deveConstruirProvedoresDeAutenticacao() {
            UserDetailsService userDetailsService = securityConfig.userDetailsService();
            AuthenticationProvider authProvider = securityConfig.authenticationProvider();

            assertNotNull(userDetailsService);
            assertNotNull(authProvider);
        }

        @Test
        @DisplayName("deve expor o AuthenticationManager a partir da configuração global")
        void deveExporAuthenticationManager() throws Exception {
            when(authenticationConfiguration.getAuthenticationManager()).thenReturn(authenticationManager);

            AuthenticationManager manager = securityConfig.authenticationManager(authenticationConfiguration);

            assertNotNull(manager);
            assertEquals(authenticationManager, manager);
        }

        @Test
        @DisplayName("deve configurar as regras de CORS contendo as origens permitidas")
        void deveConfigurarCorsCorretamente() {
            CorsConfigurationSource corsSource = securityConfig.corsConfigurationSource();
            assertNotNull(corsSource);
        }
    }
}