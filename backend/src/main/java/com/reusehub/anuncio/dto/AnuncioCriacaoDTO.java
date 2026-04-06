package com.reusehub.anuncio.dto;

import com.reusehub.anuncio.model.Anuncio;
import jakarta.validation.constraints.*;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Data;              
import lombok.NoArgsConstructor; 

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnuncioCriacaoDTO {

    @NotBlank(message = "Título é obrigatório")
    @Size(min = 5, max = 150, message = "Título deve ter entre 5 e 150 caracteres")
    private String titulo;

    @NotBlank(message = "Descrição é obrigatória")
    @Size(min = 10, max = 2000, message = "Descrição deve ter entre 10 e 2000 caracteres")
    private String descricao;

    @NotNull(message = "Tipo de anúncio é obrigatório")
    private Anuncio.TipoAnuncio tipo;

    @NotNull(message = "Condição do item é obrigatória")
    private Anuncio.CondicaoItem condicao;

    @NotNull(message = "Categoria é obrigatória")
    private Integer categoriaId;

    @NotNull(message = "Endereço é obrigatório")
    private UUID enderecoId;

    @Future(message = "Data de expiração deve ser futura")
    private LocalDateTime expiraEm;
}