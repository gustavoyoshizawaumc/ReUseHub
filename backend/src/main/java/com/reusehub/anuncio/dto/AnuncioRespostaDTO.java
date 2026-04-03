package com.reusehub.anuncio.dto;

import com.reusehub.anuncio.model.enums.CondicaoItem;
import com.reusehub.anuncio.model.enums.StatusAnuncio;
import com.reusehub.anuncio.model.enums.TipoAnuncio;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class AnuncioRespostaDTO {

    private UUID id;
    private String titulo;
    private String descricao;
    private TipoAnuncio tipo;
    private CondicaoItem condicao;
    private StatusAnuncio status;

    private UUID usuarioId;
    private String nomeUsuario;

    private Integer categoriaId;
    private String nomeCategoria;

    private List<String> urlsImagens;
    private Integer totalVisualizacoes;

    private LocalDateTime criadoEm;
    private LocalDateTime atualizadoEm;
}