package com.reusehub.anuncio.mapper;

import com.reusehub.anuncio.dto.AnuncioRespostaDTO;
import com.reusehub.anuncio.dto.ImagemAnuncioRespostaDTO;
import com.reusehub.anuncio.model.Anuncio;
import com.reusehub.anuncio.model.ImagemAnuncio;
import com.reusehub.anuncio.repository.ImagemAnuncioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Converte entidades {@link Anuncio} no DTO de resposta da API.
 * Centraliza o mapeamento e a busca de imagens associadas para evitar
 * duplicacao entre {@code AnuncioService} e o novo modulo de destaque.
 */
@Component
@RequiredArgsConstructor
public class AnuncioRespostaMapper {

    private final ImagemAnuncioRepository imagemAnuncioRepository;

    public AnuncioRespostaDTO mapear(Anuncio anuncio) {
        List<ImagemAnuncio> imagensOrdenadas = imagemAnuncioRepository
                .findByAnuncioIdOrderByOrdemExibicaoAsc(anuncio.getId());
        List<String> urlsImagens = imagensOrdenadas.stream()
                .map(ImagemAnuncio::getUrlImagem)
                .toList();
        List<ImagemAnuncioRespostaDTO> imagensDetalhadas = imagensOrdenadas.stream()
                .map(ImagemAnuncioRespostaDTO::deEntidade)
                .toList();

        return AnuncioRespostaDTO.builder()
                .id(anuncio.getId())
                .titulo(anuncio.getTitulo())
                .descricao(anuncio.getDescricao())
                .tipo(anuncio.getTipo())
                .condicao(anuncio.getCondicao())
                .status(anuncio.getStatus())
                .totalVisualizacoes(anuncio.getTotalVisualizacoes())
                .notaRelevancia(anuncio.getNotaRelevancia() != null ? anuncio.getNotaRelevancia() : BigDecimal.ZERO)
                .criadoEm(anuncio.getCriadoEm())
                .atualizadoEm(anuncio.getAtualizadoEm())
                .usuarioId(anuncio.getUsuario().getId())
                .nomeUsuario(anuncio.getUsuario().getName())
                .categoriaId(anuncio.getCategoria().getId())
                .nomeCategoria(anuncio.getCategoria().getNome())
                .enderecoId(anuncio.getEndereco().getId())
                .imagensUrls(urlsImagens)
                .imagens(imagensDetalhadas)
                .cep(anuncio.getEndereco().getCep())
                .rua(anuncio.getEndereco().getRua())
                .bairro(anuncio.getEndereco().getBairro())
                .cidade(anuncio.getEndereco().getCidade())
                .uf(anuncio.getEndereco().getUf())
                .build();
    }

    /**
     * Helper: descobre o id do dono sem carregar o anuncio completo.
     */
    public UUID idDoDono(Anuncio anuncio) {
        return anuncio.getUsuario().getId();
    }
}
