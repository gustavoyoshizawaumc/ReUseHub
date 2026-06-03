package com.reusehub.anuncio.visualizacao.model;

import com.reusehub.anuncio.model.Anuncio;
import com.reusehub.anuncio.visualizacao.enums.OrigemVisualizacao;
import com.reusehub.auth.model.Usuario;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Registro de uma visualizacao valida (pos-dedupe) de um anuncio.
 *
 * <p>Cada linha representa um evento, nao um total agregado. O contador rapido
 * fica em {@code Anuncio.totalVisualizacoes} (atualizado inline pelo service
 * na mesma transacao), enquanto consultas analiticas (ex: views ultimos 7 dias)
 * vem desta tabela.
 *
 * <p>Pelo menos um entre {@code usuario}, {@code anonId} e {@code ipAddress}
 * sempre estara preenchido (constraint na V15).
 */
@Entity
@Table(name = "visualizacoes_anuncio")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VisualizacaoAnuncio {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "anuncio_id", nullable = false)
    private Anuncio anuncio;

    /** Preenchido somente se a request chegou autenticada (JWT valido). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    /** UUID gerado pelo client e enviado no header X-Anon-Id. */
    @Column(name = "anon_id", length = 64)
    private String anonId;

    /**
     * IP do cliente (IPv4 ate 15 chars, IPv6 ate 45). Extraido respeitando
     * X-Forwarded-For/X-Real-IP quando ha proxy/load balancer na frente.
     */
    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Enumerated(EnumType.STRING)
    @Column(name = "origem", nullable = false, length = 40)
    private OrigemVisualizacao origem;

    @CreationTimestamp
    @Column(name = "visualizado_em", nullable = false, updatable = false)
    private LocalDateTime visualizadoEm;
}
