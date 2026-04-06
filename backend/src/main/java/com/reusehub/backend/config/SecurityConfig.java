package com.reusehub.backend.config;

import com.reusehub.auth.filter.JwtAuthenticationFilter;
import com.reusehub.auth.repository.UsuarioRepository;
import com.reusehub.auth.service.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
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

    private final UsuarioRepository usuarioRepository;
    private final JwtService jwtService;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                    .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                    
                    .requestMatchers("/api/auth/register", "/api/auth/login").permitAll()

                    
                    .requestMatchers(HttpMethod.GET, "/api/anuncios").permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/anuncios/buscar").permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/anuncios/categoria/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/anuncios/tipo/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/anuncios/{id}").permitAll()

                    
                    .requestMatchers(HttpMethod.POST, "/api/anuncios").authenticated() 
                    .requestMatchers(HttpMethod.PUT, "/api/anuncios/**").authenticated()
                    .requestMatchers(HttpMethod.DELETE, "/api/anuncios/**").authenticated()
                    .requestMatchers(HttpMethod.PATCH, "/api/anuncios/**").authenticated()

                    
                    .requestMatchers(HttpMethod.GET, "/api/categorias").permitAll()

                    
                    .requestMatchers("/uploads/**").permitAll()

                    
                    .requestMatchers("/error").permitAll()

                    
                    .anyRequest().authenticated()
                )
                .authenticationProvider(authenticationProvider())
                
                .addFilterBefore(
                    new JwtAuthenticationFilter(jwtService, userDetailsService()),
                    UsernamePasswordAuthenticationFilter.class
                )
                .build();
    }

    @Bean
    public UserDetailsService userDetailsService() {
        return email -> usuarioRepository.findByEmail(email)
                .filter(u -> u.getIsActive()) 
                .map(u -> User.withUsername(u.getEmail())
                        .password(u.getPasswordHash())
                        .authorities("ROLE_" + u.getPerfil().name())
                        .build())
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado ou conta deletada"));
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
            "http://localhost:5173",
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