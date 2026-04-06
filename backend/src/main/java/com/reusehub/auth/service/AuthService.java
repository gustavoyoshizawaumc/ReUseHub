package com.reusehub.auth.service;

import com.reusehub.auth.dto.*;
import com.reusehub.auth.model.*;
import com.reusehub.auth.repository.UsuarioRepository;
import com.reusehub.shared.exception.EntidadeNaoEncontradaException;

import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponse registrar(RegisterRequest request) {
        System.out.println("Tentando registrar: " + request.getEmail());

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

        if (!usuario.getIsActive()) {
            throw new IllegalArgumentException("Sua conta foi deletada e não pode mais ser acessada");
        }

        var token = jwtService.gerarToken(buildUserDetails(usuario));

        return toAuthResponse(usuario, token);
    }

    public UsuarioRespostaDTO obterPerfilPorEmail(String email) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new EntidadeNaoEncontradaException("Usuário não encontrado"));
        return converterParaResposta(usuario);
    }

    public UsuarioRespostaDTO obterPerfil(UUID usuarioId) {
        Usuario usuario = buscarPorId(usuarioId);
        return converterParaResposta(usuario);
    }

    @Transactional
    public UsuarioRespostaDTO atualizarPerfilPorEmail(String email, UsuarioAtualizacaoDTO dto) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new EntidadeNaoEncontradaException("Usuário não encontrado"));

        if (dto.getName() != null && !dto.getName().isEmpty()) {
            usuario.setName(dto.getName());
        }
        if (dto.getPhone() != null) {
            usuario.setPhone(dto.getPhone());
        }
        if (dto.getBio() != null) {
            usuario.setBio(dto.getBio());
        }
        if (dto.getAvatarUrl() != null && !dto.getAvatarUrl().isEmpty()) {
            usuario.setAvatarUrl(dto.getAvatarUrl());
            System.out.println("Avatar URL salvo no banco: " + dto.getAvatarUrl());
        }

        Usuario atualizado = usuarioRepository.save(usuario);
        return converterParaResposta(atualizado);
    }

    public UsuarioRespostaDTO atualizarPerfil(UUID usuarioId, UsuarioAtualizacaoDTO dto) {
        Usuario usuario = buscarPorId(usuarioId);

        usuario.setName(dto.getName());
        usuario.setPhone(dto.getPhone());
        usuario.setBio(dto.getBio());
        usuario.setAvatarUrl(dto.getAvatarUrl());

        Usuario atualizado = usuarioRepository.save(usuario);
        return converterParaResposta(atualizado);
    }

    public void deletarContaPorEmail(String email) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new EntidadeNaoEncontradaException("Usuário não encontrado"));
        usuario.setIsActive(false);
        usuarioRepository.save(usuario);
    }

    public void deletarConta(UUID usuarioId) {
        Usuario usuario = buscarPorId(usuarioId);
        usuario.setIsActive(false);
        usuarioRepository.save(usuario);
    }

    // 

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

    private UsuarioRespostaDTO converterParaResposta(Usuario usuario) {
        UsuarioRespostaDTO dto = new UsuarioRespostaDTO();
        dto.setId(usuario.getId());
        dto.setName(usuario.getName());
        dto.setEmail(usuario.getEmail());
        dto.setPhone(usuario.getPhone());
        dto.setCpf(usuario.getCpf());
        dto.setAvatarUrl(usuario.getAvatarUrl());
        dto.setBio(usuario.getBio());
        dto.setReputationScore(usuario.getReputationScore());
        dto.setIsActive(usuario.getIsActive());
        dto.setIsVerified(usuario.getIsVerified());
        dto.setCreatedAt(usuario.getCreatedAt());
        dto.setUpdatedAt(usuario.getUpdatedAt());
        return dto;
    }

    private Usuario buscarPorId(UUID id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new EntidadeNaoEncontradaException("Usuário não encontrado: " + id));
    }
}