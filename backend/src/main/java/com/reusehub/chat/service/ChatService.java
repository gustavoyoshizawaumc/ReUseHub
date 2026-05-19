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
import com.reusehub.anuncio.repository.AnuncioRepository;
import com.reusehub.auth.model.Usuario;
import com.reusehub.auth.repository.UsuarioRepository;
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

    @Transactional
    public void enviarMensagem(String emailRemetente, String conversaId, MensagemCriacaoDTO dto) {
        Usuario remetenteUsuario = buscarUsuarioPorEmail(emailRemetente);
        String remetenteId = remetenteUsuario.getId().toString();

        Conversa conversa = chatRepository.findById(conversaId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Conversa", conversaId));

        if (!conversa.getRemetente().equals(remetenteId) && !conversa.getDestinatario().equals(remetenteId)) {
            throw new AcessoNegadoException("Acesso negado: você não tem permissão para enviar mensagens nesta conversa.");
        }

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

        if (!Objects.equals(dto.destinatarioId(), donoAnuncioId)) {
            throw new RegraNegocioException("O destinatário informado não corresponde ao dono do anúncio.");
        }

        if (remetenteId.equals(donoAnuncioId)) {
            throw new RegraNegocioException("Você não pode iniciar uma conversa no seu próprio anúncio.");
        }

        if (anuncio.getStatus() != Anuncio.StatusAnuncio.ATIVO) {
            throw new RegraNegocioException("Só é possível iniciar conversa em anúncios ativos.");
        }

        List<Conversa> conversasExistentes = chatRepository
                .findByAnuncioIdAndUsuarios(dto.anuncioId(), remetenteId, donoAnuncioId);

        Conversa conversa = conversasExistentes.stream()
                .sorted(java.util.Comparator.comparing(Conversa::getDataCriacao))
                .findFirst()
                .orElseGet(() -> {
                    Conversa novaConversa = Conversa.builder()
                            .anuncioId(dto.anuncioId())
                            .remetente(remetenteId)
                            .destinatario(donoAnuncioId)
                            .historicoMensagens(new java.util.ArrayList<>())
                            .dataCriacao(LocalDateTime.now())
                            .lido(false)
                            .build();

                    return chatRepository.save(novaConversa);
                });

        List<ConversaRespostaDTO.MensagemDto> mensagens = Optional.ofNullable(conversa.getHistoricoMensagens())
                .orElse(Collections.emptyList())
                .stream()
                .sorted(Comparator.comparing(Conversa.Mensagem::getTimestamp))
                .map(m -> new ConversaRespostaDTO.MensagemDto(
                        m.getConteudo(),
                        m.getRemetente(),
                        m.getTimestamp()
                ))
                .toList();

        return new ConversaRespostaDTO(
                conversa.getId(),
                donoAnuncioId,
                anuncio.getUsuario().getName(),
                anuncio.getTitulo(),
                mensagens
        );
    }

    @Transactional(readOnly = true)
    public ConversaRespostaDTO recuperarHistoricoConversa(String emailRemetente, String destinatarioId) {
        Usuario remetenteUsuario = buscarUsuarioPorEmail(emailRemetente);
        String remetenteId = remetenteUsuario.getId().toString();

        Conversa conversa = chatRepository.findByRemetenteAndDestinatario(remetenteId, destinatarioId)
                .or(() -> chatRepository.findByRemetenteAndDestinatario(destinatarioId, remetenteId))
                .orElseThrow(() -> new RecursoNaoEncontradoException("Histórico de conversa", remetenteId + " e " + destinatarioId));

        List<ConversaRespostaDTO.MensagemDto> mensagens = Optional.ofNullable(conversa.getHistoricoMensagens())
                .orElse(Collections.emptyList())
                .stream()
                .sorted(Comparator.comparing(Conversa.Mensagem::getTimestamp))
                .map(m -> new ConversaRespostaDTO.MensagemDto(
                        m.getConteudo(),
                        m.getRemetente(),
                        m.getTimestamp()
                ))
                .toList();

        log.debug("Histórico unificado recuperado para conversa entre {} e {}", remetenteId, destinatarioId);

        return new ConversaRespostaDTO(
                conversa.getId(),
                destinatarioId,
                resolverNomeUsuario(destinatarioId),
                resolverTituloAnuncio(conversa.getAnuncioId()),
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

        List<ConversaRespostaDTO.MensagemDto> mensagens = Optional.ofNullable(conversa.getHistoricoMensagens())
                .orElse(Collections.emptyList())
                .stream()
                .sorted(Comparator.comparing(Conversa.Mensagem::getTimestamp))
                .map(m -> new ConversaRespostaDTO.MensagemDto(
                        m.getConteudo(),
                        m.getRemetente(),
                        m.getTimestamp()
                ))
                .toList();

        String outroUsuarioId = conversa.getRemetente().equals(usuarioId)
                ? conversa.getDestinatario()
                : conversa.getRemetente();

        return new ConversaRespostaDTO(
                conversa.getId(),
                outroUsuarioId,
                resolverNomeUsuario(outroUsuarioId),
                resolverTituloAnuncio(conversa.getAnuncioId()),
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
                    String tituloAnuncio = resolverTituloAnuncio(c.getAnuncioId());

                    boolean temMensagens = c.getHistoricoMensagens() != null && !c.getHistoricoMensagens().isEmpty();

                    String ultimaMensagem = temMensagens
                            ? c.getHistoricoMensagens().get(c.getHistoricoMensagens().size() - 1).getConteudo()
                            : "";

                    LocalDateTime ultimaAtualizacao = temMensagens
                            ? c.getHistoricoMensagens().get(c.getHistoricoMensagens().size() - 1).getTimestamp()
                            : c.getDataCriacao();

                    long naoLidas = c.getDestinatario().equals(usuarioId) && !c.isLido() ? 1 : 0;

                    return new ListaConversasDTO.ConversaResumo(
                            c.getId(),
                            outroUsuarioId,
                            nomeOutroUsuario,
                            tituloAnuncio,
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

        if (!conversa.getDestinatario().equals(usuarioId)) {
            throw new AcessoNegadoException("Acesso negado: você não tem permissão para marcar esta conversa como lida.");
        }

        conversa.setLido(true);
        chatRepository.save(conversa);

        log.info("Conversa {} marcada como lida por {}", conversaId, usuarioId);
    }
}