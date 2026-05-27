package com.reusehub.auth.service;

import com.reusehub.anuncio.exception.RecursoNaoEncontradoException;
import com.reusehub.anuncio.exception.RegraNegocioException;
import com.reusehub.auth.dto.*;
import com.reusehub.auth.model.*;
import com.reusehub.auth.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.*;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
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
        validarDuplicidadeCadastro(request.getEmail(), request.getCpf());

        var usuario = Usuario.builder()
                .name(request.getName())
                .cpf(request.getCpf().replaceAll("[^0-9]", "")) // garante apenas dígitos no banco
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .lgpdConsent(request.getLgpdConsent())
                .lgpdConsentAt(LocalDateTime.now())
                .perfil(Perfil.USUARIO)
                .build();

        usuario = usuarioRepository.save(usuario);
        
        String token = jwtService.gerarToken(buildUserDetails(usuario));

        return toAuthResponse(usuario, token);
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        var usuario = buscarUsuarioPorEmail(request.getEmail());
        validarUsuarioAtivo(usuario);

        String token = jwtService.gerarToken(buildUserDetails(usuario));

        return toAuthResponse(usuario, token);
    }

    @Transactional(readOnly = true)
    public UsuarioRespostaDTO obterPerfilPorEmail(String email) {
        Usuario usuario = buscarUsuarioPorEmail(email);
        return converterParaResposta(usuario);
    }

    @Transactional(readOnly = true)
    public UsuarioRespostaDTO obterPerfil(UUID usuarioId) {
        Usuario usuario = buscarUsuarioPorId(usuarioId);
        return converterParaResposta(usuario);
    }

    @Transactional
    public UsuarioRespostaDTO atualizarPerfilPorEmail(String email, UsuarioAtualizacaoDTO dto) {
        Usuario usuario = buscarUsuarioPorEmail(email);
        atualizarDadosUsuario(usuario, dto);

        Usuario atualizado = usuarioRepository.save(usuario);
        return converterParaResposta(atualizado);
    }

    @Transactional
    public UsuarioRespostaDTO atualizarPerfil(UUID usuarioId, UsuarioAtualizacaoDTO dto) {
        Usuario usuario = buscarUsuarioPorId(usuarioId);
        atualizarDadosUsuario(usuario, dto);

        Usuario atualizado = usuarioRepository.save(usuario);
        return converterParaResposta(atualizado);
    }

    @Transactional
    public void deletarContaPorEmail(String email) {
        Usuario usuario = buscarUsuarioPorEmail(email);
        usuario.setIsActive(false);
        usuarioRepository.save(usuario);
    }

    @Transactional
    public void deletarConta(UUID usuarioId) {
        Usuario usuario = buscarUsuarioPorId(usuarioId);
        usuario.setIsActive(false);
        usuarioRepository.save(usuario);
    }

    private Usuario buscarUsuarioPorEmail(String email) {
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário", email));
    }

    private Usuario buscarUsuarioPorId(UUID id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário", id));
    }

    private void validarDuplicidadeCadastro(String email, String cpf) {
        if (usuarioRepository.existsByEmail(email)) {
            throw new RegraNegocioException("E-mail já cadastrado no sistema.");
        }
        if (usuarioRepository.existsByCpf(cpf)) {
            throw new RegraNegocioException("CPF já cadastrado no sistema.");
        }
    }

    private void validarUsuarioAtivo(Usuario usuario) {
        if (Boolean.TRUE.equals(usuario.getBanido())) {
            throw new RegraNegocioException("Esta conta foi banida permanentemente.");
        }
        if (Boolean.FALSE.equals(usuario.getIsActive())) {
            throw new RegraNegocioException("Esta conta foi desativada e não pode mais ser acessada.");
        }
    }

    private void atualizarDadosUsuario(Usuario usuario, UsuarioAtualizacaoDTO dto) {
        if (dto.getName() != null && !dto.getName().isBlank()) {
            usuario.setName(dto.getName());
        }
        if (dto.getPhone() != null) {
            usuario.setPhone(dto.getPhone());
        }
        if (dto.getBio() != null) {
            usuario.setBio(dto.getBio());
        }
        if (dto.getAvatarUrl() != null && !dto.getAvatarUrl().isBlank()) {
            usuario.setAvatarUrl(dto.getAvatarUrl());
        }
    }

    private UserDetails buildUserDetails(Usuario usuario) {
        return User.withUsername(usuario.getEmail())
                .password(usuario.getPasswordHash())
                .authorities("ROLE_" + usuario.getPerfil().name())
                .build();
    }

    private AuthResponse toAuthResponse(Usuario usuario, String token) {
        return AuthResponse.builder()
                .token(token)
                .id(String.valueOf(usuario.getId()))
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
        dto.setBanido(usuario.getBanido());
        dto.setIsVerified(usuario.getIsVerified());
        dto.setCreatedAt(usuario.getCreatedAt());
        dto.setUpdatedAt(usuario.getUpdatedAt());
        return dto;
    }
}
