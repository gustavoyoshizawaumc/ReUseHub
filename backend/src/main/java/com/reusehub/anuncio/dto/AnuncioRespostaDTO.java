package com.reusehub.anuncio.dto;

import com.reusehub.anuncio.model.Anuncio;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnuncioRespostaDTO {

    private UUID id;
    private String titulo;
    private String descricao;
    private Anuncio.TipoAnuncio tipo;
    private Anuncio.CondicaoItem condicao;
    private Anuncio.StatusAnuncio status;
    private Integer totalVisualizacoes;
    private BigDecimal notaRelevancia;
    private LocalDateTime expiraEm;
    private LocalDateTime criadoEm;
    private LocalDateTime atualizadoEm;

    private UUID usuarioId;
    private String nomeUsuario;
    private Integer categoriaId;
    private String nomeCategoria;
    private UUID enderecoId;
    private List<String> imagensUrls;
    private List<ImagemAnuncioRespostaDTO> imagens;

    private String cep;
    private String numero;
    private String complemento;
    private String rua;
    private String bairro;
    private String cidade;
    private String uf;
}