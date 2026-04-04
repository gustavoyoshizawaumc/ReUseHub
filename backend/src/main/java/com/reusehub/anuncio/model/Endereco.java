package com.reusehub.anuncio.model;

import com.reusehub.auth.model.Usuario;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder // Padrão Clean Code para construção de objetos complexos
@Entity
@Table(name = "enderecos")
public class Endereco {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(nullable = false, length = 9)
    private String cep;

    @Column(nullable = false)
    private String cidade;

    @Column(nullable = false, length = 2)
    private String uf;

    private String rua;
    private String numero;
    private String bairro;
    private String complemento;

    public String getEnderecoCompleto() {
        return String.format("%s, %s - %s, %s/%s",
                rua != null ? rua : "S/R",
                numero != null ? numero : "S/N",
                bairro != null ? bairro : "S/B",
                cidade,
                uf);
    }

    public boolean pertenceAo(UUID usuarioId) {
        return this.usuario != null && this.usuario.getId().equals(usuarioId);
    }


    @Override
    public String toString() {
        return "Endereco{" + "id=" + id + ", cep='" + cep + '\'' + ", cidade='" + cidade + '\'' + '}';
    }
}