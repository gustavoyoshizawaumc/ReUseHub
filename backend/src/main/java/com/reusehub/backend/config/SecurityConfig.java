package com.reusehub.backend.config;

import com.reusehub.auth.filter.JwtAuthenticationFilter;
import com.reusehub.auth.repository.UsuarioRepository;
import com.reusehub.auth.service.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private static final String[] ROTAS_LEITURA_PUBLICA = {
            "/api/anuncios",
            "/api/anuncios/buscar",
            "/api/anuncios/filtrar",
            "/api/anuncios/categoria/**",
            "/api/anuncios/tipo/**",
            "/api/anuncios/destaques/**",
            "/api/anuncios/{id}",
            "/api/categorias",
            "/api/perfis/**",
            "/api/avaliacoes/usuario/**"
    };

    private final UsuarioRepository usuarioRepository;
    private final JwtService jwtService;

    @Lazy
    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(
                                "/api/auth/registrar",
                                "/api/auth/register",
                                "/api/auth/login",
                                "/api/auth/reativar-conta",
                                "/api/auth/esqueci-senha",
                                "/api/auth/redefinir-senha"
                        ).permitAll()

                        .requestMatchers(HttpMethod.GET, ROTAS_LEITURA_PUBLICA).permitAll()
                        .requestMatchers(HttpMethod.HEAD, ROTAS_LEITURA_PUBLICA).permitAll()

                        // Tracking de visualizacao aceita anonimos (PR D.2).
                        // O service aplica regras anti-fraude (dono, dedupe) internamente.
                        .requestMatchers(HttpMethod.POST, "/api/anuncios/*/visualizacao").permitAll()

                        .requestMatchers("/static/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/uploads/**").permitAll()
                        .requestMatchers(HttpMethod.HEAD, "/uploads/**").permitAll()
                        .requestMatchers("/error").permitAll()
                        .requestMatchers("/ws/**").permitAll()

                        .requestMatchers("/api/anuncios/moderacao/**").hasAnyRole("MODERADOR", "ADMIN")
                        .requestMatchers("/api/moderacao/**").hasAnyRole("MODERADOR", "ADMIN")
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        .requestMatchers("/api/anuncios/favoritos/**").hasRole("USUARIO")
                        .requestMatchers("/api/anuncios/meus/**").hasRole("USUARIO")
                        .requestMatchers(HttpMethod.POST, "/api/anuncios").hasRole("USUARIO")
                        .requestMatchers(HttpMethod.POST, "/api/anuncios/*/favoritos").hasRole("USUARIO")
                        .requestMatchers(HttpMethod.DELETE, "/api/anuncios/*/favoritos").hasRole("USUARIO")
                        .requestMatchers(HttpMethod.PUT, "/api/anuncios/**").hasRole("USUARIO")
                        .requestMatchers(HttpMethod.DELETE, "/api/anuncios/**").hasRole("USUARIO")
                        .requestMatchers(HttpMethod.PATCH, "/api/anuncios/**").hasRole("USUARIO")
                        .requestMatchers("/api/chat/**").hasRole("USUARIO")
                        .requestMatchers("/api/interesses/**").hasRole("USUARIO")
                        .requestMatchers("/api/denuncias/**").hasRole("USUARIO")
                        .requestMatchers(HttpMethod.POST, "/api/avaliacoes/**").hasRole("USUARIO")

                        .anyRequest().authenticated()
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @org.springframework.beans.factory.annotation.Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Bean
    public UserDetailsService userDetailsService() {
        return email -> usuarioRepository.findByEmail(email)
                .filter(u -> Boolean.TRUE.equals(u.getIsActive()) && !Boolean.TRUE.equals(u.getBanido()))
                .map(u -> User.withUsername(u.getEmail())
                        .password(u.getPasswordHash())
                        .authorities("ROLE_" + u.getPerfil().name())
                        .build())
                .orElseThrow(() -> new UsernameNotFoundException("Usuario nao encontrado ou conta indisponivel"));
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        var provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService());
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public org.springframework.web.cors.CorsConfigurationSource corsConfigurationSource() {
        org.springframework.web.cors.CorsConfiguration config = new org.springframework.web.cors.CorsConfiguration();

        config.setAllowedOrigins(java.util.List.of(
                frontendUrl,
                "http://localhost:5173",
                "http://localhost:5174",
                "http://localhost:3000"
        ));

        config.setAllowedMethods(java.util.List.of(
                "GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"
        ));

        config.setAllowedHeaders(java.util.List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        org.springframework.web.cors.UrlBasedCorsConfigurationSource source =
                new org.springframework.web.cors.UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return source;
    }
}
