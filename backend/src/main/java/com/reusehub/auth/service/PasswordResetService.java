package com.reusehub.auth.service;

import com.reusehub.anuncio.exception.RegraNegocioException;
import com.reusehub.auth.dto.RedefinirSenhaRequest;
import com.reusehub.auth.model.TipoToken;
import com.reusehub.auth.model.TokenUsuario;
import com.reusehub.auth.model.Usuario;
import com.reusehub.auth.repository.TokenUsuarioRepository;
import com.reusehub.auth.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private static final int TOKEN_EXPIRACAO_MINUTOS = 30;

    private final TokenUsuarioRepository tokenRepository;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    /**
     * Inicia o fluxo de recuperação de senha.
     * A resposta é sempre genérica para evitar user enumeration — nunca revelamos
     * se o e-mail está cadastrado ou o status da conta.
     */
    @Transactional
    public void solicitarRecuperacao(String email) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);

        if (usuarioOpt.isEmpty()) {
            log.debug("Solicitação de recuperação para e-mail não cadastrado: {}", email);
            return;
        }

        Usuario usuario = usuarioOpt.get();

        if (contaInacessivel(usuario)) {
            log.debug("Solicitação de recuperação ignorada para conta inacessível: {}", email);
            return;
        }

        tokenRepository.invalidarTokensAntigos(usuario.getId(), TipoToken.RECUPERACAO_SENHA);

        String tokenPuro = UUID.randomUUID().toString();
        String tokenHash = hashSHA256(tokenPuro);

        tokenRepository.save(novoTokenRecuperacao(usuario, tokenHash));

        emailService.enviarEmailRecuperacaoSenha(
                usuario.getEmail(),
                usuario.getName(),
                tokenPuro,
                TOKEN_EXPIRACAO_MINUTOS
        );

        log.info("Solicitação de recuperação de senha processada para: {}", email);
    }

    @Transactional
    public void redefinirSenha(RedefinirSenhaRequest request) {
        if (!request.getNovaSenha().equals(request.getConfirmacaoSenha())) {
            throw new RegraNegocioException("As senhas não coincidem.");
        }

        TokenUsuario tokenEntity = buscarTokenValido(request.getToken());

        Usuario usuario = tokenEntity.getUsuario();
        usuario.setPasswordHash(passwordEncoder.encode(request.getNovaSenha()));
        usuarioRepository.save(usuario);

        tokenEntity.setUsadoEm(LocalDateTime.now());
        tokenRepository.save(tokenEntity);

        log.info("Senha redefinida com sucesso para usuário: {}", usuario.getEmail());
    }

    private boolean contaInacessivel(Usuario usuario) {
        return Boolean.TRUE.equals(usuario.getBanido())
                || Boolean.FALSE.equals(usuario.getIsActive());
    }

    private TokenUsuario novoTokenRecuperacao(Usuario usuario, String tokenHash) {
        return TokenUsuario.builder()
                .usuario(usuario)
                .token(tokenHash)
                .tipo(TipoToken.RECUPERACAO_SENHA)
                .expiraEm(LocalDateTime.now().plusMinutes(TOKEN_EXPIRACAO_MINUTOS))
                .build();
    }

    private TokenUsuario buscarTokenValido(String tokenPuro) {
        String tokenHash = hashSHA256(tokenPuro);

        TokenUsuario tokenEntity = tokenRepository
                .findByTokenAndTipo(tokenHash, TipoToken.RECUPERACAO_SENHA)
                .orElseThrow(() -> new RegraNegocioException("Token inválido ou expirado."));

        if (tokenEntity.getUsadoEm() != null) {
            throw new RegraNegocioException("Este link de recuperação já foi utilizado.");
        }

        if (LocalDateTime.now().isAfter(tokenEntity.getExpiraEm())) {
            throw new RegraNegocioException("Token inválido ou expirado.");
        }

        return tokenEntity;
    }

    private String hashSHA256(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Erro interno ao processar token de segurança.", e);
        }
    }
}
