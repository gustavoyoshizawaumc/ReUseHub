package com.reusehub.anuncio.model;

import com.reusehub.anuncio.model.enums.CondicaoItem;
import com.reusehub.anuncio.model.enums.StatusAnuncio;
import com.reusehub.anuncio.model.enums.TipoAnuncio;
import com.reusehub.auth.model.Usuario;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "listings")
public class Anuncio {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Categoria categoria;

    @Column(name = "title", nullable = false, length = 150)
    private String titulo;

    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String descricao;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private TipoAnuncio tipo;

    @Enumerated(EnumType.STRING)
    @Column(name = "condition", nullable = false)
    private CondicaoItem condicao;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private StatusAnuncio status;

    @Column(name = "views_count")
    private Integer totalVisualizacoes = 0;

    @Column(name = "relevance_score")
    private Double pontuacaoRelevancia = 0.0;

    @Column(name = "expires_at")
    private LocalDateTime expiraEm;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime criadoEm;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime atualizadoEm;

    @PrePersist
    private void definirStatusInicial() {
        this.status = StatusAnuncio.ACTIVE;
    }


    public boolean pertenceAo(UUID idUsuarioRequisicao) {
        return this.usuario.getId().equals(idUsuarioRequisicao);
    }

    public boolean podeSerEditado() {
        return status != StatusAnuncio.COMPLETED;
    }

    public boolean podeSerPausado() {
        return status == StatusAnuncio.ACTIVE;
    }

    public boolean podeSerReativado() {
        return status == StatusAnuncio.CANCELLED;
    }

    public boolean podeSerReservado() {
        return status == StatusAnuncio.ACTIVE;
    }

    public boolean jaEstaEncerrado() {
        return status == StatusAnuncio.COMPLETED;
    }
}