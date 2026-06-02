package com.reusehub.chat.dto;

import java.time.LocalDateTime;
import java.util.List;

public record ConversaRespostaDTO(
    String id,
    String outroUsuarioId,
    String nomeOutroUsuario,
    String avatarOutroUsuario,
    String anuncioId,
    String tituloAnuncio,
    String imagemAnuncio,
    String anuncioOferecidoId,
    String tituloAnuncioOferecido,
    String imagemAnuncioOferecido,
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
    boolean chatFechado,
    List<MensagemDto> mensagens
) {
    public record MensagemDto(
        String conteudo,
        String remetente,
        LocalDateTime timestamp
    ) {}
}
