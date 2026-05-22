package com.reusehub.chat.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "conversas")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Conversa {

    @Id
    private String id;

    @Indexed
    @NotBlank(message = "Anúncio ID é obrigatório")
    private String anuncioId;

    private String anuncioOferecidoId;

    @NotBlank(message = "Remetente é obrigatório")
    private String remetente;

    @NotBlank(message = "Destinatário é obrigatório")
    private String destinatario;

    private List<Mensagem> historicoMensagens;

    private LocalDateTime dataCriacao;

    private boolean lido;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Mensagem {
        @NotBlank(message = "Conteúdo da mensagem é obrigatório")
        private String conteudo;

        private LocalDateTime timestamp;

        @NotBlank(message = "Remetente da mensagem é obrigatório")
        private String remetente;
    }
}
