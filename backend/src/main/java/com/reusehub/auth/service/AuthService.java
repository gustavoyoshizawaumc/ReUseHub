package com.reusehub.auth.service;

import com.reusehub.auth.dto.*;
import com.reusehub.auth.model.*;
import com.reusehub.auth.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponse registrar(RegisterRequest request) {
        System.out.println("📝 Tentando registrar: " + request.getEmail());

        String cpfLimpo = request.getCpf() != null ? request.getCpf().replaceAll("[^0-9]", "") : null;
        String telefoneLimpo = request.getPhone() != null ? request.getPhone().replaceAll("[^0-9]", "") : null;


        if (usuarioRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("E-mail já cadastrado");
        }


        if (usuarioRepository.existsByCpf(request.getCpf())) {
            throw new IllegalArgumentException("CPF já cadastrado");
        }

        var usuario = Usuario.builder()
                .name(request.getName())
                .cpf(request.getCpf())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .lgpdConsent(request.getLgpdConsent())
                .lgpdConsentAt(LocalDateTime.now())
                .perfil(Perfil.USUARIO)
                .build();

        usuario = usuarioRepository.save(usuario);

        var token = jwtService.gerarToken(buildUserDetails(usuario));

        return toAuthResponse(usuario, token);
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        var usuario = usuarioRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));

        var token = jwtService.gerarToken(buildUserDetails(usuario));

        return toAuthResponse(usuario, token);
    }

    private org.springframework.security.core.userdetails.UserDetails buildUserDetails(Usuario usuario) {
        return org.springframework.security.core.userdetails.User
                .withUsername(usuario.getEmail())
                .password(usuario.getPasswordHash())
                .authorities(usuario.getPerfil().name())
                .build();
    }

    private AuthResponse toAuthResponse(Usuario usuario, String token) {
        return AuthResponse.builder()
                .token(token)
                .id(usuario.getId().toString())
                .name(usuario.getName())
                .cpf(usuario.getCpf())
                .email(usuario.getEmail())
                .phone(usuario.getPhone())
                .avatarUrl(usuario.getAvatarUrl())
                .bio(usuario.getBio())
                .perfil(usuario.getPerfil())
                .reputationScore(usuario.getReputationScore())
                .isActive(usuario.getIsActive())
                .isVerified(usuario.getIsVerified())
                .lgpdConsent(usuario.getLgpdConsent())
                .lgpdConsentAt(usuario.getLgpdConsentAt())
                .createdAt(usuario.getCreatedAt())
                .updatedAt(usuario.getUpdatedAt())
                .build();
    }
}