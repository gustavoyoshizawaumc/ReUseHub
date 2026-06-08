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
import com.reusehub.avaliacao.dto.AvaliacaoRespostaDTO;
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
import com.reusehub.notificacao.service.NotificacaoService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class ModeracaoService {

    private static final LocalDateTime INICIO_FILTRO = LocalDate.of(1900, 1, 1).atStartOfDay();
    private static final LocalDateTime FIM_FILTRO = LocalDate.of(9999, 12, 31).atStartOfDay();
    private static final UUID UUID_SENTINELA = new UUID(0, 0);

    private final UsuarioRepository usuarioRepository;
    private final AnuncioRepository anuncioRepository;
    private final ImagemAnuncioRepository imagemAnuncioRepository;
    private final DenunciaAnuncioRepository denunciaRepository;
    private final HistoricoModeracaoRepository historicoRepository;
    private final AvaliacaoRepository avaliacaoRepository;
    private final NotificacaoService notificacaoService;

    public DenunciaRespostaDTO criarDenuncia(String emailUsuario, DenunciaCriacaoDTO dto) {
        Usuario denunciante = buscarUsuarioPorEmail(emailUsuario);
        Anuncio anuncio = buscarAnuncio(dto.anuncioId());

        if (anuncio.getUsuario().getId().equals(denunciante.getId())) {
            throw new RegraNegocioException("Voce nao pode denunciar o proprio anuncio.");
        }

        if (denunciaRepository.existsByDenuncianteIdAndAnuncioId(denunciante.getId(), anuncio.getId())) {
            throw new RegraNegocioException("Voce ja denunciou este anuncio.");
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
    public Page<DenunciaRespostaDTO> listarDenuncias(
            String termo,
            DenunciaAnuncio.StatusDenuncia status,
            Pageable pageable
    ) {
        return denunciaRepository.buscarParaModeracao(
                        normalizarPesquisa(termo),
                        status == null ? "" : status.name(),
                        pageable
                )
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

    public DenunciaRespostaDTO suspenderAnuncioPorDenuncia(UUID denunciaId, String emailModerador, String justificativa) {
        Usuario moderador = validarModerador(emailModerador);
        DenunciaAnuncio denuncia = buscarDenuncia(denunciaId);
        Anuncio anuncio = denuncia.getAnuncio();
        String motivoSuspensao = validarMensagemSuspensao(justificativa);

        anuncio.setStatus(Anuncio.StatusAnuncio.SUSPENSO);
        anuncio.setMotivoSuspensao(motivoSuspensao);
        denuncia.setStatus(DenunciaAnuncio.StatusDenuncia.ANALISADA);

        anuncioRepository.save(anuncio);
        DenunciaAnuncio denunciaSalva = denunciaRepository.save(denuncia);
        registrar(moderador, "DENUNCIA_ANALISADA_COM_SUSPENSAO", "DENUNCIA", denunciaId, motivoSuspensao);
        registrar(moderador, "ANUNCIO_SUSPENSO", "ANUNCIO", anuncio.getId(), motivoSuspensao);
        notificarSuspensao(anuncio, motivoSuspensao);

        return mapearDenuncia(denunciaSalva);
    }

    @Transactional(readOnly = true)
    public List<AnuncioSuspeitoDTO> listarSuspeitos(
            long minimoDenuncias,
            String termo,
            Anuncio.StatusAnuncio status
    ) {
        long minimo = Math.max(2, minimoDenuncias);
        return denunciaRepository.listarAnunciosSuspeitos(
                        minimo,
                        normalizarPesquisa(termo),
                        status == null ? "" : status.name()
                ).stream()
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
        String motivoSuspensao = validarMensagemSuspensao(justificativa);
        anuncio.setStatus(Anuncio.StatusAnuncio.SUSPENSO);
        anuncio.setMotivoSuspensao(motivoSuspensao);
        anuncioRepository.save(anuncio);
        registrar(moderador, "ANUNCIO_SUSPENSO", "ANUNCIO", anuncioId, motivoSuspensao);
        notificarSuspensao(anuncio, motivoSuspensao);
        return mapearSuspeito(anuncio);
    }

    public AnuncioSuspeitoDTO reativarAnuncio(UUID anuncioId, String emailModerador, String justificativa) {
        Usuario moderador = validarModerador(emailModerador);
        Anuncio anuncio = buscarAnuncio(anuncioId);
        anuncio.setStatus(Anuncio.StatusAnuncio.ATIVO);
        anuncio.setMotivoSuspensao(null);
        anuncioRepository.save(anuncio);
        registrar(moderador, "ANUNCIO_REATIVADO", "ANUNCIO", anuncioId, justificativa);
        return mapearSuspeito(anuncio);
    }

    public AnuncioSuspeitoDTO reprovarDefinitivo(UUID anuncioId, String emailModerador, String justificativa) {
        Usuario moderador = validarModerador(emailModerador);
        Anuncio anuncio = buscarAnuncio(anuncioId);
        anuncio.setStatus(Anuncio.StatusAnuncio.REPROVADO);
        anuncio.setMotivoSuspensao(null);
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
    public Page<AvaliacaoRespostaDTO> listarAvaliacoes(
            String termo,
            Integer nota,
            LocalDate criadoDe,
            LocalDate criadoAte,
            Pageable pageable
    ) {
        return avaliacaoRepository.buscarParaModeracao(
                        normalizarPesquisa(termo),
                        nota == null ? 0 : nota,
                        inicioDoDia(criadoDe),
                        inicioDoDiaSeguinte(criadoAte),
                        pageable
                )
                .map(this::mapearAvaliacao);
    }

    @Transactional(readOnly = true)
    public Page<HistoricoModeracaoDTO> meuHistorico(
            String emailModerador,
            String termo,
            String acao,
            LocalDate criadoDe,
            LocalDate criadoAte,
            Pageable pageable
    ) {
        Usuario moderador = validarModerador(emailModerador);
        return historicoRepository.buscar(
                        moderador.getId(),
                        UUID_SENTINELA,
                        normalizarPesquisa(termo),
                        normalizarPesquisa(acao),
                        inicioDoDia(criadoDe),
                        inicioDoDiaSeguinte(criadoAte),
                        pageable
                )
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
        Anuncio anuncio = denuncia.getAnuncio();
        return new DenunciaRespostaDTO(
                denuncia.getId(),
                anuncioId,
                anuncio.getTitulo(),
                imagensDoAnuncio(anuncioId),
                anuncio.getUsuario().getName(),
                anuncio.getStatus() != null ? anuncio.getStatus().name() : null,
                anuncio.getTipo() != null ? anuncio.getTipo().name() : null,
                anuncio.getCategoria() != null ? anuncio.getCategoria().getNome() : null,
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

    private AvaliacaoRespostaDTO mapearAvaliacao(Avaliacao avaliacao) {
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

    private List<String> imagensDoAnuncio(UUID anuncioId) {
        List<ImagemAnuncio> imagens = imagemAnuncioRepository.findByAnuncioIdOrderByOrdemExibicaoAsc(anuncioId);
        if (imagens == null) {
            return List.of();
        }
        return imagens.stream()
                .map(ImagemAnuncio::getUrlImagem)
                .toList();
    }

    private String validarMensagemSuspensao(String justificativa) {
        if (justificativa == null || justificativa.isBlank()) {
            throw new RegraNegocioException("Informe o motivo da suspensao para o anunciante.");
        }
        return justificativa.trim();
    }

    private void notificarSuspensao(Anuncio anuncio, String motivoSuspensao) {
        notificacaoService.criar(
                anuncio.getUsuario(),
                "ANUNCIO_SUSPENSO",
                "Anuncio suspenso",
                "Seu anuncio \"" + anuncio.getTitulo() + "\" foi suspenso pela moderacao. Motivo: " + motivoSuspensao,
                anuncio.getId(),
                "ANUNCIO"
        );
    }

    public void notificarReprovacao(Anuncio anuncio, String motivoReprovacao) {
        notificacaoService.criar(
                anuncio.getUsuario(),
                "ANUNCIO_REPROVADO",
                "Anuncio reprovado",
                "Seu anuncio \"" + anuncio.getTitulo() + "\" foi reprovado pela moderacao. Motivo: " + motivoReprovacao,
                anuncio.getId(),
                "ANUNCIO"
        );
    }

    private String normalizarPesquisa(String valor) {
        return valor == null || valor.isBlank() ? "" : valor.trim();
    }

    private LocalDateTime inicioDoDia(LocalDate data) {
        return data != null ? data.atStartOfDay() : INICIO_FILTRO;
    }

    private LocalDateTime inicioDoDiaSeguinte(LocalDate data) {
        return data != null ? data.plusDays(1).atStartOfDay() : FIM_FILTRO;
    }
}
