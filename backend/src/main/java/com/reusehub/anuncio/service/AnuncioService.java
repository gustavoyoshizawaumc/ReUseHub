package com.reusehub.anuncio.service;

import com.reusehub.anuncio.dto.*;
import com.reusehub.anuncio.exception.*;
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
        Usuario usuario = buscarUsuarioPorEmail(emailUsuario);
        Endereco enderecoSalvo = cadastrarEnderecoViaCep(usuario, dto);
        Categoria categoria = buscarCategoriaPorId(dto.getCategoriaId());

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
        salvarImagensDoAnuncio(salvo, imagens);

        return mapearParaRespostaDTO(salvo);
    }

    public AnuncioRespostaDTO obterAnuncioPorId(UUID id, String emailUsuario) {
        Anuncio anuncio = buscarAnuncioPorId(id);

        if (anuncio.getStatus() != Anuncio.StatusAnuncio.ATIVO) {
            validarAcessoAnuncioInativo(anuncio, emailUsuario);
        }

        anuncio.setTotalVisualizacoes(anuncio.getTotalVisualizacoes() + 1);
        anuncioRepository.save(anuncio);

        return mapearParaRespostaDTO(anuncio);
    }

    @Transactional(readOnly = true)
    public Page<AnuncioRespostaDTO> listarAnunciosDoUsuario(String emailUsuario, Pageable pageable) {
        Usuario usuario = buscarUsuarioPorEmail(emailUsuario);
        return anuncioRepository.findByUsuarioIdOrderByCriadoEmDesc(usuario.getId(), pageable)
                .map(this::mapearParaRespostaDTO);
    }

    @Transactional(readOnly = true)
    public Page<AnuncioRespostaDTO> listarAnunciosAtivos(Pageable pageable) {
        return anuncioRepository.findAnunciosAtivosOrdenadosPorRelevancia(pageable)
                .map(this::mapearParaRespostaDTO);
    }

    @Transactional(readOnly = true)
    public Page<AnuncioRespostaDTO> buscarAnuncios(String termo, Pageable pageable) {
        return anuncioRepository.buscarPorTermo(termo, pageable)
                .map(this::mapearParaRespostaDTO);
    }

    @Transactional(readOnly = true)
    public Page<AnuncioRespostaDTO> listarPorCategoria(Integer categoriaId, Pageable pageable) {
        return anuncioRepository.findByCategoriaIdAndStatus(categoriaId, Anuncio.StatusAnuncio.ATIVO, pageable)
                .map(this::mapearParaRespostaDTO);
    }

    @Transactional(readOnly = true)
    public Page<AnuncioRespostaDTO> listarPorTipo(Anuncio.TipoAnuncio tipo, Pageable pageable) {
        return anuncioRepository.findByTipoAndStatus(tipo, Anuncio.StatusAnuncio.ATIVO, pageable)
                .map(this::mapearParaRespostaDTO);
    }

    public AnuncioRespostaDTO atualizarAnuncio(UUID id, String emailUsuario, AnuncioAtualizacaoDTO dto) {
        Anuncio anuncio = buscarAnuncioPorId(id);
        validarPropriedadeDoAnuncio(anuncio, emailUsuario);

        Endereco endereco = enderecoRepository.findByIdAndUsuarioId(dto.getEnderecoId(), anuncio.getUsuario().getId())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Endereço", dto.getEnderecoId()));

        anuncio.setTitulo(dto.getTitulo());
        anuncio.setDescricao(dto.getDescricao());
        anuncio.setCondicao(dto.getCondicao());
        anuncio.setEndereco(endereco);
        anuncio.setExpiraEm(dto.getExpiraEm());

        Anuncio atualizado = anuncioRepository.save(anuncio);
        return mapearParaRespostaDTO(atualizado);
    }

    public AnuncioRespostaDTO alterarStatus(UUID id, String emailUsuario, Anuncio.StatusAnuncio novoStatus) {
        Anuncio anuncio = buscarAnuncioPorId(id);
        validarPropriedadeDoAnuncio(anuncio, emailUsuario);
        validarRestricaoStatusDeUsuario(novoStatus);

        anuncio.setStatus(novoStatus);
        Anuncio atualizado = anuncioRepository.save(anuncio);
        return mapearParaRespostaDTO(atualizado);
    }

    public void deletarAnuncio(UUID id, String emailUsuario) {
        Anuncio anuncio = buscarAnuncioPorId(id);
        validarPropriedadeDoAnuncio(anuncio, emailUsuario);
        anuncioRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public Page<AnuncioRespostaDTO> listarAnunciosPendentes(Pageable pageable) {
        return anuncioRepository.findByStatusOrderByCriadoEmDesc(Anuncio.StatusAnuncio.PENDENTE, pageable)
                .map(this::mapearParaRespostaDTO);
    }

    public AnuncioRespostaDTO aprovarAnuncio(UUID id, String emailModerador) {
        validarModerador(emailModerador);
        Anuncio anuncio = buscarAnuncioPorId(id);
        validarEstadoPendenteParaModerar(anuncio, "aprovados");

        anuncio.setStatus(Anuncio.StatusAnuncio.ATIVO);
        Anuncio atualizado = anuncioRepository.save(anuncio);
        return mapearParaRespostaDTO(atualizado);
    }

    public AnuncioRespostaDTO reprovarAnuncio(UUID id, String emailModerador) {
        validarModerador(emailModerador);
        Anuncio anuncio = buscarAnuncioPorId(id);
        validarEstadoPendenteParaModerar(anuncio, "reprovados");

        anuncio.setStatus(Anuncio.StatusAnuncio.REPROVADO);
        Anuncio atualizado = anuncioRepository.save(anuncio);
        return mapearParaRespostaDTO(atualizado);
    }

    private Usuario buscarUsuarioPorEmail(String email) {
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário", email));
    }

    private Categoria buscarCategoriaPorId(Integer id) {
        return categoriaRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Categoria", id));
    }

    private Anuncio buscarAnuncioPorId(UUID id) {
        return anuncioRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Anúncio", id));
    }

    private Endereco cadastrarEnderecoViaCep(Usuario usuario, AnuncioCriacaoComEnderecoDTO dto) {
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

        return enderecoRepository.save(endereco);
    }

    private void salvarImagensDoAnuncio(Anuncio anuncio, List<MultipartFile> imagens) {
        if (imagens == null || imagens.isEmpty()) return;

        List<String> urlsImagens = storageService.salvarImagens(imagens);
        for (int i = 0; i < urlsImagens.size(); i++) {
            ImagemAnuncio imagem = ImagemAnuncio.builder()
                    .anuncio(anuncio)
                    .urlImagem(urlsImagens.get(i))
                    .capa(i == 0)
                    .ordemExibicao((short) i)
                    .build();
            imagemAnuncioRepository.save(imagem);
        }
    }

    private void validarPropriedadeDoAnuncio(Anuncio anuncio, String emailUsuario) {
        if (!anuncio.getUsuario().getEmail().equals(emailUsuario)) {
            throw new AcessoNegadoException("Você não tem permissão para alterar o anúncio de outro usuário.");
        }
    }

    private void validarModerador(String emailModerador) {
        Usuario moderador = buscarUsuarioPorEmail(emailModerador);
        String perfil = moderador.getPerfil().name();

        if (!"MODERADOR".equals(perfil) && !"ADMIN".equals(perfil)) {
            throw new AcessoNegadoException("Acesso negado: Você não tem permissão de moderação.");
        }
    }

    private void validarAcessoAnuncioInativo(Anuncio anuncio, String emailUsuario) {
        if (emailUsuario == null) {
            throw new OperacaoInvalidaException("Anúncio temporariamente indisponível.");
        }

        Usuario usuario = buscarUsuarioPorEmail(emailUsuario);
        boolean dono = anuncio.getUsuario().getId().equals(usuario.getId());
        boolean moderador = usuario.getPerfil() == Perfil.MODERADOR || usuario.getPerfil() == Perfil.ADMIN;

        if (!dono && !moderador) {
            throw new OperacaoInvalidaException("Anúncio temporariamente indisponível.");
        }
    }

    private void validarEstadoPendenteParaModerar(Anuncio anuncio, String acao) {
        if (anuncio.getStatus() != Anuncio.StatusAnuncio.PENDENTE) {
            throw new RegraNegocioException("Somente anúncios pendentes podem ser " + acao + ".");
        }
    }

    private void validarRestricaoStatusDeUsuario(Anuncio.StatusAnuncio novoStatus) {
        if (novoStatus == Anuncio.StatusAnuncio.ATIVO || novoStatus == Anuncio.StatusAnuncio.REPROVADO) {
            throw new RegraNegocioException("Esse status só pode ser alterado pela moderação.");
        }
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