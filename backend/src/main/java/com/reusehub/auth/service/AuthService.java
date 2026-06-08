package com.reusehub.auth.service;

import com.reusehub.anuncio.exception.RecursoNaoEncontradoException;
import com.reusehub.anuncio.exception.RegraNegocioException;
import com.reusehub.anuncio.model.Anuncio;
import com.reusehub.anuncio.model.Endereco;
import com.reusehub.anuncio.repository.AnuncioFavoritoRepository;
import com.reusehub.anuncio.repository.AnuncioRepository;
import com.reusehub.anuncio.repository.EnderecoRepository;
import com.reusehub.anuncio.service.StorageService;
import com.reusehub.auth.crypto.SensitiveDataCrypto;
import com.reusehub.auth.dto.*;
import com.reusehub.auth.model.*;
import com.reusehub.auth.repository.CredencialBloqueadaRepository;
import com.reusehub.auth.repository.TokenUsuarioRepository;
import com.reusehub.auth.repository.UsuarioRepository;
import com.reusehub.interesse.repository.InteresseTrocaRepository;
import com.reusehub.notificacao.repository.NotificacaoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final int DIAS_COOLDOWN_REATIVACAO = 3;
    private static final int DIAS_BLOQUEIO_RECADASTRO_EXCLUSAO = 90;

    private final UsuarioRepository usuarioRepository;
    private final CredencialBloqueadaRepository credencialBloqueadaRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final TokenUsuarioRepository tokenUsuarioRepository;
    private final AnuncioRepository anuncioRepository;
    private final InteresseTrocaRepository interesseTrocaRepository;
    private final AnuncioFavoritoRepository anuncioFavoritoRepository;
    private final NotificacaoRepository notificacaoRepository;
    private final EnderecoRepository enderecoRepository;
    private final StorageService storageService;

    @Transactional
    public AuthResponse registrar(RegisterRequest request) {
        String emailNormalizado = SensitiveDataCrypto.normalizarEmail(request.getEmail());
        String cpfNormalizado = SensitiveDataCrypto.normalizarCpf(request.getCpf());
        validarBloqueioCredenciais(emailNormalizado, cpfNormalizado);
        validarDuplicidadeCadastro(emailNormalizado, cpfNormalizado);

        var usuario = Usuario.builder()
                .name(request.getName())
                .cpf(cpfNormalizado)
                .email(emailNormalizado)
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
        String emailNormalizado = SensitiveDataCrypto.normalizarEmail(request.getEmail());
        // Mesma excecao do erro de senha: a mensagem exibida ao usuario e padronizada
        // no GlobalExceptionHandler, evitando revelar se o e-mail esta cadastrado.
        var usuario = usuarioRepository.findByEmail(emailNormalizado)
                .orElseThrow(() -> new BadCredentialsException("Credenciais invalidas"));
        validarUsuarioAtivo(usuario);

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(emailNormalizado, request.getPassword())
        );

        String token = jwtService.gerarToken(buildUserDetails(usuario));
        return toAuthResponse(usuario, token);
    }

    @Transactional
    public AuthResponse reativarConta(LoginRequest request) {
        Usuario usuario = buscarUsuarioPorEmail(SensitiveDataCrypto.normalizarEmail(request.getEmail()));

        if (Boolean.TRUE.equals(usuario.getBanido()) || Boolean.TRUE.equals(usuario.getContaExcluida())) {
            throw new RegraNegocioException("Esta conta nao pode ser reativada.");
        }
        if (Boolean.TRUE.equals(usuario.getIsActive())) {
            throw new RegraNegocioException("Esta conta ja esta ativa. Faca login normalmente.");
        }
        validarCooldownReativacao(usuario);
        if (!passwordEncoder.matches(request.getPassword(), usuario.getPasswordHash())) {
            throw new RegraNegocioException("Credenciais invalidas.");
        }

        usuario.setIsActive(true);
        usuario.setDesativadoEm(null);
        usuarioRepository.save(usuario);

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
    public void desativarContaPorEmail(String email) {
        Usuario usuario = buscarUsuarioPorEmail(email);
        validarEncerramentoPermitido(usuario);
        prepararEncerramento(usuario);

        usuario.setIsActive(false);
        usuario.setDesativadoEm(LocalDateTime.now());
        usuarioRepository.save(usuario);
    }

    @Transactional
    public void deletarContaPorEmail(String email) {
        Usuario usuario = buscarUsuarioPorEmail(email);
        validarEncerramentoPermitido(usuario);
        prepararEncerramento(usuario);

        storageService.excluirImagem(usuario.getAvatarUrl());
        anuncioFavoritoRepository.deleteByUsuarioId(usuario.getId());
        notificacaoRepository.deleteByUsuarioId(usuario.getId());
        anonimizarEnderecos(usuario.getId());
        registrarBloqueioCredenciais(
                usuario,
                CredencialBloqueada.Motivo.CONTA_EXCLUIDA,
                LocalDateTime.now().plusDays(DIAS_BLOQUEIO_RECADASTRO_EXCLUSAO),
                "Conta excluida pelo usuario. Recadastro bloqueado temporariamente."
        );
        anonimizarUsuario(usuario);

        usuarioRepository.save(usuario);
    }

    private void prepararEncerramento(Usuario usuario) {
        UUID usuarioId = usuario.getId();
        tokenUsuarioRepository.invalidarTokensAtivos(usuarioId);
        interesseTrocaRepository.cancelarPendentesRelacionadosAoUsuario(usuarioId);
        anuncioRepository.cancelarPublicacoesDoUsuario(
                usuarioId,
                EnumSet.of(
                        Anuncio.StatusAnuncio.PENDENTE,
                        Anuncio.StatusAnuncio.ATIVO,
                        Anuncio.StatusAnuncio.SUSPENSO
                )
        );
    }

    private void anonimizarUsuario(Usuario usuario) {
        LocalDateTime agora = LocalDateTime.now();
        usuario.setName("Usuario excluido");
        usuario.setEmail("excluido+" + usuario.getId() + "@anonimo.reusehub");
        usuario.setCpf(gerarCpfAnonimo());
        usuario.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString()));
        usuario.setPhone(null);
        usuario.setAvatarUrl(null);
        usuario.setBio(null);
        usuario.setLgpdConsent(false);
        usuario.setLgpdConsentAt(null);
        usuario.setIsVerified(false);
        usuario.setIsActive(false);
        usuario.setContaExcluida(true);
        usuario.setDesativadoEm(agora);
        usuario.setExcluidoEm(agora);
    }

    private String gerarCpfAnonimo() {
        String cpf;
        do {
            long sufixo = Math.floorMod(UUID.randomUUID().getMostSignificantBits(), 10_000_000_000L);
            cpf = "9" + String.format("%010d", sufixo);
        } while (usuarioRepository.existsByCpf(cpf));
        return cpf;
    }

    private void anonimizarEnderecos(UUID usuarioId) {
        for (Endereco endereco : enderecoRepository.findByUsuarioIdOrderByPrincipalDescCriadoEmDesc(usuarioId)) {
            endereco.setCep("00000000");
            endereco.setRua(null);
            endereco.setNumero(null);
            endereco.setComplemento(null);
            endereco.setBairro(null);
            endereco.setCidade("Anonimizada");
            endereco.setUf("--");
            endereco.setLatitude(null);
            endereco.setLongitude(null);
            endereco.setPrincipal(false);
        }
    }

    private void validarEncerramentoPermitido(Usuario usuario) {
        if (usuario.getPerfil() != Perfil.USUARIO) {
            throw new RegraNegocioException("Contas operacionais devem ser gerenciadas por outro administrador.");
        }

        boolean possuiNegociacaoEmAndamento = interesseTrocaRepository.existsNegociacaoEmAndamento(usuario.getId());
        boolean possuiEntregaPendente = anuncioRepository.existsByUsuarioIdAndStatus(
                usuario.getId(),
                Anuncio.StatusAnuncio.RESERVADO
        );

        if (possuiNegociacaoEmAndamento || possuiEntregaPendente) {
            throw new RegraNegocioException(
                    "Conclua ou cancele as negociacoes em andamento antes de encerrar sua conta."
            );
        }
    }

    private Usuario buscarUsuarioPorEmail(String email) {
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuario", email));
    }

    private Usuario buscarUsuarioPorId(UUID id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuario", id));
    }

    private void validarDuplicidadeCadastro(String email, String cpf) {
        if (usuarioRepository.existsByEmail(email)) {
            throw new RegraNegocioException("E-mail ja cadastrado no sistema.");
        }
        if (usuarioRepository.existsByCpf(cpf)) {
            throw new RegraNegocioException("CPF ja cadastrado no sistema.");
        }
    }

    private void validarBloqueioCredenciais(String email, String cpf) {
        String emailHash = SensitiveDataCrypto.emailHash(email);
        String cpfHash = SensitiveDataCrypto.cpfHash(cpf);
        LocalDateTime agora = LocalDateTime.now();

        if (credencialBloqueadaRepository.existsBanimentoAtivoPorEmailOuCpf(
                emailHash,
                cpfHash,
                CredencialBloqueada.Motivo.BANIMENTO,
                agora
        )) {
            throw new RegraNegocioException("Nao e possivel criar uma nova conta com dados vinculados a uma conta banida.");
        }

        if (credencialBloqueadaRepository.existsBloqueioAtivoPorEmailOuCpf(emailHash, cpfHash, agora)) {
            throw new RegraNegocioException("Nao e possivel criar uma nova conta com esses dados no momento.");
        }
    }

    private void validarCooldownReativacao(Usuario usuario) {
        LocalDateTime desativadoEm = usuario.getDesativadoEm();
        if (desativadoEm == null) {
            return;
        }

        LocalDateTime liberadoEm = desativadoEm.plusDays(DIAS_COOLDOWN_REATIVACAO);
        if (LocalDateTime.now().isBefore(liberadoEm)) {
            throw new RegraNegocioException(
                    "Sua conta so podera ser reativada 3 dias apos a desativacao."
            );
        }
    }

    private void registrarBloqueioCredenciais(
            Usuario usuario,
            CredencialBloqueada.Motivo motivo,
            LocalDateTime expiraEm,
            String detalhes
    ) {
        credencialBloqueadaRepository.save(CredencialBloqueada.builder()
                .emailHash(hashEmailUsuario(usuario))
                .cpfHash(hashCpfUsuario(usuario))
                .motivo(motivo)
                .usuarioOrigemId(usuario.getId())
                .expiraEm(expiraEm)
                .detalhes(detalhes)
                .build());
    }

    private String hashEmailUsuario(Usuario usuario) {
        return usuario.getEmailHash() != null
                ? usuario.getEmailHash()
                : SensitiveDataCrypto.emailHash(usuario.getEmail());
    }

    private String hashCpfUsuario(Usuario usuario) {
        return usuario.getCpfHash() != null
                ? usuario.getCpfHash()
                : SensitiveDataCrypto.cpfHash(usuario.getCpf());
    }

    private void validarUsuarioAtivo(Usuario usuario) {
        if (Boolean.TRUE.equals(usuario.getBanido())) {
            throw new RegraNegocioException("Esta conta foi banida permanentemente.");
        }
        if (Boolean.TRUE.equals(usuario.getContaExcluida())) {
            throw new RegraNegocioException("Esta conta foi excluida e nao pode mais ser acessada.");
        }
        if (Boolean.FALSE.equals(usuario.getIsActive())) {
            throw new RegraNegocioException("Esta conta foi desativada. Voce pode reativa-la informando sua senha.");
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
