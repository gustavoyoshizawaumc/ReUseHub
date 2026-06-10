package com.reusehub.backend.auth.filter;

import com.reusehub.auth.filter.JwtAuthenticationFilter;

import com.reusehub.anuncio.exception.OperacaoInvalidaException;
import com.reusehub.auth.service.JwtService;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.servlet.HandlerExceptionResolver;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes Unitários do Filtro de Autenticação JWT")
class JwtAuthenticationFilterTest {

    private JwtAuthenticationFilter filter;

    @Mock
    private JwtService jwtService;
    @Mock
    private UserDetailsService userDetailsService;
    @Mock
    private HandlerExceptionResolver resolver;
    @Mock
    private FilterChain filterChain;

    private MockHttpServletRequest request;
    private MockHttpServletResponse response;

    @BeforeEach
    void setUp() {
        filter = new JwtAuthenticationFilter(jwtService, userDetailsService, resolver);
        request = new MockHttpServletRequest();
        response = new MockHttpServletResponse();
        SecurityContextHolder.clearContext();
    }

    @Nested
    @DisplayName("Cenários de Autenticação")
    class AutenticacaoCenarios {

        @Test
        @DisplayName("deve injetar usuário autenticado no SecurityContext se o token for válido")
        void autenticarComSucesso() throws Exception {
            request.addHeader("Authorization", "Bearer token_valido_pfc");
            UserDetails userDetails = new User("gustavo@reusehub.com", "senha", Collections.emptyList());

            Mockito.when(jwtService.extrairEmail("token_valido_pfc")).thenReturn("gustavo@reusehub.com");
            Mockito.when(userDetailsService.loadUserByUsername("gustavo@reusehub.com")).thenReturn(userDetails);
            Mockito.when(jwtService.tokenValido("token_valido_pfc", userDetails)).thenReturn(true);

            filter.doFilter(request, response, filterChain);

            assertNotNull(SecurityContextHolder.getContext().getAuthentication());
            assertEquals("gustavo@reusehub.com", SecurityContextHolder.getContext().getAuthentication().getName());
            Mockito.verify(filterChain, Mockito.times(1)).doFilter(request, response);
        }

        @Test
        @DisplayName("deve ignorar a autenticação e seguir em frente se o cabeçalho Authorization não contiver Bearer")
        void ignorarSemToken() throws Exception {
            filter.doFilter(request, response, filterChain);

            assertNull(SecurityContextHolder.getContext().getAuthentication());
            Mockito.verify(filterChain, Mockito.times(1)).doFilter(request, response);
            Mockito.verifyNoInteractions(jwtService, userDetailsService);
        }

        @Test
        @DisplayName("deve seguir como anonimo (sem bloquear) quando o token estiver expirado ou corrompido")
        void tokenInvalidoSegueComoAnonimo() throws Exception {
            request.addHeader("Authorization", "Bearer token_expirado");

            Mockito.when(jwtService.extrairEmail("token_expirado"))
                   .thenThrow(new OperacaoInvalidaException("O token enviado está expirado."));

            filter.doFilter(request, response, filterChain);

            assertNull(SecurityContextHolder.getContext().getAuthentication());
            Mockito.verify(filterChain, Mockito.times(1)).doFilter(request, response);
            Mockito.verify(resolver, Mockito.never())
                   .resolveException(Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any());
        }

        @Test
        @DisplayName("deve seguir como anonimo quando o usuario do token nao for mais encontrado (desativado/banido)")
        void usuarioInexistenteSegueComoAnonimo() throws Exception {
            request.addHeader("Authorization", "Bearer token_de_usuario_removido");

            Mockito.when(jwtService.extrairEmail("token_de_usuario_removido"))
                   .thenReturn("removido@reusehub.com");
            Mockito.when(userDetailsService.loadUserByUsername("removido@reusehub.com"))
                   .thenThrow(new UsernameNotFoundException("Usuario nao encontrado ou conta indisponivel"));

            filter.doFilter(request, response, filterChain);

            assertNull(SecurityContextHolder.getContext().getAuthentication());
            Mockito.verify(filterChain, Mockito.times(1)).doFilter(request, response);
            Mockito.verify(resolver, Mockito.never())
                   .resolveException(Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any());
        }

        @Test
        @DisplayName("deve acionar o HandlerExceptionResolver em excecoes inesperadas (preserva observabilidade de bugs)")
        void excecaoInesperadaPropagada() throws Exception {
            request.addHeader("Authorization", "Bearer token_qualquer");

            RuntimeException bugInterno = new RuntimeException("falha inesperada nao relacionada a JWT");
            Mockito.when(jwtService.extrairEmail("token_qualquer")).thenThrow(bugInterno);

            filter.doFilter(request, response, filterChain);

            assertNull(SecurityContextHolder.getContext().getAuthentication());
            Mockito.verify(resolver, Mockito.times(1))
                   .resolveException(request, response, null, bugInterno);
        }
    }
}
