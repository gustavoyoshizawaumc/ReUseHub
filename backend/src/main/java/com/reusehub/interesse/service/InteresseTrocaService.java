package com.reusehub.interesse.service;

import com.reusehub.anuncio.exception.AcessoNegadoException;
import com.reusehub.anuncio.exception.OperacaoInvalidaException;
import com.reusehub.anuncio.exception.RecursoNaoEncontradoException;
import com.reusehub.anuncio.exception.RegraNegocioException;
import com.reusehub.anuncio.model.Anuncio;
import com.reusehub.anuncio.model.ImagemAnuncio;
import com.reusehub.anuncio.repository.AnuncioRepository;
import com.reusehub.anuncio.repository.ImagemAnuncioRepository;
import com.reusehub.auth.model.Usuario;
import com.reusehub.auth.repository.UsuarioRepository;
import com.reusehub.avaliacao.repository.AvaliacaoRepository;
import com.reusehub.chat.dto.ConversaRespostaDTO;
import com.reusehub.chat.dto.IniciarConversaDTO;
import com.reusehub.chat.service.ChatService;
import com.reusehub.interesse.dto.InteresseCriacaoDTO;
import com.reusehub.interesse.dto.InteresseRespostaDTO;
import com.reusehub.interesse.model.InteresseTroca;
import com.reusehub.interesse.repository.InteresseTrocaRepository;
import com.reusehub.notificacao.service.NotificacaoService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class InteresseTrocaService {

    private final InteresseTrocaRepository interesseTrocaRepository;
    private final UsuarioRepository usuarioRepository;
    private final AnuncioRepository anuncioRepository;
    private final ImagemAnuncioRepository imagemAnuncioRepository;
    private final ChatService chatService;
    private final NotificacaoService notificacaoService;
    private final AvaliacaoRepository avaliacaoRepository;

    public InteresseRespostaDTO criarInteresse(String emailInteressado, InteresseCriacaoDTO dto) {
        Usuario interessado = buscarUsuarioPorEmail(emailInteressado);
        Anuncio anuncioDesejado = buscarAnuncio(dto.anuncioDesejadoId());

        validarAnuncioDisponivelParaInteresse(anuncioDesejado);

        if (anuncioDesejado.getUsuario().getId().equals(interessado.getId())) {
            throw new RegraNegocioException("Você não pode demonstrar interesse no seu próprio anúncio.");
        }

        Anuncio anuncioOferecido = null;

        if (dto.anuncioOferecidoId() != null) {
            anuncioOferecido = buscarAnuncio(dto.anuncioOferecidoId());

            if (!anuncioOferecido.getUsuario().getId().equals(interessado.getId())) {
                throw new AcessoNegadoException("Você só pode oferecer um anúncio que seja seu.");
            }

            if (anuncioOferecido.getStatus() != Anuncio.StatusAnuncio.ATIVO) {
                throw new RegraNegocioException("Você só pode oferecer anúncios ativos.");
            }

            if (anuncioOferecido.getId().equals(anuncioDesejado.getId())) {
                throw new RegraNegocioException("O anúncio oferecido não pode ser o mesmo anúncio desejado.");
            }
        }

        InteresseTroca interesse = InteresseTroca.builder()
                .anuncioDesejado(anuncioDesejado)
                .interessado(interessado)
                .anuncioOferecido(anuncioOferecido)
                .mensagem(dto.mensagem())
                .status(InteresseTroca.StatusInteresse.PENDENTE)
                .build();

        InteresseTroca salvo = interesseTrocaRepository.save(interesse);
        notificacaoService.criar(
                anuncioDesejado.getUsuario(),
                "INTERESSE_RECEBIDO",
                "Novo interesse no seu anúncio",
                interessado.getName() + " demonstrou interesse em " + anuncioDesejado.getTitulo() + ".",
                salvo.getId(),
                "INTERESSE"
        );
        return mapear(salvo, null);
    }

    @Transactional(readOnly = true)
    public List<InteresseRespostaDTO> listarInteressesRecebidos(String emailUsuario) {
        Usuario usuario = buscarUsuarioPorEmail(emailUsuario);

        return interesseTrocaRepository.findByAnuncioDesejadoUsuarioIdOrderByCriadoEmDesc(usuario.getId())
                .stream()
                .map(interesse -> mapear(interesse, null))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<InteresseRespostaDTO> listarInteressesEnviados(String emailUsuario) {
        Usuario usuario = buscarUsuarioPorEmail(emailUsuario);

        return interesseTrocaRepository.findByInteressadoIdOrderByCriadoEmDesc(usuario.getId())
                .stream()
                .map(interesse -> mapear(interesse, null))
                .toList();
    }

    public InteresseRespostaDTO aceitarInteresse(UUID interesseId, String emailUsuario) {
        Usuario dono = buscarUsuarioPorEmail(emailUsuario);

        InteresseTroca interesse = interesseTrocaRepository.findById(interesseId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Interesse", interesseId));

        if (!interesse.getAnuncioDesejado().getUsuario().getId().equals(dono.getId())) {
            throw new AcessoNegadoException("Você não pode responder este interesse.");
        }

        if (interesse.getStatus() != InteresseTroca.StatusInteresse.PENDENTE) {
            throw new RegraNegocioException("Somente interesses pendentes podem ser aceitos.");
        }

        if (interesse.getAnuncioDesejado().getStatus() != Anuncio.StatusAnuncio.ATIVO) {
            throw new RegraNegocioException("Este anuncio nao esta mais disponivel para aceitar propostas.");
        }

        if (interesseTrocaRepository.existsByAnuncioDesejadoIdAndStatus(
                interesse.getAnuncioDesejado().getId(),
                InteresseTroca.StatusInteresse.ACEITO
        )) {
            throw new RegraNegocioException("Este anuncio ja possui uma negociacao aceita.");
        }

        interesse.setStatus(InteresseTroca.StatusInteresse.ACEITO);

        ConversaRespostaDTO conversa = chatService.iniciarOuRecuperarConversaComOferta(
                dono.getEmail(),
                new IniciarConversaDTO(
                        interesse.getAnuncioDesejado().getId().toString(),
                        interesse.getInteressado().getId().toString()
                ),
                interesse.getAnuncioOferecido() != null ? interesse.getAnuncioOferecido().getId().toString() : null
        );

        InteresseTroca salvo = interesseTrocaRepository.save(interesse);
        notificacaoService.criar(
                interesse.getInteressado(),
                "INTERESSE_ACEITO",
                "Seu interesse foi aceito",
                dono.getName() + " aceitou sua proposta para " + interesse.getAnuncioDesejado().getTitulo() + ".",
                salvo.getId(),
                "INTERESSE"
        );
        return mapear(salvo, conversa.id());
    }

    public InteresseRespostaDTO marcarComoEntregue(UUID interesseId, String emailUsuario) {
        Usuario dono = buscarUsuarioPorEmail(emailUsuario);
        InteresseTroca interesse = buscarInteresse(interesseId);

        if (!interesse.getAnuncioDesejado().getUsuario().getId().equals(dono.getId())) {
            throw new AcessoNegadoException("Somente o dono do anuncio pode marcar como entregue.");
        }

        if (interesse.getStatus() != InteresseTroca.StatusInteresse.ACEITO) {
            throw new RegraNegocioException("Somente uma negociacao aceita pode ser marcada como entregue.");
        }

        if (interesse.getRecebimentoConfirmadoEm() != null
                || interesse.getAnuncioDesejado().getStatus() == Anuncio.StatusAnuncio.CONCLUIDO) {
            throw new RegraNegocioException("Esta negociacao ja foi concluida.");
        }

        if (interesse.getEntreguePeloDonoEm() == null) {
            interesse.setEntreguePeloDonoEm(LocalDateTime.now());
        }

        interesse.getAnuncioDesejado().setStatus(Anuncio.StatusAnuncio.RESERVADO);
        anuncioRepository.save(interesse.getAnuncioDesejado());

        InteresseTroca salvo = interesseTrocaRepository.save(interesse);
        notificacaoService.criar(
                interesse.getInteressado(),
                "ENTREGA_MARCADA",
                "Entrega aguardando confirmacao",
                dono.getName() + " marcou " + interesse.getAnuncioDesejado().getTitulo() + " como entregue. Confirme o recebimento para concluir.",
                salvo.getId(),
                "INTERESSE"
        );
        return mapear(salvo, null);
    }

    public InteresseRespostaDTO confirmarRecebimento(UUID interesseId, String emailUsuario) {
        Usuario interessado = buscarUsuarioPorEmail(emailUsuario);
        InteresseTroca interesse = buscarInteresse(interesseId);

        if (!interesse.getInteressado().getId().equals(interessado.getId())) {
            throw new AcessoNegadoException("Somente o interessado pode confirmar o recebimento.");
        }

        if (interesse.getStatus() != InteresseTroca.StatusInteresse.ACEITO) {
            throw new RegraNegocioException("Somente uma negociacao aceita pode ser confirmada.");
        }

        if (interesse.getEntreguePeloDonoEm() == null
                || interesse.getAnuncioDesejado().getStatus() != Anuncio.StatusAnuncio.RESERVADO) {
            throw new RegraNegocioException("O dono precisa marcar o item como entregue antes da confirmacao.");
        }

        if (interesse.getRecebimentoConfirmadoEm() != null) {
            throw new RegraNegocioException("O recebimento desta negociacao ja foi confirmado.");
        }

        interesse.setRecebimentoConfirmadoEm(LocalDateTime.now());
        interesse.getAnuncioDesejado().setStatus(Anuncio.StatusAnuncio.CONCLUIDO);
        anuncioRepository.save(interesse.getAnuncioDesejado());

        InteresseTroca salvo = interesseTrocaRepository.save(interesse);
        notificacaoService.criar(
                interesse.getAnuncioDesejado().getUsuario(),
                "NEGOCIACAO_CONCLUIDA",
                "Negociacao concluida",
                interessado.getName() + " confirmou o recebimento de " + interesse.getAnuncioDesejado().getTitulo() + ". As avaliacoes ja estao liberadas.",
                salvo.getId(),
                "INTERESSE"
        );
        return mapear(salvo, null);
    }

    public InteresseRespostaDTO cancelarNegociacao(UUID interesseId, String emailUsuario) {
        Usuario usuario = buscarUsuarioPorEmail(emailUsuario);
        InteresseTroca interesse = buscarInteresse(interesseId);

        boolean usuarioEhDono = interesse.getAnuncioDesejado().getUsuario().getId().equals(usuario.getId());
        boolean usuarioEhInteressado = interesse.getInteressado().getId().equals(usuario.getId());

        if (!usuarioEhDono && !usuarioEhInteressado) {
            throw new AcessoNegadoException("Somente os participantes podem cancelar esta negociacao.");
        }

        if (interesse.getStatus() != InteresseTroca.StatusInteresse.ACEITO) {
            throw new RegraNegocioException("Somente uma negociacao aceita pode ser cancelada.");
        }

        if (interesse.getRecebimentoConfirmadoEm() != null
                || interesse.getAnuncioDesejado().getStatus() == Anuncio.StatusAnuncio.CONCLUIDO) {
            throw new RegraNegocioException("Uma negociacao concluida nao pode ser cancelada.");
        }

        interesse.setStatus(InteresseTroca.StatusInteresse.CANCELADO);
        interesse.setCanceladoEm(LocalDateTime.now());
        interesse.setCanceladoPor(usuario);

        if (interesse.getAnuncioDesejado().getStatus() == Anuncio.StatusAnuncio.RESERVADO) {
            interesse.getAnuncioDesejado().setStatus(Anuncio.StatusAnuncio.ATIVO);
            anuncioRepository.save(interesse.getAnuncioDesejado());
        }

        InteresseTroca salvo = interesseTrocaRepository.save(interesse);
        Usuario outroParticipante = usuarioEhDono
                ? interesse.getInteressado()
                : interesse.getAnuncioDesejado().getUsuario();
        notificacaoService.criar(
                outroParticipante,
                "NEGOCIACAO_CANCELADA",
                "Negociacao cancelada",
                usuario.getName() + " cancelou a negociacao de " + interesse.getAnuncioDesejado().getTitulo() + ".",
                salvo.getId(),
                "INTERESSE"
        );
        return mapear(salvo, null);
    }

    public InteresseRespostaDTO rejeitarInteresse(UUID interesseId, String emailUsuario) {
        Usuario dono = buscarUsuarioPorEmail(emailUsuario);

        InteresseTroca interesse = interesseTrocaRepository.findById(interesseId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Interesse", interesseId));

        if (!interesse.getAnuncioDesejado().getUsuario().getId().equals(dono.getId())) {
            throw new AcessoNegadoException("Você não pode responder este interesse.");
        }

        if (interesse.getStatus() != InteresseTroca.StatusInteresse.PENDENTE) {
            throw new RegraNegocioException("Somente interesses pendentes podem ser rejeitados.");
        }

        interesse.setStatus(InteresseTroca.StatusInteresse.REJEITADO);

        InteresseTroca salvo = interesseTrocaRepository.save(interesse);
        notificacaoService.criar(
                interesse.getInteressado(),
                "INTERESSE_REJEITADO",
                "Seu interesse foi recusado",
                dono.getName() + " recusou sua proposta para " + interesse.getAnuncioDesejado().getTitulo() + ".",
                salvo.getId(),
                "INTERESSE"
        );
        return mapear(salvo, null);
    }

    private Usuario buscarUsuarioPorEmail(String email) {
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário", email));
    }

    private Anuncio buscarAnuncio(UUID id) {
        return anuncioRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Anúncio", id));
    }

    private InteresseTroca buscarInteresse(UUID id) {
        return interesseTrocaRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Interesse", id));
    }

    private void validarAnuncioDisponivelParaInteresse(Anuncio anuncio) {
        if (anuncio.getStatus() != Anuncio.StatusAnuncio.ATIVO) {
            throw new OperacaoInvalidaException("Só é possível demonstrar interesse em anúncios ativos.");
        }
    }

    private InteresseRespostaDTO mapear(InteresseTroca interesse, String conversaId) {
        return new InteresseRespostaDTO(
                interesse.getId(),
                interesse.getAnuncioDesejado().getId(),
                interesse.getAnuncioDesejado().getTitulo(),
                buscarImagemCapa(interesse.getAnuncioDesejado()),
                interesse.getAnuncioDesejado().getStatus(),
                interesse.getInteressado().getId(),
                interesse.getInteressado().getName(),
                interesse.getInteressado().getAvatarUrl(),
                interesse.getInteressado().getReputationScore(),
                interesse.getAnuncioOferecido() != null ? interesse.getAnuncioOferecido().getId() : null,
                interesse.getAnuncioOferecido() != null ? interesse.getAnuncioOferecido().getTitulo() : null,
                interesse.getAnuncioOferecido() != null ? buscarImagemCapa(interesse.getAnuncioOferecido()) : null,
                interesse.getMensagem(),
                interesse.getStatus(),
                interesse.getCriadoEm(),
                interesse.getEntreguePeloDonoEm(),
                interesse.getRecebimentoConfirmadoEm(),
                interesse.getCanceladoEm(),
                avaliacaoRepository.existsByAvaliadorIdAndAnuncioId(
                        interesse.getAnuncioDesejado().getUsuario().getId(),
                        interesse.getAnuncioDesejado().getId()
                ),
                conversaId
        );
    }

    private String buscarImagemCapa(Anuncio anuncio) {
        return imagemAnuncioRepository.findByAnuncioIdOrderByOrdemExibicaoAsc(anuncio.getId())
                .stream()
                .findFirst()
                .map(ImagemAnuncio::getUrlImagem)
                .orElse(null);
    }
}
