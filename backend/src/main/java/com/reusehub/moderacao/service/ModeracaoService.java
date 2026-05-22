package com.reusehub.moderacao.service;

import com.reusehub.anuncio.exception.AcessoNegadoException;
import com.reusehub.anuncio.exception.RecursoNaoEncontradoException;
import com.reusehub.anuncio.exception.RegraNegocioException;
import com.reusehub.anuncio.model.Anuncio;
import com.reusehub.anuncio.model.ImagemAnuncio;
import com.reusehub.anuncio.repository.AnuncioRepository;
import com.reusehub.anuncio.repository.ImagemAnuncioRepository;
import com.reusehub.auth.model.Perfil;
import com.reusehub.auth.model.Usuario;
import com.reusehub.auth.repository.UsuarioRepository;
import com.reusehub.avaliacao.model.Avaliacao;
import com.reusehub.avaliacao.repository.AvaliacaoRepository;
import com.reusehub.denuncia.dto.DenunciaCriacaoDTO;
import com.reusehub.denuncia.dto.DenunciaRespostaDTO;
import com.reusehub.denuncia.model.DenunciaAnuncio;
import com.reusehub.denuncia.repository.DenunciaAnuncioRepository;
import com.reusehub.moderacao.dto.AnuncioSuspeitoDTO;
import com.reusehub.moderacao.dto.HistoricoModeracaoDTO;
import com.reusehub.moderacao.model.HistoricoModeracao;
import com.reusehub.moderacao.repository.HistoricoModeracaoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
@Transactional
public class ModeracaoService {

    private final UsuarioRepository usuarioRepository;
    private final AnuncioRepository anuncioRepository;
    private final ImagemAnuncioRepository imagemAnuncioRepository;
    private final DenunciaAnuncioRepository denunciaRepository;
    private final HistoricoModeracaoRepository historicoRepository;
    private final AvaliacaoRepository avaliacaoRepository;

    public DenunciaRespostaDTO criarDenuncia(String emailUsuario, DenunciaCriacaoDTO dto) {
        Usuario denunciante = buscarUsuarioPorEmail(emailUsuario);
        Anuncio anuncio = buscarAnuncio(dto.anuncioId());

        if (anuncio.getUsuario().getId().equals(denunciante.getId())) {
            throw new RegraNegocioException("Voce nao pode denunciar o proprio anuncio.");
        }

        DenunciaAnuncio denuncia = DenunciaAnuncio.builder()
                .denunciante(denunciante)
                .anuncio(anuncio)
                .motivo(dto.motivo())
                .descricao(dto.descricao())
                .status(DenunciaAnuncio.StatusDenuncia.ABERTA)
                .build();

        return mapearDenuncia(denunciaRepository.save(denuncia));
    }

    @Transactional(readOnly = true)
    public Page<DenunciaRespostaDTO> listarDenuncias(DenunciaAnuncio.StatusDenuncia status, Pageable pageable) {
        return denunciaRepository.findByStatusOrderByCriadoEmDesc(status, pageable)
                .map(this::mapearDenuncia);
    }

    public DenunciaRespostaDTO analisarDenuncia(UUID denunciaId, String emailModerador, String justificativa) {
        Usuario moderador = validarModerador(emailModerador);
        DenunciaAnuncio denuncia = buscarDenuncia(denunciaId);
        denuncia.setStatus(DenunciaAnuncio.StatusDenuncia.ANALISADA);
        registrar(moderador, "DENUNCIA_ANALISADA", "DENUNCIA", denunciaId, justificativa);
        return mapearDenuncia(denunciaRepository.save(denuncia));
    }

    public DenunciaRespostaDTO descartarDenuncia(UUID denunciaId, String emailModerador, String justificativa) {
        Usuario moderador = validarModerador(emailModerador);
        DenunciaAnuncio denuncia = buscarDenuncia(denunciaId);
        denuncia.setStatus(DenunciaAnuncio.StatusDenuncia.DESCARTADA);
        registrar(moderador, "DENUNCIA_DESCARTADA", "DENUNCIA", denunciaId, justificativa);
        return mapearDenuncia(denunciaRepository.save(denuncia));
    }

    @Transactional(readOnly = true)
    public List<AnuncioSuspeitoDTO> listarSuspeitos(long minimoDenuncias) {
        long minimo = Math.max(1, minimoDenuncias);
        return denunciaRepository.listarAnunciosSuspeitos(minimo).stream()
                .map(row -> {
                    UUID anuncioId = (UUID) row[0];
                    long total = (Long) row[1];
                    Anuncio anuncio = buscarAnuncio(anuncioId);
                    return new AnuncioSuspeitoDTO(
                            anuncio.getId(),
                            anuncio.getTitulo(),
                            anuncio.getUsuario().getName(),
                            anuncio.getStatus(),
                            total,
                            imagensDoAnuncio(anuncio.getId())
                    );
                })
                .toList();
    }

    public AnuncioSuspeitoDTO suspenderAnuncio(UUID anuncioId, String emailModerador, String justificativa) {
        Usuario moderador = validarModerador(emailModerador);
        Anuncio anuncio = buscarAnuncio(anuncioId);
        anuncio.setStatus(Anuncio.StatusAnuncio.SUSPENSO);
        anuncioRepository.save(anuncio);
        registrar(moderador, "ANUNCIO_SUSPENSO", "ANUNCIO", anuncioId, justificativa);
        return mapearSuspeito(anuncio);
    }

