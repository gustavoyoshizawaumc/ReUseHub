package com.reusehub.anuncio.service;

import com.reusehub.anuncio.dto.*;
import com.reusehub.anuncio.model.Anuncio;
import com.reusehub.anuncio.model.Categoria;
import com.reusehub.anuncio.model.Endereco;
import com.reusehub.anuncio.model.ImagemAnuncio;
import com.reusehub.anuncio.repository.AnuncioRepository;
import com.reusehub.anuncio.repository.CategoriaRepository;
import com.reusehub.anuncio.repository.EnderecoRepository;
import com.reusehub.anuncio.repository.ImagemAnuncioRepository;
import com.reusehub.auth.model.Perfil;
import com.reusehub.auth.model.Usuario;
import com.reusehub.auth.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class AnuncioService {

    private final AnuncioRepository anuncioRepository;
    private final UsuarioRepository usuarioRepository;
    private final CategoriaRepository categoriaRepository;
    private final EnderecoRepository enderecoRepository;
    private final ViaCepService viaCepService;
    private final StorageService storageService;
    private final ImagemAnuncioRepository imagemAnuncioRepository;

    public AnuncioRespostaDTO criarAnuncioComEndereco(
            String emailUsuario,
            AnuncioCriacaoComEnderecoDTO dto,
            List<MultipartFile> imagens
    ) {
        Usuario usuario = usuarioRepository.findByEmail(emailUsuario)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        ViaCepService.DadosCEP dadosCEP = viaCepService.buscarDadosCEP(dto.getCep());

        Endereco endereco = Endereco.builder()
                .usuario(usuario)
                .cep(dto.getCep())
                .rua(dadosCEP.getRua())
                .numero(dto.getNumero())
                .complemento(dto.getComplemento())
                .bairro(dadosCEP.getBairro())
                .cidade(dadosCEP.getCidade())
                .uf(dadosCEP.getUf())
                .latitude(BigDecimal.ZERO)
                .longitude(BigDecimal.ZERO)
                .principal(false)
                .build();

        Endereco enderecoSalvo = enderecoRepository.save(endereco);

        Categoria categoria = categoriaRepository.findById(dto.getCategoriaId())
                .orElseThrow(() -> new RuntimeException("Categoria não encontrada"));

        Anuncio anuncio = Anuncio.builder()
                .usuario(usuario)
                .categoria(categoria)
                .endereco(enderecoSalvo)
                .titulo(dto.getTitulo())
                .descricao(dto.getDescricao())
                .tipo(dto.getTipo())
                .condicao(dto.getCondicao())
                .status(Anuncio.StatusAnuncio.PENDENTE)
                .totalVisualizacoes(0)
                .expiraEm(dto.getExpiraEm())
                .build();

        Anuncio salvo = anuncioRepository.save(anuncio);

        List<String> urlsImagens = storageService.salvarImagens(imagens);

        for (int i = 0; i < urlsImagens.size(); i++) {
            ImagemAnuncio imagem = ImagemAnuncio.builder()
                    .anuncio(salvo)
                    .urlImagem(urlsImagens.get(i))
                    .capa(i == 0)
                    .ordemExibicao((short) i)
                    .build();
            imagemAnuncioRepository.save(imagem);
        }

        return mapearParaRespostaDTO(salvo);
    }

    @Transactional
        public AnuncioRespostaDTO obterAnuncioPorId(UUID id, String emailUsuario) {
        Anuncio anuncio = anuncioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Anúncio não encontrado"));

        if (anuncio.getStatus() != Anuncio.StatusAnuncio.ATIVO) {
                // anúncio não ativo: só dono ou moderador pode ver
                if (emailUsuario == null) {
                throw new RuntimeException("Anúncio não disponível");
                }

                Usuario usuario = usuarioRepository.findByEmail(emailUsuario)
                        .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

                boolean dono = anuncio.getUsuario().getId().equals(usuario.getId());
                boolean moderador = usuario.getPerfil() == Perfil.MODERADOR
                                || usuario.getPerfil() == Perfil.ADMIN;

                if (!dono && !moderador) {
                throw new RuntimeException("Anúncio não disponível");
                }
        }

        anuncio.setTotalVisualizacoes(anuncio.getTotalVisualizacoes() + 1);
        anuncioRepository.save(anuncio);

        return mapearParaRespostaDTO(anuncio);
        }

        @Transactional(readOnly = true)
        public Page<AnuncioRespostaDTO> listarAnunciosDoUsuario(String emailUsuario, Pageable pageable) {
        Usuario usuario = usuarioRepository.findByEmail(emailUsuario)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        return anuncioRepository.findByUsuarioIdOrderByCriadoEmDesc(usuario.getId(), pageable)
                .map(this::mapearParaRespostaDTO);
        }

    @Transactional(readOnly = true)
    public Page<AnuncioRespostaDTO> listarAnunciosAtivos(Pageable pageable) {
        return anuncioRepository.findAnunciosAtivosOrdenadosPorRelevancia(pageable)
                .map(this::mapearParaRespostaDTO);
    }

    @Transactional(readOnly = true)
    public Page<AnuncioRespostaDTO> buscarAnuncios(
            String termo,
            Pageable pageable
    ) {
        return anuncioRepository.buscarPorTermo(termo, pageable)
                .map(this::mapearParaRespostaDTO);
    }

    @Transactional(readOnly = true)
    public Page<AnuncioRespostaDTO> listarPorCategoria(
            Integer categoriaId,
            Pageable pageable
    ) {
        return anuncioRepository.findByCategoriaIdAndStatus(
                categoriaId,
                Anuncio.StatusAnuncio.ATIVO,
                pageable
        ).map(this::mapearParaRespostaDTO);
    }

    @Transactional(readOnly = true)
    public Page<AnuncioRespostaDTO> listarPorTipo(
            Anuncio.TipoAnuncio tipo,
            Pageable pageable
    ) {
        return anuncioRepository.findByTipoAndStatus(
                tipo,
                Anuncio.StatusAnuncio.ATIVO,
                pageable
        ).map(this::mapearParaRespostaDTO);
    }

    public AnuncioRespostaDTO atualizarAnuncio(
            UUID id,
            String emailUsuario,
            AnuncioAtualizacaoDTO dto
    ) {
        Anuncio anuncio = anuncioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Anúncio não encontrado"));

        if (!anuncio.getUsuario().getEmail().equals(emailUsuario)) {
            throw new RuntimeException("Você não pode editar anúncio de outro usuário");
        }

        Endereco endereco = enderecoRepository.findByIdAndUsuarioId(
                dto.getEnderecoId(),
                anuncio.getUsuario().getId()
        ).orElseThrow(() -> new RuntimeException("Endereço não encontrado"));

        anuncio.setTitulo(dto.getTitulo());
        anuncio.setDescricao(dto.getDescricao());
        anuncio.setCondicao(dto.getCondicao());
        anuncio.setEndereco(endereco);
        anuncio.setExpiraEm(dto.getExpiraEm());

        Anuncio atualizado = anuncioRepository.save(anuncio);
        return mapearParaRespostaDTO(atualizado);
    }

    public AnuncioRespostaDTO alterarStatus(
                UUID id,
                String emailUsuario,
                Anuncio.StatusAnuncio novoStatus
        ) {
        Anuncio anuncio = anuncioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Anúncio não encontrado"));

        if (!anuncio.getUsuario().getEmail().equals(emailUsuario)) {
                throw new RuntimeException("Você não pode alterar status de anúncio de outro usuário");
        }

        if (novoStatus == Anuncio.StatusAnuncio.ATIVO || novoStatus == Anuncio.StatusAnuncio.REPROVADO) {
                throw new RuntimeException("Esse status só pode ser alterado pela moderação");
        }

        anuncio.setStatus(novoStatus);
        Anuncio atualizado = anuncioRepository.save(anuncio);
        return mapearParaRespostaDTO(atualizado);
    }

    public void deletarAnuncio(
            UUID id,
            String emailUsuario
    ) {
        Anuncio anuncio = anuncioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Anúncio não encontrado"));

        if (!anuncio.getUsuario().getEmail().equals(emailUsuario)) {
            throw new RuntimeException("Você não pode deletar anúncio de outro usuário");
        }

        anuncioRepository.deleteById(id);
    }

    private Usuario buscarUsuarioPorEmail(String email) {
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
    }

    private void validarModerador(String emailModerador) {
        Usuario moderador = buscarUsuarioPorEmail(emailModerador);

        String perfil = moderador.getPerfil().name();

        if (!"MODERADOR".equals(perfil) && !"ADMIN".equals(perfil)) {
            throw new RuntimeException("Você não tem permissão para moderar anúncios");
        }
    }

    @Transactional(readOnly = true)
    public Page<AnuncioRespostaDTO> listarAnunciosPendentes(Pageable pageable) {
        return anuncioRepository
                .findByStatusOrderByCriadoEmDesc(Anuncio.StatusAnuncio.PENDENTE, pageable)
                .map(this::mapearParaRespostaDTO);
    }

    public AnuncioRespostaDTO aprovarAnuncio(UUID id, String emailModerador) {
        validarModerador(emailModerador);

        Anuncio anuncio = anuncioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Anúncio não encontrado"));

        if (anuncio.getStatus() != Anuncio.StatusAnuncio.PENDENTE) {
            throw new RuntimeException("Somente anúncios pendentes podem ser aprovados");
        }

        anuncio.setStatus(Anuncio.StatusAnuncio.ATIVO);
        Anuncio atualizado = anuncioRepository.save(anuncio);

        return mapearParaRespostaDTO(atualizado);
    }

    public AnuncioRespostaDTO reprovarAnuncio(UUID id, String emailModerador) {
        validarModerador(emailModerador);

        Anuncio anuncio = anuncioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Anúncio não encontrado"));

        if (anuncio.getStatus() != Anuncio.StatusAnuncio.PENDENTE) {
            throw new RuntimeException("Somente anúncios pendentes podem ser reprovados");
        }

        anuncio.setStatus(Anuncio.StatusAnuncio.REPROVADO);
        Anuncio atualizado = anuncioRepository.save(anuncio);

        return mapearParaRespostaDTO(atualizado);
    }

    private AnuncioRespostaDTO mapearParaRespostaDTO(Anuncio anuncio) {
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