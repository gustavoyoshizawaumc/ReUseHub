package com.reusehub.chat.service;

import com.reusehub.chat.document.Conversa;
import com.reusehub.chat.dto.ConversaRespostaDTO;
import com.reusehub.chat.dto.IniciarConversaDTO;
import com.reusehub.chat.dto.ListaConversasDTO;
import com.reusehub.chat.dto.MensagemCriacaoDTO;
import com.reusehub.chat.repository.ChatRepository;
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
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado para o email: " + email));
    }

    private Usuario buscarUsuarioPorId(String id) {
        return usuarioRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado para o ID: " + id));
    }

    private String resolverNomeUsuario(String usuarioId) {
        if (usuarioId == null || usuarioId.isBlank()) {
            return "Usuário";
        }

        try {
            return usuarioRepository.findById(UUID.fromString(usuarioId))
                    .map(Usuario::getName)
                    .orElse("Usuário");
        } catch (IllegalArgumentException e) {
            log.warn("ID de usuário inválido ao resolver nome no chat: {}", usuarioId);
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
            return "Anúncio";
        }
    }

    @Transactional
    public void enviarMensagem(String emailRemetente, String conversaId, MensagemCriacaoDTO dto) {
        try {
            Objects.requireNonNull(emailRemetente, "O remetente não pode ser nulo");
            Objects.requireNonNull(conversaId, "O ID da conversa não pode ser nulo");
            Objects.requireNonNull(dto, "Os dados da mensagem não podem ser nulos");
            Objects.requireNonNull(dto.conteudo(), "O conteúdo da mensagem não pode ser nulo");

            Usuario remetenteUsuario = buscarUsuarioPorEmail(emailRemetente);
            String remetenteId = remetenteUsuario.getId().toString();

            Conversa conversa = chatRepository.findById(conversaId)
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Conversa não encontrada para o ID informado: " + conversaId));

            if (!conversa.getRemetente().equals(remetenteId) && !conversa.getDestinatario().equals(remetenteId)) {
                throw new IllegalArgumentException("Você não tem permissão para enviar mensagem nesta conversa");
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
        } catch (IllegalArgumentException e) {
            log.error("Erro de validação ao enviar mensagem: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Erro ao enviar mensagem na conversa {}: {}", conversaId, e.getMessage(), e);
            throw new RuntimeException("Falha ao enviar mensagem", e);
        }
    }

    @Transactional
    public ConversaRespostaDTO iniciarOuRecuperarConversa(String emailRemetente, IniciarConversaDTO dto) {
        try {
            Objects.requireNonNull(emailRemetente, "O remetente não pode ser nulo");
            Objects.requireNonNull(dto, "Os dados para iniciar a conversa não podem ser nulos");
            Objects.requireNonNull(dto.anuncioId(), "O ID do anúncio não pode ser nulo");
            Objects.requireNonNull(dto.destinatarioId(), "O ID do destinatário não pode ser nulo");

            Usuario remetenteUsuario = buscarUsuarioPorEmail(emailRemetente);
            String remetenteId = remetenteUsuario.getId().toString();
            String destinatarioId = dto.destinatarioId();

            if (remetenteId.equals(destinatarioId)) {
                throw new IllegalArgumentException("Você não pode iniciar uma conversa com você mesmo");
            }

            Conversa conversa = chatRepository
                    .findByAnuncioIdAndUsuarios(dto.anuncioId(), remetenteId, destinatarioId)
                    .orElseGet(() -> {
                        Conversa novaConversa = Conversa.builder()
                                .anuncioId(dto.anuncioId())
                                .remetente(remetenteId)
                                .destinatario(destinatarioId)
                                .historicoMensagens(new java.util.ArrayList<>())
                                .dataCriacao(LocalDateTime.now())
                                .lido(false)
                                .build();

                        return chatRepository.save(novaConversa);
                    });

            List<ConversaRespostaDTO.MensagemDto> mensagens = conversa.getHistoricoMensagens() == null
                    ? List.of()
                    : conversa.getHistoricoMensagens().stream()
                    .sorted(Comparator.comparing(Conversa.Mensagem::getTimestamp))
                    .map(m -> new ConversaRespostaDTO.MensagemDto(
                            m.getConteudo(),
                            m.getRemetente(),
                            m.getTimestamp()
                    ))
                    .toList();

        return new ConversaRespostaDTO(
            conversa.getId(),
            destinatarioId,
            resolverNomeUsuario(destinatarioId),
            resolverTituloAnuncio(conversa.getAnuncioId()),
            mensagens
        );
        } catch (IllegalArgumentException e) {
            log.error("Erro de validação ao iniciar conversa: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Erro ao iniciar ou recuperar conversa: {}", e.getMessage(), e);
            throw new RuntimeException("Falha ao iniciar conversa", e);
        }
    }

    @Transactional(readOnly = true)
    public ConversaRespostaDTO recuperarHistoricoConversa(String emailRemetente, String destinatarioId) {
        try {
            Objects.requireNonNull(emailRemetente, "O remetente não pode ser nulo");
            Objects.requireNonNull(destinatarioId, "O destinatário não pode ser nulo");

            Usuario remetenteUsuario = buscarUsuarioPorEmail(emailRemetente);
            String remetenteId = remetenteUsuario.getId().toString();

            Conversa conversa = chatRepository.findByRemetenteAndDestinatario(remetenteId, destinatarioId)
                    .or(() -> chatRepository.findByRemetenteAndDestinatario(destinatarioId, remetenteId))
                    .orElseThrow(() -> new RuntimeException(
                            "Histórico de conversa não encontrado entre " + remetenteId + " e " + destinatarioId));

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

        } catch (Exception e) {
            log.error("Erro ao recuperar histórico: {}", e.getMessage(), e);
            throw new RuntimeException("Falha ao recuperar histórico", e);
        }
    }

    @Transactional(readOnly = true)
    public ConversaRespostaDTO recuperarConversaPorId(String conversaId, String emailUsuario) {
        Usuario usuario = buscarUsuarioPorEmail(emailUsuario);
        String usuarioId = usuario.getId().toString();

        Conversa conversa = chatRepository.findById(conversaId)
                .orElseThrow(() -> new RuntimeException("Conversa não encontrada"));

        if (!conversa.getRemetente().equals(usuarioId) && !conversa.getDestinatario().equals(usuarioId)) {
            throw new IllegalArgumentException("Você não tem permissão para acessar esta conversa");
        }

        List<ConversaRespostaDTO.MensagemDto> mensagens = conversa.getHistoricoMensagens() == null
                ? List.of()
                : conversa.getHistoricoMensagens().stream()
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
        try {
            Objects.requireNonNull(emailUsuario, "O ID do usuário não pode ser nulo");

            Usuario usuario = buscarUsuarioPorEmail(emailUsuario);
            String usuarioId = usuario.getId().toString();

            List<Conversa> conversas = chatRepository.findByUsuario(usuarioId);

            List<ListaConversasDTO.ConversaResumo> resumos = conversas.stream()
            .map(c -> {
                try {
                    String outroUsuarioId = c.getRemetente().equals(usuarioId)
                            ? c.getDestinatario()
                            : c.getRemetente();

                    String nomeOutroUsuario = resolverNomeUsuario(outroUsuarioId);

                    String ultimaMensagem = (c.getHistoricoMensagens() == null || c.getHistoricoMensagens().isEmpty())
                            ? ""
                            : c.getHistoricoMensagens()
                                .get(c.getHistoricoMensagens().size() - 1)
                                .getConteudo();

                    LocalDateTime ultimaAtualizacao = (c.getHistoricoMensagens() == null || c.getHistoricoMensagens().isEmpty())
                            ? c.getDataCriacao()
                            : c.getHistoricoMensagens()
                                .get(c.getHistoricoMensagens().size() - 1)
                                .getTimestamp();

                    long naoLidas = c.getDestinatario().equals(usuarioId) && !c.isLido() ? 1 : 0;
                    String tituloAnuncio = resolverTituloAnuncio(c.getAnuncioId());

                    return new ListaConversasDTO.ConversaResumo(
                            c.getId(),
                            outroUsuarioId,
                            nomeOutroUsuario,
                            tituloAnuncio,
                            ultimaMensagem,
                            ultimaAtualizacao,
                            naoLidas
                    );
                } catch (Exception ex) {
                    log.warn("Erro ao montar resumo da conversa {}: {}", c.getId(), ex.getMessage());
                    return null;
                }
            })
            .filter(Objects::nonNull)
            .sorted((a, b) -> b.dataUltimaAtualizacao().compareTo(a.dataUltimaAtualizacao()))
            .toList();

            log.debug("Conversas listadas para usuário {}: {} conversas encontradas", usuarioId, resumos.size());
            return new ListaConversasDTO(resumos);
        } catch (Exception e) {
            log.error("Erro ao listar conversas para o usuário {}: {}", emailUsuario, e.getMessage(), e);
            throw new RuntimeException("Falha ao listar conversas", e);
        }
    }

    @Transactional
    public void marcarComoLido(String conversaId, String emailUsuario) {
        Objects.requireNonNull(conversaId, "O ID da conversa não pode ser nulo");
        Objects.requireNonNull(emailUsuario, "O ID do usuário não pode ser nulo");

        Usuario usuario = buscarUsuarioPorEmail(emailUsuario);
        String usuarioId = usuario.getId().toString();

        Conversa conversa = chatRepository.findById(conversaId)
                .orElseThrow(() -> new RuntimeException("Conversa não encontrada"));

        if (!conversa.getDestinatario().equals(usuarioId)) {
            throw new IllegalArgumentException("Você não tem permissão para marcar esta conversa");
        }

        conversa.setLido(true);
        chatRepository.save(conversa);

        log.info("Conversa {} marcada como lida por {}", conversaId, usuarioId);
    }
}