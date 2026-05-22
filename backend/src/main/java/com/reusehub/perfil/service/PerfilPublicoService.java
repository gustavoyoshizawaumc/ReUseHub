package com.reusehub.perfil.service;

import com.reusehub.anuncio.dto.AnuncioRespostaDTO;
import com.reusehub.anuncio.exception.RecursoNaoEncontradoException;
import com.reusehub.anuncio.model.Anuncio;
import com.reusehub.anuncio.model.ImagemAnuncio;
import com.reusehub.anuncio.repository.AnuncioRepository;
import com.reusehub.anuncio.repository.ImagemAnuncioRepository;
import com.reusehub.auth.model.Usuario;
import com.reusehub.auth.repository.UsuarioRepository;
import com.reusehub.avaliacao.service.AvaliacaoService;
import com.reusehub.perfil.dto.PerfilPublicoDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PerfilPublicoService {

    private final UsuarioRepository usuarioRepository;
    private final AnuncioRepository anuncioRepository;
    private final ImagemAnuncioRepository imagemAnuncioRepository;
    private final AvaliacaoService avaliacaoService;

    @Transactional(readOnly = true)
    public PerfilPublicoDTO obter(UUID usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário", usuarioId));

        List<AnuncioRespostaDTO> anunciosAtivos = anuncioRepository
                .findByUsuarioIdAndStatusOrderByCriadoEmDesc(usuarioId, Anuncio.StatusAnuncio.ATIVO)
                .stream()
                .map(this::mapearAnuncio)
                .toList();

        return new PerfilPublicoDTO(
                usuario.getId(),
                usuario.getName(),
                usuario.getAvatarUrl(),
                usuario.getBio(),
                usuario.getReputationScore(),
                anunciosAtivos,
                avaliacaoService.listarRecebidas(usuarioId)
        );
    }

    private AnuncioRespostaDTO mapearAnuncio(Anuncio anuncio) {
        List<String> urlsImagens = imagemAnuncioRepository
                .findByAnuncioIdOrderByOrdemExibicaoAsc(anuncio.getId())
                .stream()
                .map(ImagemAnuncio::getUrlImagem)
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
                .expiraEm(anuncio.getExpiraEm())
                .criadoEm(anuncio.getCriadoEm())
                .atualizadoEm(anuncio.getAtualizadoEm())
                .usuarioId(anuncio.getUsuario().getId())
                .nomeUsuario(anuncio.getUsuario().getName())
                .categoriaId(anuncio.getCategoria().getId())
                .nomeCategoria(anuncio.getCategoria().getNome())
                .enderecoId(anuncio.getEndereco().getId())
                .imagensUrls(urlsImagens)
                .cep(anuncio.getEndereco().getCep())
                .numero(anuncio.getEndereco().getNumero())
                .complemento(anuncio.getEndereco().getComplemento())
                .rua(anuncio.getEndereco().getRua())
                .bairro(anuncio.getEndereco().getBairro())
                .cidade(anuncio.getEndereco().getCidade())
                .uf(anuncio.getEndereco().getUf())
                .build();
    }
}
