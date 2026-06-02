package com.reusehub.interesse.model;

import com.reusehub.anuncio.model.Anuncio;
import com.reusehub.auth.model.Usuario;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "interesses_troca")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InteresseTroca {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "anuncio_id", nullable = false)
    private Anuncio anuncioDesejado;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_interessado_id", nullable = false)
    private Usuario interessado;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "anuncio_oferecido_id")
    private Anuncio anuncioOferecido;

    @Column(name = "mensagem")
    private String mensagem;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private StatusInteresse status;

    @Column(name = "criado_em", nullable = false)
    private LocalDateTime criadoEm;

    @Column(name = "entregue_pelo_dono_em")
    private LocalDateTime entreguePeloDonoEm;

    @Column(name = "recebimento_confirmado_em")
    private LocalDateTime recebimentoConfirmadoEm;

    @Column(name = "cancelado_em")
    private LocalDateTime canceladoEm;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cancelado_por_id")
    private Usuario canceladoPor;

    public enum StatusInteresse {
        PENDENTE,
        ACEITO,
        REJEITADO,
        CANCELADO
    }

    @PrePersist
    public void prePersist() {
        if (criadoEm == null) {
            criadoEm = LocalDateTime.now();
        }
        if (status == null) {
            status = StatusInteresse.PENDENTE;
        }
    }
}
