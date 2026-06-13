package com.reusehub.anuncio.mapper;

import com.reusehub.anuncio.dto.AnuncioRespostaDTO;
import com.reusehub.anuncio.dto.ImagemAnuncioRespostaDTO;
import com.reusehub.anuncio.model.Anuncio;
import com.reusehub.anuncio.model.ImagemAnuncio;
import com.reusehub.anuncio.repository.ImagemAnuncioRepository;
import com.reusehub.shared.util.NomePublicoUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

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
                .motivoSuspensao(anuncio.getMotivoSuspensao())
                .motivoReprovacao(anuncio.getMotivoReprovacao())
                .criadoEm(anuncio.getCriadoEm())
                .atualizadoEm(anuncio.getAtualizadoEm())
                .usuarioId(anuncio.getUsuario().getId())
                .nomeUsuario(NomePublicoUtils.primeiroNome(anuncio.getUsuario().getName()))
                .notaReputacaoUsuario(anuncio.getUsuario().getReputationScore() != null ? anuncio.getUsuario().getReputationScore() : BigDecimal.ZERO)
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
     * Versão para respostas públicas (home, destaques, listagens e busca sem autenticação).
     * Remove dados que não têm função no card e ferem a minimização da LGPD: logradouro
     * (rua), CEP e bairro — coletados apenas para geocodificação — além dos campos
     * internos de moderação. O público mantém apenas cidade/UF para localização. O nome
     * já é reduzido ao primeiro nome no mapeamento base.
     */
    public AnuncioRespostaDTO mapearPublico(Anuncio anuncio) {
        AnuncioRespostaDTO dto = mapear(anuncio);
        dto.setRua(null);
        dto.setCep(null);
        dto.setBairro(null);
        dto.setMotivoSuspensao(null);
        dto.setMotivoReprovacao(null);
        return dto;
    }

    public UUID idDoDono(Anuncio anuncio) {
        return anuncio.getUsuario().getId();
    }
}
