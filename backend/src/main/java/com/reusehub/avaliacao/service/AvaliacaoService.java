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

    @Transactional
    public AvaliacaoRespostaDTO criar(String emailAvaliador, AvaliacaoCriacaoDTO dto) {
        Usuario avaliador = buscarUsuarioPorEmail(emailAvaliador);
        Usuario avaliado = buscarUsuario(dto.avaliadoId());
        Anuncio anuncio = buscarAnuncio(dto.anuncioId());

        validarPodeAvaliar(avaliador, avaliado, anuncio);

        if (avaliacaoRepository.existsByAvaliadorIdAndAnuncioId(avaliador.getId(), anuncio.getId())) {
            throw new RegraNegocioException("Você já avaliou esta negociação.");
        }

        Avaliacao avaliacao = avaliacaoRepository.save(Avaliacao.builder()
                .avaliador(avaliador)
                .avaliado(avaliado)
                .anuncio(anuncio)
                .nota(dto.nota())
                .comentario(dto.comentario())
                .build());

        atualizarReputacao(avaliado);
        return mapear(avaliacao);
    }

    @Transactional(readOnly = true)
    public List<AvaliacaoRespostaDTO> listarRecebidas(UUID usuarioId) {
        return avaliacaoRepository.findByAvaliadoIdOrderByCriadoEmDesc(usuarioId)
                .stream()
                .map(this::mapear)
                .toList();
    }

    private void validarPodeAvaliar(Usuario avaliador, Usuario avaliado, Anuncio anuncio) {
        if (avaliador.getId().equals(avaliado.getId())) {
            throw new RegraNegocioException("Você não pode avaliar a si mesmo.");
        }

        if (anuncio.getStatus() != Anuncio.StatusAnuncio.CONCLUIDO) {
            throw new RegraNegocioException("A avaliação só é liberada depois que o anúncio é concluído.");
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
            throw new AcessoNegadoException("Somente participantes de uma negociação aceita podem avaliar.");
        }
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
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário", email));
    }

    private Usuario buscarUsuario(UUID id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário", id));
    }

    private Anuncio buscarAnuncio(UUID id) {
        return anuncioRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Anúncio", id));
    }

    private AvaliacaoRespostaDTO mapear(Avaliacao avaliacao) {
        return new AvaliacaoRespostaDTO(
                avaliacao.getId(),
                avaliacao.getAvaliador().getId(),
                avaliacao.getAvaliador().getName(),
                avaliacao.getAvaliado().getId(),
                avaliacao.getAvaliado().getName(),
                avaliacao.getAnuncio().getId(),
                avaliacao.getAnuncio().getTitulo(),
                avaliacao.getNota(),
                avaliacao.getComentario(),
                avaliacao.getCriadoEm()
        );
    }
}
