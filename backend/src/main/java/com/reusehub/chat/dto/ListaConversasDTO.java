package com.reusehub.chat.dto;

import java.time.LocalDateTime;
import java.util.List;

public record ListaConversasDTO(
    List<ConversaResumo> conversas
) {
    public record ConversaResumo(
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
        boolean podeMarcarEntregue,
        boolean podeConfirmarRecebimento,
        boolean podeAvaliarOutroUsuario,
        boolean usuarioJaAvaliou,
        boolean chatFechado,
        String ultimaMensagem,
        LocalDateTime dataUltimaAtualizacao,
        long mensagensNaoLidas
    ) {}
}
