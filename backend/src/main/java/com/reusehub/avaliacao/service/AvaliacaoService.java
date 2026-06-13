package com.reusehub.avaliacao.service;

import com.reusehub.anuncio.exception.AcessoNegadoException;
import com.reusehub.anuncio.exception.RecursoNaoEncontradoException;
import com.reusehub.anuncio.exception.RegraNegocioException;
import com.reusehub.anuncio.model.Anuncio;
import com.reusehub.anuncio.repository.AnuncioRepository;
import com.reusehub.auth.model.Usuario;
import com.reusehub.auth.repository.UsuarioRepository;
import com.reusehub.avaliacao.dto.AvaliacaoCriacaoDTO;
import com.reusehub.avaliacao.dto.AvaliacaoRespostaDTO;
import com.reusehub.avaliacao.model.Avaliacao;
import com.reusehub.avaliacao.repository.AvaliacaoRepository;
import com.reusehub.interesse.model.InteresseTroca;
import com.reusehub.interesse.repository.InteresseTrocaRepository;
import com.reusehub.shared.service.ConteudoSeguroService;
import com.reusehub.shared.util.NomePublicoUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AvaliacaoService {

    private final AvaliacaoRepository avaliacaoRepository;
    private final UsuarioRepository usuarioRepository;
    private final AnuncioRepository anuncioRepository;
    private final InteresseTrocaRepository interesseTrocaRepository;
    private final ConteudoSeguroService conteudoSeguroService;

    @Transactional
    public AvaliacaoRespostaDTO criar(String emailAvaliador, AvaliacaoCriacaoDTO dto) {
        Usuario avaliador = buscarUsuarioPorEmail(emailAvaliador);
        Usuario avaliado = buscarUsuario(dto.avaliadoId());
        Anuncio anuncio = buscarAnuncio(dto.anuncioId());

        validarPodeAvaliar(avaliador, avaliado, anuncio);
        conteudoSeguroService.validarTextoSeguro(
                dto.comentario(),
                "Seu comentario contem termos que violam as regras da comunidade. Revise o texto antes de enviar."
        );

        if (avaliacaoRepository.existsByAvaliadorIdAndAnuncioId(avaliador.getId(), anuncio.getId())) {
            throw new RegraNegocioException("Voce ja avaliou esta negociacao.");
        }

        Avaliacao avaliacao = avaliacaoRepository.save(Avaliacao.builder()
                .avaliador(avaliador)
                .avaliado(avaliado)
                .anuncio(anuncio)
                .nota(dto.nota())
                .comentario(normalizarComentarioParaSalvar(dto.comentario()))
                .build());

        atualizarReputacao(avaliado);
        return mapear(avaliacao);
    }

    @Transactional(readOnly = true)
    public List<AvaliacaoRespostaDTO> listarRecebidas(UUID usuarioId) {
        return avaliacaoRepository.findByAvaliadoIdAndRemovidoEmIsNullOrderByCriadoEmDesc(usuarioId)
                .stream()
                .map(this::mapear)
                .toList();
    }

    private void validarPodeAvaliar(Usuario avaliador, Usuario avaliado, Anuncio anuncio) {
        if (avaliador.getId().equals(avaliado.getId())) {
            throw new RegraNegocioException("Voce nao pode avaliar a si mesmo.");
        }

        if (anuncio.getStatus() != Anuncio.StatusAnuncio.CONCLUIDO) {
            throw new RegraNegocioException("A avaliacao so e liberada depois que o anuncio e concluido.");
        }

        UUID donoId = anuncio.getUsuario().getId();
        boolean avaliadorEhDono = avaliador.getId().equals(donoId);
        boolean avaliadoEhDono = avaliado.getId().equals(donoId);
        boolean avaliadorAceito = interesseTrocaRepository.existsByAnuncioDesejadoIdAndInteressadoIdAndStatus(
                anuncio.getId(),
                avaliador.getId(),
                InteresseTroca.StatusInteresse.ACEITO
        );
        boolean avaliadoAceito = interesseTrocaRepository.existsByAnuncioDesejadoIdAndInteressadoIdAndStatus(
                anuncio.getId(),
                avaliado.getId(),
                InteresseTroca.StatusInteresse.ACEITO
        );

        boolean interessadoAvaliaDono = avaliadorAceito && avaliadoEhDono;
        boolean donoAvaliaInteressado = avaliadorEhDono && avaliadoAceito;

        if (!interessadoAvaliaDono && !donoAvaliaInteressado) {
            throw new AcessoNegadoException("Somente participantes de uma negociacao aceita podem avaliar.");
        }
    }

    private String normalizarComentarioParaSalvar(String comentario) {
        if (comentario == null) {
            return null;
        }

        String comentarioTratado = comentario.trim();
        return comentarioTratado.isEmpty() ? null : comentarioTratado;
    }

    private void atualizarReputacao(Usuario avaliado) {
        Double media = avaliacaoRepository.calcularMediaDoAvaliado(avaliado.getId());
        avaliado.setReputationScore(media == null
                ? BigDecimal.ZERO
                : BigDecimal.valueOf(media).setScale(2, RoundingMode.HALF_UP));
        usuarioRepository.save(avaliado);
    }

    private Usuario buscarUsuarioPorEmail(String email) {
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuario", email));
    }

    private Usuario buscarUsuario(UUID id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuario", id));
    }

    private Anuncio buscarAnuncio(UUID id) {
        return anuncioRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Anuncio", id));
    }

    private AvaliacaoRespostaDTO mapear(Avaliacao avaliacao) {
        return new AvaliacaoRespostaDTO(
                avaliacao.getId(),
                avaliacao.getAvaliador().getId(),
                NomePublicoUtils.primeiroNome(avaliacao.getAvaliador().getName()),
                avaliacao.getAvaliado().getId(),
                NomePublicoUtils.primeiroNome(avaliacao.getAvaliado().getName()),
                avaliacao.getAnuncio().getId(),
                avaliacao.getAnuncio().getTitulo(),
                avaliacao.getNota(),
                avaliacao.getComentario(),
                avaliacao.getCriadoEm()
        );
    }
}
