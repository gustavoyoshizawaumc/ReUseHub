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
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AnuncioService {

    private static final int MINIMO_IMAGENS_POR_ANUNCIO = 3;
    private static final int MAXIMO_IMAGENS_POR_ANUNCIO = 5;
    private static final int TEMPO_VIDA_ANUNCIO_DIAS = 30;

    private final AnuncioRepository anuncioRepository;
    private final AnuncioFavoritoRepository anuncioFavoritoRepository;
    private final UsuarioRepository usuarioRepository;
    private final CategoriaRepository categoriaRepository;
    private final EnderecoRepository enderecoRepository;
    private final ViaCepService viaCepService;
    private final GeocodingHibridoService geocodingHibridoService;
    private final LocalizacaoService localizacaoService;
    private final StorageService storageService;
    private final ImagemAnuncioRepository imagemAnuncioRepository;
    private final ModeracaoService moderacaoService;
    private final com.reusehub.anuncio.mapper.AnuncioRespostaMapper anuncioRespostaMapper;

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
        validarRangeDeImagens(quantidade, "");
    }

    private void validarRangeDeImagens(int quantidade, String complementoMensagem) {
        if (quantidade < MINIMO_IMAGENS_POR_ANUNCIO || quantidade > MAXIMO_IMAGENS_POR_ANUNCIO) {
            throw new OperacaoInvalidaException(
                    "O anuncio deve conter entre " + MINIMO_IMAGENS_POR_ANUNCIO
                            + " e " + MAXIMO_IMAGENS_POR_ANUNCIO + " imagens" + complementoMensagem + "."
            );
        }
    }

    /**
     * Apenas le o anuncio. Tracking de visualizacao acontece via
     * {@code POST /api/anuncios/{id}/visualizacao} (RegistroVisualizacaoService).
     */
    public AnuncioRespostaDTO obterAnuncioPorId(UUID id, String emailUsuario) {
        Anuncio anuncio = buscarAnuncioPorId(id);

        if (anuncio.getStatus() != Anuncio.StatusAnuncio.ATIVO) {
            validarAcessoAnuncioInativo(anuncio, emailUsuario);
        }

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

        Endereco endereco = resolverEnderecoParaAtualizacao(anuncio, dto);
        Categoria categoria = buscarCategoriaPorId(dto.getCategoriaId());

        anuncio.setTitulo(dto.getTitulo());
        anuncio.setDescricao(dto.getDescricao());
        anuncio.setCondicao(dto.getCondicao());
        anuncio.setCategoria(categoria);
        anuncio.setEndereco(endereco);
        anuncio.setStatus(Anuncio.StatusAnuncio.PENDENTE);
        anuncio.setMotivoSuspensao(null);

        Anuncio atualizado = anuncioRepository.save(anuncio);
        return mapearParaRespostaDTO(atualizado);
    }

    public AnuncioRespostaDTO atualizarImagensDoAnuncio(
            UUID anuncioId,
            String emailUsuario,
            AnuncioImagensAtualizacaoDTO dto,
            List<MultipartFile> novasImagens
    ) {
        Anuncio anuncio = buscarAnuncioPorId(anuncioId);
        validarPropriedadeDoAnuncio(anuncio, emailUsuario);

        List<UUID> idsParaManter = dto.idsParaManter() == null ? List.of() : dto.idsParaManter();
        List<MultipartFile> imagensNovasValidas = filtrarImagensNaoVazias(novasImagens);

        int totalAposEdicao = idsParaManter.size() + imagensNovasValidas.size();
        validarTotalDeImagensAposEdicao(totalAposEdicao);

        List<ImagemAnuncio> imagensAtuais = imagemAnuncioRepository.findByAnuncioId(anuncioId);
        Map<UUID, ImagemAnuncio> imagensAtuaisPorId = imagensAtuais.stream()
                .collect(Collectors.toMap(ImagemAnuncio::getId, Function.identity()));
        validarIdsPertencemAoAnuncio(idsParaManter, imagensAtuaisPorId);

        removerImagensNaoMantidas(imagensAtuais, idsParaManter);
        reordenarImagensMantidas(idsParaManter, imagensAtuaisPorId);
        adicionarNovasImagens(anuncio, imagensNovasValidas, idsParaManter.size());

        anuncio.setStatus(Anuncio.StatusAnuncio.PENDENTE);
        anuncio.setMotivoSuspensao(null);
        Anuncio atualizado = anuncioRepository.save(anuncio);
        return mapearParaRespostaDTO(atualizado);
    }

    private List<MultipartFile> filtrarImagensNaoVazias(List<MultipartFile> imagens) {
        if (imagens == null || imagens.isEmpty()) {
            return List.of();
        }
        return imagens.stream()
                .filter(imagem -> !imagem.isEmpty())
                .toList();
    }

    private void validarTotalDeImagensAposEdicao(int totalAposEdicao) {
        validarRangeDeImagens(totalAposEdicao, " apos a edicao");
    }

    private void validarIdsPertencemAoAnuncio(
            List<UUID> idsParaManter,
            Map<UUID, ImagemAnuncio> imagensAtuaisPorId
    ) {
        for (UUID idDeImagem : idsParaManter) {
            if (!imagensAtuaisPorId.containsKey(idDeImagem)) {
                throw new RecursoNaoEncontradoException("Imagem", idDeImagem);
            }
        }
    }

    private void removerImagensNaoMantidas(List<ImagemAnuncio> imagensAtuais, List<UUID> idsParaManter) {
        Set<UUID> conjuntoIdsMantidos = new HashSet<>(idsParaManter);
        for (ImagemAnuncio imagem : imagensAtuais) {
            if (!conjuntoIdsMantidos.contains(imagem.getId())) {
                storageService.excluirImagem(imagem.getUrlImagem());
                imagemAnuncioRepository.delete(imagem);
            }
        }
    }

    private void reordenarImagensMantidas(
            List<UUID> idsParaManter,
            Map<UUID, ImagemAnuncio> imagensAtuaisPorId
    ) {
        for (int posicao = 0; posicao < idsParaManter.size(); posicao++) {
            ImagemAnuncio imagem = imagensAtuaisPorId.get(idsParaManter.get(posicao));
            imagem.setOrdemExibicao((short) posicao);
            imagem.setCapa(posicao == 0);
            imagemAnuncioRepository.save(imagem);
        }
    }

    private void adicionarNovasImagens(
            Anuncio anuncio,
            List<MultipartFile> novasImagens,
            int posicaoInicial
    ) {
        if (novasImagens.isEmpty()) {
            return;
        }
        List<String> urlsNovasImagens = storageService.salvarImagens(novasImagens);
        for (int i = 0; i < urlsNovasImagens.size(); i++) {
            int ordemFinal = posicaoInicial + i;
            ImagemAnuncio imagem = construirImagemAnuncio(anuncio, urlsNovasImagens.get(i), ordemFinal);
            imagemAnuncioRepository.save(imagem);
        }
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

    public Page<AnuncioRespostaDTO> listarAnunciosParaModeracao(
            String termo,
            Anuncio.StatusAnuncio status,
            Pageable pageable
    ) {
        String termoNormalizado = termo == null || termo.isBlank() ? "" : termo.trim();
        String statusNormalizado = status == null ? "" : status.name();
        return anuncioRepository.buscarParaModeracao(termoNormalizado, statusNormalizado, pageable)
                .map(this::mapearParaRespostaDTO);
    }

    public AnuncioRespostaDTO aprovarAnuncio(UUID id, String emailModerador) {
        Usuario moderador = validarModerador(emailModerador);
        Anuncio anuncio = buscarAnuncioPorId(id);
        validarEstadoPendenteParaModerar(anuncio, "aprovados");

        anuncio.setStatus(Anuncio.StatusAnuncio.ATIVO);
        anuncio.setMotivoSuspensao(null);
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
                .expiraEm(LocalDateTime.now().plusDays(TEMPO_VIDA_ANUNCIO_DIAS))
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
        ResultadoGeocoding geocoding = obterCoordenadasDoEndereco(dadosCEP);

        Endereco endereco = construirEndereco(usuario, dto, dadosCEP, geocoding);
        return enderecoRepository.save(endereco);
    }

    private Endereco resolverEnderecoParaAtualizacao(Anuncio anuncio, AnuncioAtualizacaoDTO dto) {
        Endereco enderecoAtual = enderecoRepository.findByIdAndUsuarioId(dto.getEnderecoId(), anuncio.getUsuario().getId())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Endereço", dto.getEnderecoId()));

        if (dto.getCep() == null || dto.getCep().isBlank() || dto.getCep().equals(enderecoAtual.getCep())) {
            return enderecoAtual;
        }

        ViaCepService.DadosCEP dadosCEP = viaCepService.buscarDadosCEP(dto.getCep());
        ResultadoGeocoding geocoding = obterCoordenadasDoEndereco(dadosCEP);

        enderecoAtual.setCep(dto.getCep());
        enderecoAtual.setRua(dadosCEP.rua());
        enderecoAtual.setNumero(null);
        enderecoAtual.setComplemento(null);
        enderecoAtual.setBairro(dadosCEP.bairro());
        enderecoAtual.setCidade(dadosCEP.cidade());
        enderecoAtual.setUf(dadosCEP.uf());
        enderecoAtual.setLatitude(geocoding.latitude());
        enderecoAtual.setLongitude(geocoding.longitude());
        enderecoAtual.setPrecisaoLocalizacao(geocoding.precisao());

        return enderecoRepository.save(enderecoAtual);
    }

    private Endereco construirEndereco(
            Usuario usuario,
            AnuncioCriacaoComEnderecoDTO dto,
            ViaCepService.DadosCEP dadosCEP,
            ResultadoGeocoding geocoding
    ) {
        return Endereco.builder()
                .usuario(usuario)
                .cep(dto.getCep())
                .rua(dadosCEP.rua())
                .bairro(dadosCEP.bairro())
                .cidade(dadosCEP.cidade())
                .uf(dadosCEP.uf())
                .latitude(geocoding.latitude())
                .longitude(geocoding.longitude())
                .precisaoLocalizacao(geocoding.precisao())
                .principal(false)
                .build();
    }

    private ResultadoGeocoding obterCoordenadasDoEndereco(ViaCepService.DadosCEP dadosCEP) {
        String enderecoCompleto = montarEnderecoCompleto(dadosCEP);
        return geocodingHibridoService.obterCoordenadasPorEndereco(enderecoCompleto);
    }

    private String montarEnderecoCompleto(ViaCepService.DadosCEP dadosCEP) {
        return String.format("%s, %s, %s, %s, Brasil",
                dadosCEP.rua(),
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
        return anuncioRespostaMapper.mapear(anuncio);
    }

}
