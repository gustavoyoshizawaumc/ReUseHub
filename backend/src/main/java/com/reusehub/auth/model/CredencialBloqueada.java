package com.reusehub.auth.model;

import com.reusehub.shared.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "credenciais_bloqueadas")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CredencialBloqueada extends BaseEntity {

    @Column(name = "email_hash", nullable = false, length = 64)
    private String emailHash;

    @Column(name = "cpf_hash", nullable = false, length = 64)
    private String cpfHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "motivo", nullable = false, length = 40)
    private Motivo motivo;

    @Column(name = "usuario_origem_id")
    private UUID usuarioOrigemId;

    @Column(name = "expira_em")
    private LocalDateTime expiraEm;

    @Column(name = "detalhes", columnDefinition = "TEXT")
    private String detalhes;

    public enum Motivo {
        CONTA_EXCLUIDA,
        BANIMENTO
    }
}
