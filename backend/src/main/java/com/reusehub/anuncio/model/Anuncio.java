package com.reusehub.anuncio.model;

import com.reusehub.auth.model.Usuario;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "anuncios")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "endereco_id", nullable = false)
    private Endereco endereco;

    @Column(name = "titulo", nullable = false, length = 150)
    private String titulo;

    @Column(name = "descricao", nullable = false, columnDefinition = "TEXT")
    private String descricao;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false)
    private TipoAnuncio tipo;

    @Enumerated(EnumType.STRING)
    @Column(name = "condicao", nullable = false)
    private CondicaoItem condicao;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private StatusAnuncio status = StatusAnuncio.PENDENTE;

    @Column(name = "total_visualizacoes")
    @Builder.Default
    private Integer totalVisualizacoes = 0;

    @Column(name = "nota_relevancia", precision = 8, scale = 4)
    private BigDecimal notaRelevancia = BigDecimal.ZERO;

    @Column(name = "expira_em")
    private LocalDateTime expiraEm;

    @Column(name = "motivo_suspensao", columnDefinition = "TEXT")
    private String motivoSuspensao;

    @Column(name = "motivo_reprovacao", columnDefinition = "TEXT")
    private String motivoReprovacao;

    @OneToMany(mappedBy = "anuncio", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("ordemExibicao ASC")
    @Builder.Default
    private List<ImagemAnuncio> imagens = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @UpdateTimestamp
    @Column(name = "atualizado_em")
    private LocalDateTime atualizadoEm;

    public enum TipoAnuncio {
        DOACAO, TROCA
    }

    public enum CondicaoItem {
        NOVO, BOM, REGULAR, RUIM
    }

    public enum StatusAnuncio {
        PENDENTE,
        ATIVO,
        REPROVADO,
        SUSPENSO,
        CONCLUIDO,
        CANCELADO
    }
}