    public AnuncioSuspeitoDTO reativarAnuncio(UUID anuncioId, String emailModerador, String justificativa) {
        Usuario moderador = validarModerador(emailModerador);
        Anuncio anuncio = buscarAnuncio(anuncioId);
        anuncio.setStatus(Anuncio.StatusAnuncio.ATIVO);
        anuncioRepository.save(anuncio);
        registrar(moderador, "ANUNCIO_REATIVADO", "ANUNCIO", anuncioId, justificativa);
        return mapearSuspeito(anuncio);
    }

    public AnuncioSuspeitoDTO reprovarDefinitivo(UUID anuncioId, String emailModerador, String justificativa) {
        Usuario moderador = validarModerador(emailModerador);
        Anuncio anuncio = buscarAnuncio(anuncioId);
        anuncio.setStatus(Anuncio.StatusAnuncio.REPROVADO);
        anuncioRepository.save(anuncio);
        registrar(moderador, "ANUNCIO_REPROVADO", "ANUNCIO", anuncioId, justificativa);
        return mapearSuspeito(anuncio);
    }

    public void removerAvaliacao(UUID avaliacaoId, String emailModerador, String justificativa) {
        Usuario moderador = validarModerador(emailModerador);
        Avaliacao avaliacao = avaliacaoRepository.findById(avaliacaoId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Avaliacao", avaliacaoId));
        Usuario avaliado = avaliacao.getAvaliado();
        avaliacaoRepository.delete(avaliacao);
        Double media = avaliacaoRepository.calcularMediaDoAvaliado(avaliado.getId());
        avaliado.setReputationScore(media == null
                ? BigDecimal.ZERO
                : BigDecimal.valueOf(media).setScale(2, RoundingMode.HALF_UP));
        usuarioRepository.save(avaliado);
        registrar(moderador, "AVALIACAO_REMOVIDA", "AVALIACAO", avaliacaoId, justificativa);
    }

    @Transactional(readOnly = true)
    public Page<HistoricoModeracaoDTO> meuHistorico(String emailModerador, Pageable pageable) {
        Usuario moderador = validarModerador(emailModerador);
        return historicoRepository.findByModeradorIdOrderByCriadoEmDesc(moderador.getId(), pageable)
                .map(this::mapearHistorico);
    }

    public void registrar(Usuario moderador, String acao, String alvoTipo, UUID alvoId, String detalhes) {
        historicoRepository.save(HistoricoModeracao.builder()
                .moderador(moderador)
                .acao(acao)
                .alvoTipo(alvoTipo)
                .alvoId(alvoId)
                .detalhes(detalhes)
                .build());
    }

    private Usuario validarModerador(String email) {
        Usuario usuario = buscarUsuarioPorEmail(email);
        if (usuario.getPerfil() != Perfil.MODERADOR && usuario.getPerfil() != Perfil.ADMIN) {
            throw new AcessoNegadoException("Acesso negado: usuario sem permissao de moderacao.");
        }
        return usuario;
    }

    private Usuario buscarUsuarioPorEmail(String email) {
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuario", email));
    }

    private Anuncio buscarAnuncio(UUID id) {
        return anuncioRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Anuncio", id));
    }

    private DenunciaAnuncio buscarDenuncia(UUID id) {
        return denunciaRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Denuncia", id));
    }

    private DenunciaRespostaDTO mapearDenuncia(DenunciaAnuncio denuncia) {
        UUID anuncioId = denuncia.getAnuncio().getId();
        return new DenunciaRespostaDTO(
                denuncia.getId(),
                anuncioId,
                denuncia.getAnuncio().getTitulo(),
                imagensDoAnuncio(anuncioId),
                denuncia.getDenunciante().getId(),
                denuncia.getDenunciante().getName(),
                denuncia.getMotivo(),
                denuncia.getDescricao(),
                denuncia.getStatus(),
                denuncia.getCriadoEm(),
                denunciaRepository.countByAnuncioIdAndStatus(anuncioId, DenunciaAnuncio.StatusDenuncia.ABERTA)
        );
    }

    private AnuncioSuspeitoDTO mapearSuspeito(Anuncio anuncio) {
        return new AnuncioSuspeitoDTO(
                anuncio.getId(),
                anuncio.getTitulo(),
                anuncio.getUsuario().getName(),
                anuncio.getStatus(),
                denunciaRepository.countByAnuncioIdAndStatus(anuncio.getId(), DenunciaAnuncio.StatusDenuncia.ABERTA),
                imagensDoAnuncio(anuncio.getId())
        );
    }

    private HistoricoModeracaoDTO mapearHistorico(HistoricoModeracao historico) {
        return new HistoricoModeracaoDTO(
                historico.getId(),
                historico.getModerador().getId(),
                historico.getModerador().getName(),
                historico.getAcao(),
                historico.getAlvoTipo(),
                historico.getAlvoId(),
                historico.getDetalhes(),
                historico.getCriadoEm()
        );
    }

    private List<String> imagensDoAnuncio(UUID anuncioId) {
        return imagemAnuncioRepository.findByAnuncioIdOrderByOrdemExibicaoAsc(anuncioId)
                .stream()
                .map(ImagemAnuncio::getUrlImagem)
                .toList();
    }
}
