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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "anuncios")
public class Anuncio {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categoria_id", nullable = false)
    private Categoria categoria;

    // Atualizado: Agora é um relacionamento real com a Entidade Endereco
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "endereco_id", nullable = false)
    private Endereco endereco;

    @Column(name = "titulo", nullable = false, length = 150)
    private String titulo;

    @Column(name = "descricao", nullable = false, columnDefinition = "TEXT")
    private String descricao;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "tipo", nullable = false)
    private TipoAnuncio tipo;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "condicao", nullable = false)
    private CondicaoItem condicao;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "status", nullable = false)
    private StatusAnuncio status;

    @Column(name = "total_visualizacoes")
    private Integer totalVisualizacoes = 0;

    @Column(name = "nota_relevancia", precision = 8, scale = 4)
    private BigDecimal pontuacaoRelevancia = BigDecimal.ZERO;

    @Column(name = "expira_em")
    private LocalDateTime expiraEm;

    @CreationTimestamp
    @Column(name = "criado_em", updatable = false)
    private LocalDateTime criadoEm;

    @UpdateTimestamp
    @Column(name = "atualizado_em")
    private LocalDateTime atualizadoEm;

    @PrePersist
    private void definirStatusInicial() {
        if (this.status == null) {
            this.status = StatusAnuncio.ATIVO;
        }
    }

    public boolean pertenceAo(UUID idUsuarioRequisicao) {
        return this.usuario.getId().equals(idUsuarioRequisicao);
    }

    public boolean podeSerEditado() {
        return status != StatusAnuncio.CONCLUIDO;
    }

    public boolean podeSerPausado() {
        return status == StatusAnuncio.ATIVO;
    }

    public boolean podeSerReativado() {
        return status == StatusAnuncio.CANCELADO;
    }

    public boolean podeSerReservado() {
        return status == StatusAnuncio.ATIVO;
    }

    public boolean jaEstaEncerrado() {
        return status == StatusAnuncio.CONCLUIDO;
    }
}