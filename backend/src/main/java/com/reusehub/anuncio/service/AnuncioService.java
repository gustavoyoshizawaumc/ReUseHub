package com.reusehub.anuncio.service;

import com.reusehub.anuncio.dto.*;
import com.reusehub.anuncio.exception.*;
import com.reusehub.anuncio.model.Anuncio;
import com.reusehub.anuncio.model.AnuncioFavorito;
import com.reusehub.anuncio.model.AnuncioFavoritoId;
import com.reusehub.anuncio.model.Categoria;
import com.reusehub.anuncio.model.Endereco;
import com.reusehub.anuncio.model.ImagemAnuncio;
import com.reusehub.anuncio.repository.AnuncioFavoritoRepository;
import com.reusehub.anuncio.repository.AnuncioRepository;
import com.reusehub.anuncio.repository.CategoriaRepository;
import com.reusehub.anuncio.repository.EnderecoRepository;
import com.reusehub.anuncio.repository.ImagemAnuncioRepository;
import com.reusehub.auth.model.Perfil;
import com.reusehub.auth.model.Usuario;
import com.reusehub.auth.repository.UsuarioRepository;
import com.reusehub.moderacao.service.ModeracaoService;
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

    private static final int MINIMO_IMAGENS_POR_ANUNCIO = 3;
    private static final int MAXIMO_IMAGENS_POR_ANUNCIO = 5;

    private final AnuncioRepository anuncioRepository;
    private final AnuncioFavoritoRepository anuncioFavoritoRepository;
    private final UsuarioRepository usuarioRepository;
    private final CategoriaRepository categoriaRepository;
    private final EnderecoRepository enderecoRepository;
    private final ViaCepService viaCepService;
    private final NominatimService nominatimService;
    private final LocalizacaoService localizacaoService;
    private final StorageService storageService;
    private final ImagemAnuncioRepository imagemAnuncioRepository;
    private final ModeracaoService moderacaoService;

    public AnuncioRespostaDTO criarAnuncioComEndereco(
            String emailUsuario,
            AnuncioCriacaoComEnderecoDTO dto,
            List<MultipartFile> imagens
    ) {
        validarQuantidadeDeImagens(imagens);
        Usuario usuario = buscarUsuarioPorEmail(emailUsuario);
        validarContaUsuarioComum(usuario, "criar anuncios");
        Endereco enderecoSalvo = cadastrarEnderecoEnriquecido(usuario, dto);
        Categoria categoria = buscarCategoriaPorId(dto.getCategoriaId());

        Anuncio anuncio = construirAnuncio(usuario, categoria, enderecoSalvo, dto);
        Anuncio salvo = anuncioRepository.save(anuncio);
        salvarImagensDoAnuncio(salvo, imagens);

        return mapearParaRespostaDTO(salvo);
    }

    private void validarQuantidadeDeImagens(List<MultipartFile> imagens) {
        int quantidade = imagens == null ? 0 : imagens.size();

        if (quantidade < MINIMO_IMAGENS_POR_ANUNCIO || quantidade > MAXIMO_IMAGENS_POR_ANUNCIO) {
            throw new OperacaoInvalidaException(
                    "O anuncio deve conter entre " + MINIMO_IMAGENS_POR_ANUNCIO
                            + " e " + MAXIMO_IMAGENS_POR_ANUNCIO + " imagens."
            );
        }
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
    public Page<AnuncioRespostaDTO> buscarComFiltros(
            BuscaFiltroDTO filtro,
            String emailUsuario,
            Pageable pageable
    ) {
        localizacaoService.resolverLocalizacaoEmCascata(filtro, emailUsuario);
        TipoOrdenacao ordenacaoFinal = determinarOrdenacaoPadrao(filtro);

        return anuncioRepository.buscarComFiltros(
                normalizarTermo(filtro.getTermo()),
                filtro.getCategoriaId(),
                converterEnumParaString(filtro.getTipo()),
                converterEnumParaString(filtro.getCondicao()),
                filtro.getLatitude(),
                filtro.getLongitude(),
                filtro.getRaioKm(),
                ordenacaoFinal.name(),
                pageable
        ).map(this::mapearParaRespostaDTO);
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
        anuncio.setStatus(Anuncio.StatusAnuncio.PENDENTE);

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
        Usuario moderador = validarModerador(emailModerador);
        Anuncio anuncio = buscarAnuncioPorId(id);
        validarEstadoPendenteParaModerar(anuncio, "aprovados");

        anuncio.setStatus(Anuncio.StatusAnuncio.ATIVO);
        Anuncio atualizado = anuncioRepository.save(anuncio);
        moderacaoService.registrar(moderador, "ANUNCIO_APROVADO", "ANUNCIO", id, "Aprovado na fila de moderacao.");
        return mapearParaRespostaDTO(atualizado);
    }

    public AnuncioRespostaDTO reprovarAnuncio(UUID id, String emailModerador) {
        Usuario moderador = validarModerador(emailModerador);
        Anuncio anuncio = buscarAnuncioPorId(id);
        validarEstadoPendenteParaModerar(anuncio, "reprovados");

        anuncio.setStatus(Anuncio.StatusAnuncio.REPROVADO);
        Anuncio atualizado = anuncioRepository.save(anuncio);
        moderacaoService.registrar(moderador, "ANUNCIO_REPROVADO", "ANUNCIO", id, "Reprovado na fila de moderacao.");
        return mapearParaRespostaDTO(atualizado);
    }

    @Transactional(readOnly = true)
    public List<UUID> listarIdsFavoritosDoUsuario(String emailUsuario) {
        Usuario usuario = buscarUsuarioPorEmail(emailUsuario);
        return anuncioFavoritoRepository.findAnuncioIdsByUsuarioId(usuario.getId());
    }

    @Transactional(readOnly = true)
    public List<AnuncioRespostaDTO> listarFavoritosDoUsuario(String emailUsuario) {
        Usuario usuario = buscarUsuarioPorEmail(emailUsuario);
        return anuncioFavoritoRepository.findAnunciosFavoritosByUsuarioId(usuario.getId())
                .stream()
                .filter(anuncio -> anuncio.getStatus() == Anuncio.StatusAnuncio.ATIVO)
                .map(this::mapearParaRespostaDTO)
                .toList();
    }

    public void favoritarAnuncio(UUID anuncioId, String emailUsuario) {
        Usuario usuario = buscarUsuarioPorEmail(emailUsuario);
        validarContaUsuarioComum(usuario, "favoritar anuncios");
        Anuncio anuncio = buscarAnuncioPorId(anuncioId);

        if (anuncio.getStatus() != Anuncio.StatusAnuncio.ATIVO) {
            throw new OperacaoInvalidaException("Somente anuncios ativos podem ser favoritados.");
        }

        if (anuncio.getUsuario().getId().equals(usuario.getId())) {
            throw new RegraNegocioException("Voce nao pode favoritar o proprio anuncio.");
        }

        if (anuncioFavoritoRepository.existsByUsuarioIdAndAnuncioId(usuario.getId(), anuncioId)) {
            return;
        }

        anuncioFavoritoRepository.save(
                AnuncioFavorito.builder()
                        .id(new AnuncioFavoritoId(usuario.getId(), anuncioId))
                        .usuario(usuario)
                        .anuncio(anuncio)
                        .build()
        );
    }

    public void desfavoritarAnuncio(UUID anuncioId, String emailUsuario) {
        Usuario usuario = buscarUsuarioPorEmail(emailUsuario);
        anuncioFavoritoRepository.deleteByUsuarioIdAndAnuncioId(usuario.getId(), anuncioId);
    }

    private Anuncio construirAnuncio(
            Usuario usuario,
            Categoria categoria,
            Endereco endereco,
            AnuncioCriacaoComEnderecoDTO dto
    ) {
        return Anuncio.builder()
                .usuario(usuario)
                .categoria(categoria)
                .endereco(endereco)
                .titulo(dto.getTitulo())
                .descricao(dto.getDescricao())
                .tipo(dto.getTipo())
                .condicao(dto.getCondicao())
                .status(Anuncio.StatusAnuncio.PENDENTE)
                .totalVisualizacoes(0)
                .expiraEm(dto.getExpiraEm())
                .build();
    }

    private TipoOrdenacao determinarOrdenacaoPadrao(BuscaFiltroDTO filtro) {
        if (filtro.getOrdenacao() != null) {
            return filtro.getOrdenacao();
        }

        if (filtro.possuiCoordenadas()) {
            return TipoOrdenacao.DISTANCIA;
        }

        if (filtro.possuiTermoBusca()) {
            return TipoOrdenacao.RELEVANCIA;
        }

        return TipoOrdenacao.RELEVANCIA;
    }

    private String normalizarTermo(String termo) {
        return (termo == null || termo.isBlank()) ? null : termo.trim();
    }

    private String converterEnumParaString(Enum<?> valor) {
        return valor == null ? null : valor.name();
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

    private Endereco cadastrarEnderecoEnriquecido(Usuario usuario, AnuncioCriacaoComEnderecoDTO dto) {
        ViaCepService.DadosCEP dadosCEP = viaCepService.buscarDadosCEP(dto.getCep());
        NominatimService.Coordenadas coordenadas = obterCoordenadasDoEndereco(dadosCEP, dto);

        Endereco endereco = construirEndereco(usuario, dto, dadosCEP, coordenadas);
        return enderecoRepository.save(endereco);
    }

    private Endereco construirEndereco(
            Usuario usuario,
            AnuncioCriacaoComEnderecoDTO dto,
            ViaCepService.DadosCEP dadosCEP,
            NominatimService.Coordenadas coordenadas
    ) {
        return Endereco.builder()
                .usuario(usuario)
                .cep(dto.getCep())
                .rua(dadosCEP.rua())
                .numero(dto.getNumero())
                .complemento(dto.getComplemento())
                .bairro(dadosCEP.bairro())
                .cidade(dadosCEP.cidade())
                .uf(dadosCEP.uf())
                .latitude(BigDecimal.valueOf(coordenadas.latitude()))
                .longitude(BigDecimal.valueOf(coordenadas.longitude()))
                .principal(false)
                .build();
    }

    private NominatimService.Coordenadas obterCoordenadasDoEndereco(
            ViaCepService.DadosCEP dadosCEP,
            AnuncioCriacaoComEnderecoDTO dto
    ) {
        try {
            String enderecoCompleto = montarEnderecoCompleto(dadosCEP, dto.getNumero());
            return nominatimService.buscarCoordenadasPorEndereco(enderecoCompleto);
        } catch (Exception e) {
            return new NominatimService.Coordenadas(0.0, 0.0);
        }
    }

    private String montarEnderecoCompleto(ViaCepService.DadosCEP dadosCEP, String numero) {
        return String.format("%s, %s, %s, %s, %s, Brasil",
                dadosCEP.rua(),
                numero,
                dadosCEP.bairro(),
                dadosCEP.cidade(),
                dadosCEP.uf()
        );
    }

    private void salvarImagensDoAnuncio(Anuncio anuncio, List<MultipartFile> imagens) {
        if (imagens == null || imagens.isEmpty()) return;

        List<String> urlsImagens = storageService.salvarImagens(imagens);
        for (int i = 0; i < urlsImagens.size(); i++) {
            ImagemAnuncio imagem = construirImagemAnuncio(anuncio, urlsImagens.get(i), i);
            imagemAnuncioRepository.save(imagem);
        }
    }

    private ImagemAnuncio construirImagemAnuncio(Anuncio anuncio, String url, int indice) {
        return ImagemAnuncio.builder()
                .anuncio(anuncio)
                .urlImagem(url)
                .capa(indice == 0)
                .ordemExibicao((short) indice)
                .build();
    }

    private void validarPropriedadeDoAnuncio(Anuncio anuncio, String emailUsuario) {
        if (!anuncio.getUsuario().getEmail().equals(emailUsuario)) {
            throw new AcessoNegadoException("Você não tem permissão para alterar o anúncio de outro usuário.");
        }
    }

    private Usuario validarModerador(String emailModerador) {
        Usuario moderador = buscarUsuarioPorEmail(emailModerador);
        String perfil = moderador.getPerfil().name();

        if (!"MODERADOR".equals(perfil) && !"ADMIN".equals(perfil)) {
            throw new AcessoNegadoException("Acesso negado: Você não tem permissão de moderação.");
        }
        return moderador;
    }

    private void validarContaUsuarioComum(Usuario usuario, String acao) {
        if (usuario.getPerfil() != Perfil.USUARIO) {
            throw new AcessoNegadoException("Contas administrativas nao podem " + acao + ".");
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
        if (novoStatus == Anuncio.StatusAnuncio.ATIVO
                || novoStatus == Anuncio.StatusAnuncio.REPROVADO
                || novoStatus == Anuncio.StatusAnuncio.SUSPENSO) {
            throw new RegraNegocioException("Esse status só pode ser alterado pela moderação.");
        }
    }

    private AnuncioRespostaDTO mapearParaRespostaDTO(Anuncio anuncio) {
        List<String> urlsImagens = buscarUrlsImagens(anuncio.getId());

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

    private List<String> buscarUrlsImagens(UUID anuncioId) {
        return imagemAnuncioRepository
                .findByAnuncioIdOrderByOrdemExibicaoAsc(anuncioId)
                .stream()
                .map(ImagemAnuncio::getUrlImagem)
                .toList();
    }
}
