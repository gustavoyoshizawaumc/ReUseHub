package com.reusehub.anuncio.dto;
import com.reusehub.anuncio.model.enums.CondicaoItem;
import com.reusehub.anuncio.model.enums.TipoAnuncio;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;
import java.util.UUID;
@Getter
@Setter
public class AnuncioEdicaoDTO {
    @NotBlank(message = "Título é obrigatório")
    @Size(min = 5, max = 150, message = "Título deve ter entre 5 e 150 caracteres")
    private String titulo;
    @NotBlank(message = "Descrição é obrigatória")
    @Size(min = 20, max = 2000, message = "Descrição deve ter entre 20 e 2000 caracteres")
    private String descricao;
    @NotNull(message = "Tipo é obrigatório")
    private TipoAnuncio tipo;
    @NotNull(message = "Condição do item é obrigatória")
    private CondicaoItem condicao;
    @NotNull(message = "Categoria é obrigatória")
    private Integer categoriaId;
    @NotNull(message = "Usuário é obrigatório")
    private UUID usuarioId;
    private UUID enderecoId;
}