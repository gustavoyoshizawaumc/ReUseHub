package com.reusehub.anuncio.visualizacao.service;

import com.reusehub.anuncio.exception.RecursoNaoEncontradoException;
import com.reusehub.anuncio.model.Anuncio;
import com.reusehub.anuncio.repository.AnuncioRepository;
import com.reusehub.anuncio.visualizacao.dto.RegistroVisualizacaoComando;
import com.reusehub.anuncio.visualizacao.model.VisualizacaoAnuncio;
import com.reusehub.anuncio.visualizacao.repository.VisualizacaoAnuncioRepository;
import com.reusehub.auth.model.Usuario;
import com.reusehub.auth.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class RegistroVisualizacaoService {

    static final Duration JANELA_DEDUPE = Duration.ofHours(1);

    private static final String RECURSO_ANUNCIO = "anuncio";

    private final VisualizacaoAnuncioRepository visualizacaoRepository;
    private final AnuncioRepository anuncioRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional
    public void registrarSeValido(RegistroVisualizacaoComando comando) {
        Anuncio anuncio = carregarAnuncio(comando.anuncioId());
        Optional<Usuario> usuarioLogado = resolverUsuarioLogado(comando.emailUsuario());

        if (eDono(anuncio, usuarioLogado)) {
            log.debug("Visualizacao descartada (dono) anuncio={}", anuncio.getId());
            return;
        }

        if (existeVisualizacaoRecente(comando, usuarioLogado)) {
            log.debug("Visualizacao descartada (dedupe 1h) anuncio={}", anuncio.getId());
            return;
        }

        VisualizacaoAnuncio visualizacao = montarRegistro(comando, anuncio, usuarioLogado);
        visualizacaoRepository.save(visualizacao);
        anuncioRepository.incrementarTotalVisualizacoes(anuncio.getId());
    }

    private Anuncio carregarAnuncio(UUID anuncioId) {
        return anuncioRepository.findById(anuncioId)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        RECURSO_ANUNCIO, anuncioId.toString()
                ));
    }

    private Optional<Usuario> resolverUsuarioLogado(String emailUsuario) {
        if (emailUsuario == null || emailUsuario.isBlank()) {
            return Optional.empty();
        }
        return usuarioRepository.findByEmail(emailUsuario);
    }

    private boolean eDono(Anuncio anuncio, Optional<Usuario> usuarioLogado) {
        return usuarioLogado
                .map(u -> u.getId().equals(anuncio.getUsuario().getId()))
                .orElse(false);
    }

    private boolean existeVisualizacaoRecente(
            RegistroVisualizacaoComando comando,
            Optional<Usuario> usuarioLogado
    ) {
        LocalDateTime limiteInferior = LocalDateTime.now().minus(JANELA_DEDUPE);

        if (usuarioLogado.isPresent()) {
            return visualizacaoRepository.existeVisualizacaoRecenteDeUsuario(
                    usuarioLogado.get().getId(), comando.anuncioId(), limiteInferior
            );
        }
        if (comando.anonId() != null && !comando.anonId().isBlank()) {
            return visualizacaoRepository.existeVisualizacaoRecenteDeAnonimo(
                    comando.anonId(), comando.anuncioId(), limiteInferior
            );
        }
        if (comando.ipAddress() != null && !comando.ipAddress().isBlank()) {
            return visualizacaoRepository.existeVisualizacaoRecenteDeIp(
                    comando.ipAddress(), comando.anuncioId(), limiteInferior
            );
        }
        return false;
    }

    private VisualizacaoAnuncio montarRegistro(
            RegistroVisualizacaoComando comando,
            Anuncio anuncio,
            Optional<Usuario> usuarioLogado
    ) {
        return VisualizacaoAnuncio.builder()
                .anuncio(anuncio)
                .usuario(usuarioLogado.orElse(null))
                .anonId(usuarioLogado.isEmpty() ? comando.anonId() : null)
                .ipAddress(comando.ipAddress())
                .origem(comando.origem())
                .build();
    }
}
