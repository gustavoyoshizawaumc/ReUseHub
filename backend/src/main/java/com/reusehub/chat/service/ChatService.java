package com.reusehub.chat.service;

import com.reusehub.chat.document.Conversa;
import com.reusehub.chat.dto.ConversaRespostaDTO;
import com.reusehub.chat.dto.IniciarConversaDTO;
import com.reusehub.chat.dto.ListaConversasDTO;
import com.reusehub.chat.dto.MensagemCriacaoDTO;
import com.reusehub.chat.repository.ChatRepository;
import com.reusehub.anuncio.exception.RecursoNaoEncontradoException;
import com.reusehub.anuncio.exception.RegraNegocioException;
import com.reusehub.anuncio.exception.AcessoNegadoException;
import com.reusehub.anuncio.model.Anuncio;
import com.reusehub.anuncio.model.ImagemAnuncio;
import com.reusehub.anuncio.repository.AnuncioRepository;
import com.reusehub.anuncio.repository.ImagemAnuncioRepository;
import com.reusehub.auth.model.Usuario;
import com.reusehub.auth.repository.UsuarioRepository;
import com.reusehub.avaliacao.repository.AvaliacaoRepository;
import com.reusehub.interesse.model.InteresseTroca;
import com.reusehub.interesse.repository.InteresseTrocaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class ChatService {

    private final ChatRepository chatRepository;
    private final UsuarioRepository usuarioRepository;
    private final AnuncioRepository anuncioRepository;
    private final ImagemAnuncioRepository imagemAnuncioRepository;
    private final InteresseTrocaRepository interesseTrocaRepository;
    private final AvaliacaoRepository avaliacaoRepository;

    private Usuario buscarUsuarioPorEmail(String email) {
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário", email));
    }

    private Usuario buscarUsuarioPorId(String id) {
        try {
            return usuarioRepository.findById(UUID.fromString(id))
                    .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário", id));
        } catch (IllegalArgumentException e) {
            throw new RecursoNaoEncontradoException("Usuário", id);
        }
    }

    private Anuncio buscarAnuncioPorId(String id) {
        if (id == null || id.isBlank()) {
            throw new RecursoNaoEncontradoException("Anúncio", id);
        }

        try {
            return anuncioRepository.findById(UUID.fromString(id))
                    .orElseThrow(() -> new RecursoNaoEncontradoException("Anúncio", id));
        } catch (IllegalArgumentException e) {
            throw new RecursoNaoEncontradoException("Anúncio", id);
        }
    }

    private String resolverNomeUsuario(String usuarioId) {
        if (usuarioId == null || usuarioId.isBlank()) return "Usuário";

        try {
            return usuarioRepository.findById(UUID.fromString(usuarioId))
                    .map(Usuario::getName)
                    .orElse("Usuário");
        } catch (IllegalArgumentException e) {
            log.warn("Formato de ID inválido ao resolver nome do usuário no chat: {}", usuarioId);
            return "Usuário";
        }
    }

    private String resolverAvatarUsuario(String usuarioId) {
        if (usuarioId == null || usuarioId.isBlank()) return null;

        try {
            return usuarioRepository.findById(UUID.fromString(usuarioId))
                    .map(Usuario::getAvatarUrl)
                    .orElse(null);
        } catch (IllegalArgumentException e) {
            log.warn("Formato de ID inválido ao resolver avatar do usuário no chat: {}", usuarioId);
            return null;
        }
    }

    private String resolverTituloAnuncio(String anuncioId) {
        if (anuncioId == null || anuncioId.isBlank()) return "Anúncio";

        try {
            return anuncioRepository.findById(UUID.fromString(anuncioId))
                    .map(Anuncio::getTitulo)
                    .orElse("Anúncio");
        } catch (IllegalArgumentException e) {
            log.warn("Formato de ID inválido ao resolver título do anúncio no chat: {}", anuncioId);
            return "Anúncio";
        }
    }

    private String resolverImagemAnuncio(String anuncioId) {
        if (anuncioId == null || anuncioId.isBlank()) return null;

        try {
            return imagemAnuncioRepository.findByAnuncioIdOrderByOrdemExibicaoAsc(UUID.fromString(anuncioId))
                    .stream()
                    .findFirst()
                    .map(ImagemAnuncio::getUrlImagem)
                    .orElse(null);
        } catch (IllegalArgumentException e) {
            log.warn("Formato de ID inválido ao resolver imagem do anúncio no chat: {}", anuncioId);
            return null;
        }
    }

    private FechamentoNegociacao resolverFechamento(Conversa conversa, String usuarioAtualId) {
        if (conversa.getAnuncioId() == null || conversa.getAnuncioId().isBlank()) {
            return FechamentoNegociacao.vazio();
        }

        try {
            UUID anuncioId = UUID.fromString(conversa.getAnuncioId());
            Anuncio anuncio = anuncioRepository.findById(anuncioId).orElse(null);

            if (anuncio == null) {
                return FechamentoNegociacao.vazio();
            }

            String donoId = anuncio.getUsuario().getId().toString();
            String interessadoId = donoId.equals(conversa.getRemetente())
                    ? conversa.getDestinatario()
                    : conversa.getRemetente();

            InteresseTroca interesse = interesseTrocaRepository
                    .findFirstByAnuncioDesejadoIdAndInteressadoIdAndStatusInOrderByCriadoEmDesc(
                            anuncioId,
                            UUID.fromString(interessadoId),
                            List.of(
                                    InteresseTroca.StatusInteresse.ACEITO,
                                    InteresseTroca.StatusInteresse.CANCELADO
                            )
                    )
                    .orElse(null);

            boolean usuarioJaAvaliou = avaliacaoRepository.existsByAvaliadorIdAndAnuncioId(
                    UUID.fromString(usuarioAtualId),
                    anuncio.getId()
            );
            boolean chatFechado = avaliacaoRepository.existsByAnuncioId(anuncio.getId());

            if (interesse == null) {
                return new FechamentoNegociacao(
                        null,
                        anuncio.getStatus().name(),
                        null,
                        null,
                        null,
                        false,
                        false,
                        false,
                        false,
                        usuarioJaAvaliou,
                        false,
                        chatFechado
                );
            }

            boolean usuarioEhDono = usuarioAtualId.equals(donoId);
            boolean usuarioEhInteressado = usuarioAtualId.equals(interesse.getInteressado().getId().toString());
            boolean negociacaoCancelada = interesse.getStatus() == InteresseTroca.StatusInteresse.CANCELADO;
            chatFechado = chatFechado || negociacaoCancelada;
            boolean podeMarcarEntregue = usuarioEhDono
                    && !negociacaoCancelada
                    && interesse.getEntreguePeloDonoEm() == null
                    && interesse.getRecebimentoConfirmadoEm() == null
                    && anuncio.getStatus() == Anuncio.StatusAnuncio.ATIVO
                    && !chatFechado;
            boolean podeConfirmarRecebimento = usuarioEhInteressado
                    && !negociacaoCancelada
                    && interesse.getEntreguePeloDonoEm() != null
                    && interesse.getRecebimentoConfirmadoEm() == null
                    && anuncio.getStatus() == Anuncio.StatusAnuncio.ATIVO
                    && !chatFechado;
            boolean podeAvaliar = (usuarioEhDono || usuarioEhInteressado)
                    && anuncio.getStatus() == Anuncio.StatusAnuncio.CONCLUIDO
                    && !usuarioJaAvaliou;
            boolean podeCancelarNegociacao = (usuarioEhDono || usuarioEhInteressado)
                    && !negociacaoCancelada
                    && interesse.getStatus() == InteresseTroca.StatusInteresse.ACEITO
                    && interesse.getRecebimentoConfirmadoEm() == null
                    && anuncio.getStatus() != Anuncio.StatusAnuncio.CONCLUIDO
                    && !chatFechado;

            return new FechamentoNegociacao(
                    interesse.getId().toString(),
                    anuncio.getStatus().name(),
                    interesse.getEntreguePeloDonoEm(),
                    interesse.getRecebimentoConfirmadoEm(),
                    interesse.getCanceladoEm(),
                    podeMarcarEntregue,
                    podeConfirmarRecebimento,
                    podeCancelarNegociacao,
                    podeAvaliar,
                    usuarioJaAvaliou,
                    negociacaoCancelada,
                    chatFechado
            );
        } catch (IllegalArgumentException e) {
            log.warn("Nao foi possivel resolver o fechamento da conversa {}", conversa.getId());
            return FechamentoNegociacao.vazio();
        }
    }

    private void garantirInteresseAceitoParaDoacao(Anuncio anuncio, String remetenteId, String destinatarioId) {
        if (anuncio.getTipo() != Anuncio.TipoAnuncio.DOACAO) {
            return;
        }

        String donoId = anuncio.getUsuario().getId().toString();
        String interessadoId = donoId.equals(remetenteId) ? destinatarioId : remetenteId;

        if (interessadoId == null || interessadoId.isBlank() || interessadoId.equals(donoId)) {
            return;
        }

        UUID interessadoUuid = UUID.fromString(interessadoId);
        boolean jaExiste = interesseTrocaRepository.existsByAnuncioDesejadoIdAndInteressadoIdAndStatus(
                anuncio.getId(),
                interessadoUuid,
                InteresseTroca.StatusInteresse.ACEITO
        );

        if (jaExiste) {
            return;
        }

        Usuario interessado = usuarioRepository.findById(interessadoUuid)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuario", interessadoId));

        interesseTrocaRepository.save(InteresseTroca.builder()
                .anuncioDesejado(anuncio)
                .interessado(interessado)
                .status(InteresseTroca.StatusInteresse.ACEITO)
                .mensagem("Conversa iniciada para doacao.")
                .build());
    }

    private boolean chatEstaFechado(Conversa conversa) {
        if (conversa.getAnuncioId() == null || conversa.getAnuncioId().isBlank()) {
            return false;
        }

        try {
            String usuarioReferencia = conversa.getRemetente();
            return avaliacaoRepository.existsByAnuncioId(UUID.fromString(conversa.getAnuncioId()))
                    || resolverFechamento(conversa, usuarioReferencia).negociacaoCancelada();
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    private void validarChatAberto(Conversa conversa) {
        if (chatEstaFechado(conversa)) {
            throw new RegraNegocioException("Este chat foi fechado apos a avaliacao da negociacao.");
        }
    }

    private List<ConversaRespostaDTO.MensagemDto> mapearMensagens(Conversa conversa) {
        return Optional.ofNullable(conversa.getHistoricoMensagens())
                .orElse(Collections.emptyList())
                .stream()
                .sorted(Comparator.comparing(Conversa.Mensagem::getTimestamp))
                .map(m -> new ConversaRespostaDTO.MensagemDto(
                        m.getConteudo(),
                        m.getRemetente(),
                        m.getTimestamp()
                ))
                .toList();
    }

    private Conversa buscarConversaEntreUsuariosSemAmbiguidade(String usuarioA, String usuarioB) {
        List<Conversa> conversas = chatRepository.findByUsuarios(usuarioA, usuarioB);

        if (conversas.isEmpty()) {
            throw new RecursoNaoEncontradoException("Historico de conversa", usuarioA + " e " + usuarioB);
        }

        if (conversas.size() > 1) {
            throw new RegraNegocioException(
                    "Existe mais de uma conversa com este usuario. Abra a conversa pela lista de conversas."
            );
        }

        return conversas.get(0);
    }

    private record FechamentoNegociacao(
            String interesseId,
            String statusAnuncio,
            LocalDateTime entreguePeloDonoEm,
            LocalDateTime recebimentoConfirmadoEm,
            LocalDateTime canceladoEm,
            boolean podeMarcarEntregue,
            boolean podeConfirmarRecebimento,
            boolean podeCancelarNegociacao,
            boolean podeAvaliarOutroUsuario,
            boolean usuarioJaAvaliou,
            boolean negociacaoCancelada,
            boolean chatFechado
    ) {
        static FechamentoNegociacao vazio() {
            return new FechamentoNegociacao(
                    null, null, null, null, null,
                    false, false, false, false, false, false, false
            );
        }
    }

    @Transactional
    public void enviarMensagem(String emailRemetente, String conversaId, MensagemCriacaoDTO dto) {
        Usuario remetenteUsuario = buscarUsuarioPorEmail(emailRemetente);
        String remetenteId = remetenteUsuario.getId().toString();

        Conversa conversa = chatRepository.findById(conversaId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Conversa", conversaId));

        if (!conversa.getRemetente().equals(remetenteId) && !conversa.getDestinatario().equals(remetenteId)) {
            throw new AcessoNegadoException("Acesso negado: você não tem permissão para enviar mensagens nesta conversa.");
        }

        validarChatAberto(conversa);

        Conversa.Mensagem mensagem = new Conversa.Mensagem();
        mensagem.setConteudo(dto.conteudo());
        mensagem.setTimestamp(LocalDateTime.now());
        mensagem.setRemetente(remetenteId);

        if (conversa.getHistoricoMensagens() == null) {
            conversa.setHistoricoMensagens(new java.util.ArrayList<>());
        }

        conversa.getHistoricoMensagens().add(mensagem);
        conversa.setLido(false);

        chatRepository.save(conversa);
        log.info("Mensagem salva com sucesso na conversa ID: {} por {}", conversaId, remetenteId);
    }

    @Transactional
    public ConversaRespostaDTO iniciarOuRecuperarConversa(String emailRemetente, IniciarConversaDTO dto) {
        Usuario remetenteUsuario = buscarUsuarioPorEmail(emailRemetente);
        String remetenteId = remetenteUsuario.getId().toString();

        Anuncio anuncio = buscarAnuncioPorId(dto.anuncioId());
        String donoAnuncioId = anuncio.getUsuario().getId().toString();

        if (remetenteId.equals(dto.destinatarioId())) {
            throw new RegraNegocioException("Você não pode iniciar uma conversa consigo mesmo.");
        }

        boolean conversaEnvolveDono = Objects.equals(remetenteId, donoAnuncioId)
                || Objects.equals(dto.destinatarioId(), donoAnuncioId);

        if (!conversaEnvolveDono) {
            throw new RegraNegocioException("A conversa precisa envolver o dono do anúncio.");
        }

        if (anuncio.getStatus() != Anuncio.StatusAnuncio.ATIVO) {
            throw new RegraNegocioException("Só é possível iniciar conversa em anúncios ativos.");
        }

        List<Conversa> conversasExistentes = chatRepository
                .findByAnuncioIdAndUsuarios(dto.anuncioId(), remetenteId, dto.destinatarioId());

        Conversa conversa = conversasExistentes.stream()
                .sorted(java.util.Comparator.comparing(Conversa::getDataCriacao))
                .findFirst()
                .orElseGet(() -> {
                    Conversa novaConversa = Conversa.builder()
                            .anuncioId(dto.anuncioId())
                            .remetente(remetenteId)
                            .destinatario(dto.destinatarioId())
                            .historicoMensagens(new java.util.ArrayList<>())
                            .dataCriacao(LocalDateTime.now())
                            .lido(false)
                            .build();

                    return chatRepository.save(novaConversa);
                });

        garantirInteresseAceitoParaDoacao(anuncio, remetenteId, dto.destinatarioId());

        List<ConversaRespostaDTO.MensagemDto> mensagens = mapearMensagens(conversa);

        FechamentoNegociacao fechamento = resolverFechamento(conversa, remetenteId);

        return new ConversaRespostaDTO(
                conversa.getId(),
                dto.destinatarioId(),
                resolverNomeUsuario(dto.destinatarioId()),
                resolverAvatarUsuario(dto.destinatarioId()),
                conversa.getAnuncioId(),
                anuncio.getTitulo(),
                resolverImagemAnuncio(conversa.getAnuncioId()),
                conversa.getAnuncioOferecidoId(),
                conversa.getAnuncioOferecidoId() != null ? resolverTituloAnuncio(conversa.getAnuncioOferecidoId()) : null,
                conversa.getAnuncioOferecidoId() != null ? resolverImagemAnuncio(conversa.getAnuncioOferecidoId()) : null,
                fechamento.interesseId(),
                fechamento.statusAnuncio(),
                fechamento.entreguePeloDonoEm(),
                fechamento.recebimentoConfirmadoEm(),
                fechamento.canceladoEm(),
                fechamento.podeMarcarEntregue(),
                fechamento.podeConfirmarRecebimento(),
                fechamento.podeCancelarNegociacao(),
                fechamento.podeAvaliarOutroUsuario(),
                fechamento.usuarioJaAvaliou(),
                fechamento.negociacaoCancelada(),
                fechamento.chatFechado(),
                mensagens
        );
    }

    @Transactional
    public ConversaRespostaDTO iniciarOuRecuperarConversaComOferta(
            String emailRemetente,
            IniciarConversaDTO dto,
            String anuncioOferecidoId
    ) {
        ConversaRespostaDTO conversaResposta = iniciarOuRecuperarConversa(emailRemetente, dto);

        Conversa conversa = chatRepository.findById(conversaResposta.id())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Conversa", conversaResposta.id()));

        conversa.setAnuncioOferecidoId(anuncioOferecidoId);
        chatRepository.save(conversa);

        return recuperarConversaPorId(conversa.getId(), emailRemetente);
    }

    @Transactional(readOnly = true)
    public ConversaRespostaDTO recuperarHistoricoConversa(String emailRemetente, String destinatarioId) {
        Usuario remetenteUsuario = buscarUsuarioPorEmail(emailRemetente);
        String remetenteId = remetenteUsuario.getId().toString();

        Conversa conversa = buscarConversaEntreUsuariosSemAmbiguidade(remetenteId, destinatarioId);

        List<ConversaRespostaDTO.MensagemDto> mensagens = mapearMensagens(conversa);

        log.debug("Histórico recuperado para conversa entre {} e {}", remetenteId, destinatarioId);

        FechamentoNegociacao fechamento = resolverFechamento(conversa, remetenteId);

        return new ConversaRespostaDTO(
                conversa.getId(),
                destinatarioId,
                resolverNomeUsuario(destinatarioId),
                resolverAvatarUsuario(destinatarioId),
                conversa.getAnuncioId(),
                resolverTituloAnuncio(conversa.getAnuncioId()),
                resolverImagemAnuncio(conversa.getAnuncioId()),
                conversa.getAnuncioOferecidoId(),
                conversa.getAnuncioOferecidoId() != null ? resolverTituloAnuncio(conversa.getAnuncioOferecidoId()) : null,
                conversa.getAnuncioOferecidoId() != null ? resolverImagemAnuncio(conversa.getAnuncioOferecidoId()) : null,
                fechamento.interesseId(),
                fechamento.statusAnuncio(),
                fechamento.entreguePeloDonoEm(),
                fechamento.recebimentoConfirmadoEm(),
                fechamento.canceladoEm(),
                fechamento.podeMarcarEntregue(),
                fechamento.podeConfirmarRecebimento(),
                fechamento.podeCancelarNegociacao(),
                fechamento.podeAvaliarOutroUsuario(),
                fechamento.usuarioJaAvaliou(),
                fechamento.negociacaoCancelada(),
                fechamento.chatFechado(),
                mensagens
        );
    }

    @Transactional(readOnly = true)
    public ConversaRespostaDTO recuperarConversaPorId(String conversaId, String emailUsuario) {
        Usuario usuario = buscarUsuarioPorEmail(emailUsuario);
        String usuarioId = usuario.getId().toString();

        Conversa conversa = chatRepository.findById(conversaId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Conversa", conversaId));

        if (!conversa.getRemetente().equals(usuarioId) && !conversa.getDestinatario().equals(usuarioId)) {
            throw new AcessoNegadoException("Acesso negado: você não faz parte desta conversa.");
        }

        String outroUsuarioId = conversa.getRemetente().equals(usuarioId)
                ? conversa.getDestinatario()
                : conversa.getRemetente();

        List<ConversaRespostaDTO.MensagemDto> mensagens = mapearMensagens(conversa);

        FechamentoNegociacao fechamento = resolverFechamento(conversa, usuarioId);

        return new ConversaRespostaDTO(
                conversa.getId(),
                outroUsuarioId,
                resolverNomeUsuario(outroUsuarioId),
                resolverAvatarUsuario(outroUsuarioId),
                conversa.getAnuncioId(),
                resolverTituloAnuncio(conversa.getAnuncioId()),
                resolverImagemAnuncio(conversa.getAnuncioId()),
                conversa.getAnuncioOferecidoId(),
                conversa.getAnuncioOferecidoId() != null ? resolverTituloAnuncio(conversa.getAnuncioOferecidoId()) : null,
                conversa.getAnuncioOferecidoId() != null ? resolverImagemAnuncio(conversa.getAnuncioOferecidoId()) : null,
                fechamento.interesseId(),
                fechamento.statusAnuncio(),
                fechamento.entreguePeloDonoEm(),
                fechamento.recebimentoConfirmadoEm(),
                fechamento.canceladoEm(),
                fechamento.podeMarcarEntregue(),
                fechamento.podeConfirmarRecebimento(),
                fechamento.podeCancelarNegociacao(),
                fechamento.podeAvaliarOutroUsuario(),
                fechamento.usuarioJaAvaliou(),
                fechamento.negociacaoCancelada(),
                fechamento.chatFechado(),
                mensagens
        );
    }

    @Transactional(readOnly = true)
    public ListaConversasDTO listarConversasUsuario(String emailUsuario) {
        Usuario usuario = buscarUsuarioPorEmail(emailUsuario);
        String usuarioId = usuario.getId().toString();

        List<Conversa> conversas = chatRepository.findByUsuario(usuarioId);

        List<ListaConversasDTO.ConversaResumo> resumos = conversas.stream()
                .map(c -> {
                    String outroUsuarioId = c.getRemetente().equals(usuarioId) ? c.getDestinatario() : c.getRemetente();
                    String nomeOutroUsuario = resolverNomeUsuario(outroUsuarioId);
                    String avatarOutroUsuario = resolverAvatarUsuario(outroUsuarioId);
                    String tituloAnuncio = resolverTituloAnuncio(c.getAnuncioId());
                    String imagemAnuncio = resolverImagemAnuncio(c.getAnuncioId());
                    String tituloAnuncioOferecido = c.getAnuncioOferecidoId() != null
                            ? resolverTituloAnuncio(c.getAnuncioOferecidoId())
                            : null;
                    String imagemAnuncioOferecido = c.getAnuncioOferecidoId() != null
                            ? resolverImagemAnuncio(c.getAnuncioOferecidoId())
                            : null;

                    boolean temMensagens = c.getHistoricoMensagens() != null && !c.getHistoricoMensagens().isEmpty();

                    String ultimaMensagem = temMensagens
                            ? c.getHistoricoMensagens().get(c.getHistoricoMensagens().size() - 1).getConteudo()
                            : "";

                    LocalDateTime ultimaAtualizacao = temMensagens
                            ? c.getHistoricoMensagens().get(c.getHistoricoMensagens().size() - 1).getTimestamp()
                            : c.getDataCriacao();

                    long naoLidas = c.getDestinatario().equals(usuarioId) && !c.isLido() ? 1 : 0;
                    FechamentoNegociacao fechamento = resolverFechamento(c, usuarioId);

                    return new ListaConversasDTO.ConversaResumo(
                            c.getId(),
                            outroUsuarioId,
                            nomeOutroUsuario,
                            avatarOutroUsuario,
                            c.getAnuncioId(),
                            tituloAnuncio,
                            imagemAnuncio,
                            c.getAnuncioOferecidoId(),
                            tituloAnuncioOferecido,
                            imagemAnuncioOferecido,
                            fechamento.interesseId(),
                            fechamento.statusAnuncio(),
                            fechamento.entreguePeloDonoEm(),
                            fechamento.recebimentoConfirmadoEm(),
                            fechamento.canceladoEm(),
                            fechamento.podeMarcarEntregue(),
                            fechamento.podeConfirmarRecebimento(),
                            fechamento.podeCancelarNegociacao(),
                            fechamento.podeAvaliarOutroUsuario(),
                            fechamento.usuarioJaAvaliou(),
                            fechamento.negociacaoCancelada(),
                            fechamento.chatFechado(),
                            ultimaMensagem,
                            ultimaAtualizacao,
                            naoLidas
                    );
                })
                .sorted((a, b) -> b.dataUltimaAtualizacao().compareTo(a.dataUltimaAtualizacao()))
                .toList();

        log.debug("Conversas listadas para usuário {}: {} conversas encontradas", usuarioId, resumos.size());
        return new ListaConversasDTO(resumos);
    }

    @Transactional
    public void marcarComoLido(String conversaId, String emailUsuario) {
        Usuario usuario = buscarUsuarioPorEmail(emailUsuario);
        String usuarioId = usuario.getId().toString();

        Conversa conversa = chatRepository.findById(conversaId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Conversa", conversaId));

        if (!conversa.getRemetente().equals(usuarioId) && !conversa.getDestinatario().equals(usuarioId)) {
            throw new AcessoNegadoException("Acesso negado: você não faz parte desta conversa.");
        }

        if (conversa.getDestinatario().equals(usuarioId)) {
            conversa.setLido(true);
            chatRepository.save(conversa);
        }

        log.info("Conversa {} marcada como lida por {}", conversaId, usuarioId);
    }
}
