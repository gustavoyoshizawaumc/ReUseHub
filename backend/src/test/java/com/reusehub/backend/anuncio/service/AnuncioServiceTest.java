package com.reusehub.backend.anuncio.service;

import com.reusehub.anuncio.dto.AnuncioAtualizacaoDTO;
import com.reusehub.anuncio.dto.AnuncioCriacaoComEnderecoDTO;
import com.reusehub.anuncio.dto.AnuncioImagensAtualizacaoDTO;
import com.reusehub.anuncio.dto.AnuncioRespostaDTO;
import com.reusehub.anuncio.exception.AcessoNegadoException;
import com.reusehub.anuncio.exception.OperacaoInvalidaException;
import com.reusehub.anuncio.exception.RecursoNaoEncontradoException;
import com.reusehub.anuncio.exception.RegraNegocioException;
import com.reusehub.anuncio.model.Anuncio;
import com.reusehub.anuncio.model.Categoria;
import com.reusehub.anuncio.model.Endereco;
import com.reusehub.anuncio.model.ImagemAnuncio;

import com.reusehub.anuncio.service.AnuncioService;
import com.reusehub.anuncio.service.ViaCepService;
import com.reusehub.anuncio.service.StorageService;
import com.reusehub.anuncio.mapper.AnuncioRespostaMapper;

import com.reusehub.anuncio.repository.AnuncioRepository;
import com.reusehub.anuncio.repository.AnuncioFavoritoRepository;
import com.reusehub.anuncio.repository.CategoriaRepository;
import com.reusehub.anuncio.repository.EnderecoRepository;
import com.reusehub.anuncio.repository.ImagemAnuncioRepository;
import com.reusehub.auth.model.Perfil;
import com.reusehub.auth.model.Usuario;
import com.reusehub.auth.repository.UsuarioRepository;
import com.reusehub.anuncio.dto.ResultadoGeocoding;
import com.reusehub.anuncio.service.GeocodingHibridoService;
import com.reusehub.anuncio.service.LocalizacaoService;
import com.reusehub.moderacao.service.ModeracaoService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes Unitários de AnuncioService - Camada de Negócio")
class AnuncioServiceTest {

    private static final String EMAIL_DONO = "dono@reusehub.com";
    private static final String CEP_VALIDO = "01001-000";
    private static final int QUANTIDADE_MINIMA_IMAGENS = 3;
    private static final int QUANTIDADE_MAXIMA_IMAGENS = 5;
    private static final BigDecimal LATITUDE_SAO_PAULO = new BigDecimal("-23.55");
    private static final BigDecimal LONGITUDE_SAO_PAULO = new BigDecimal("-46.63");

    private static final ViaCepService.DadosCEP DADOS_CEP_PADRAO = new ViaCepService.DadosCEP(
            CEP_VALIDO, "Rua A", "Bairro B", "Cidade C", "SP"
    );
    private static final ResultadoGeocoding RESULTADO_GEOCODING_PADRAO =
            ResultadoGeocoding.geocodificado(LATITUDE_SAO_PAULO, LONGITUDE_SAO_PAULO);

    @Mock
    private AnuncioRepository anuncioRepository;
    @Mock
    private AnuncioFavoritoRepository anuncioFavoritoRepository;
    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private CategoriaRepository categoriaRepository;
    @Mock
    private EnderecoRepository enderecoRepository;
    @Mock
    private ViaCepService viaCepService;
    @Mock
    private StorageService storageService;
    @Mock
    private ImagemAnuncioRepository imagemAnuncioRepository;
    @Mock
    private LocalizacaoService localizacaoService;
    @Mock
    private GeocodingHibridoService geocodingHibridoService;
    @Mock
    private ModeracaoService moderacaoService;
    @Mock
    private AnuncioRespostaMapper anuncioRespostaMapper;

    @InjectMocks
    private AnuncioService anuncioService;

    private Usuario usuarioDono;
    private Usuario usuarioInvasor;
    private Usuario usuarioModerador;
    private Anuncio anuncioPendente;

    @BeforeEach
    void setUp() {
        UUID idDono = UUID.randomUUID();
        UUID idInvasor = UUID.randomUUID();
        UUID idModerador = UUID.randomUUID();

        usuarioDono = new Usuario();
        usuarioDono.setEmail(EMAIL_DONO);
        usuarioDono.setName("Dono");
  
        try { usuarioDono.setId(idDono); } catch (Exception e) {}

        usuarioInvasor = new Usuario();
        usuarioInvasor.setEmail("hacker@reusehub.com");
        usuarioInvasor.setName("Hacker");
        try { usuarioInvasor.setId(idInvasor); } catch (Exception e) { }

        usuarioModerador = new Usuario();
        usuarioModerador.setEmail("mod@reusehub.com");
        usuarioModerador.setName("Mod");
        usuarioModerador.setPerfil(Perfil.MODERADOR);
        try { usuarioModerador.setId(idModerador); } catch (Exception e) { }

        anuncioPendente = Anuncio.builder()
                .id(UUID.randomUUID())
                .usuario(usuarioDono)
                .titulo("Cadeira Gamer")
                .status(Anuncio.StatusAnuncio.PENDENTE)
                .endereco(Endereco.builder().id(UUID.randomUUID()).build())
                .categoria(Categoria.builder().id(1).nome("Móveis").build())
                .build();

        // O mapper foi extraido pra um @Component dedicado; aqui simulamos
        // o comportamento copiando os campos relevantes do anuncio mockado.
        Mockito.lenient().when(anuncioRespostaMapper.mapear(Mockito.any(Anuncio.class)))
                .thenAnswer(invocacao -> {
                    Anuncio entrada = invocacao.getArgument(0);
                    return AnuncioRespostaDTO.builder()
                            .id(entrada.getId())
                            .titulo(entrada.getTitulo())
                            .status(entrada.getStatus())
                            .categoriaId(entrada.getCategoria() != null ? entrada.getCategoria().getId() : null)
                            .build();
                });

        // Categoria padrao usada pelos testes de edicao que nao focam nesse fator.
        Mockito.lenient().when(categoriaRepository.findById(Mockito.anyInt()))
                .thenAnswer(invocacao -> {
                    Integer idCategoria = invocacao.getArgument(0);
                    return Optional.of(Categoria.builder().id(idCategoria).nome("Categoria " + idCategoria).build());
                });
    }

    private void prepararResolucaoEnderecoComSucesso() {
        Mockito.when(viaCepService.buscarDadosCEP(Mockito.anyString()))
                .thenReturn(DADOS_CEP_PADRAO);
        Mockito.when(geocodingHibridoService.obterCoordenadasPorEndereco(Mockito.anyString()))
                .thenReturn(RESULTADO_GEOCODING_PADRAO);
        Mockito.when(enderecoRepository.save(Mockito.any(Endereco.class)))
                .thenAnswer(i -> i.getArgument(0));
    }

    private AnuncioCriacaoComEnderecoDTO novoDtoCriacao(Integer categoriaId) {
        AnuncioCriacaoComEnderecoDTO dto = new AnuncioCriacaoComEnderecoDTO();
        dto.setCategoriaId(categoriaId);
        dto.setCep(CEP_VALIDO);
        return dto;
    }

    /**
     * Gera uma lista de imagens mockadas com a quantidade pedida.
     * Permite testar tanto cenarios validos quanto bordas da regra
     * de quantidade minima/maxima de imagens por anuncio.
     */
    private List<MultipartFile> criarListaDeImagens(int quantidade) {
        return IntStream.rangeClosed(1, quantidade)
                .<MultipartFile>mapToObj(indice -> new MockMultipartFile(
                        "imagens",
                        "foto" + indice + ".png",
                        "image/png",
                        ("bytes-" + indice).getBytes()
                ))
                .toList();
    }

    /**
     * Retorna uma lista com a quantidade minima de imagens validas exigida
     * pelo AnuncioService. Util para testes que precisam passar pela
     * validacao inicial sem que esse seja o foco do cenario testado.
     */
    private List<MultipartFile> imagensValidasParaCriacao() {
        return criarListaDeImagens(QUANTIDADE_MINIMA_IMAGENS);
    }

    @Nested
    @DisplayName("Cenários para criarAnuncioComEndereco")
    class CriarAnuncioCenarios {

        private static final Integer CATEGORIA_EXISTENTE_ID = 1;
        private static final Integer CATEGORIA_INEXISTENTE_ID = 99;
        private static final String EMAIL_INEXISTENTE = "erro@teste.com";

        @Test
        @DisplayName("deve criar anúncio com sucesso")
        void criarComSucesso() {
            AnuncioCriacaoComEnderecoDTO dto = novoDtoCriacao(CATEGORIA_EXISTENTE_ID);
            LocalDateTime antesDaCriacao = LocalDateTime.now().plusDays(29);

            Mockito.when(usuarioRepository.findByEmail(EMAIL_DONO))
                    .thenReturn(Optional.of(usuarioDono));
            prepararResolucaoEnderecoComSucesso();
            Mockito.when(categoriaRepository.findById(CATEGORIA_EXISTENTE_ID))
                    .thenReturn(Optional.of(Categoria.builder().id(CATEGORIA_EXISTENTE_ID).nome("Móveis").build()));
            Mockito.when(anuncioRepository.save(Mockito.any(Anuncio.class)))
                    .thenAnswer(i -> i.getArgument(0));

            AnuncioRespostaDTO resultado = anuncioService.criarAnuncioComEndereco(
                    EMAIL_DONO, dto, imagensValidasParaCriacao()
            );

            assertNotNull(resultado);
            assertEquals(Anuncio.StatusAnuncio.PENDENTE, resultado.getStatus());
            ArgumentCaptor<Anuncio> anuncioCaptor = ArgumentCaptor.forClass(Anuncio.class);
            Mockito.verify(anuncioRepository).save(anuncioCaptor.capture());
            LocalDateTime expiraEm = anuncioCaptor.getValue().getExpiraEm();
            assertNotNull(expiraEm);
            assertTrue(expiraEm.isAfter(antesDaCriacao));
            assertTrue(expiraEm.isBefore(LocalDateTime.now().plusDays(31)));
        }

        @Test
        @DisplayName("deve estourar RecursoNaoEncontradoException se o usuário não existir")
        void erroUsuarioInexistente() {
            Mockito.when(usuarioRepository.findByEmail(EMAIL_INEXISTENTE))
                    .thenReturn(Optional.empty());

            assertThrows(RecursoNaoEncontradoException.class, () ->
                    anuncioService.criarAnuncioComEndereco(
                            EMAIL_INEXISTENTE, new AnuncioCriacaoComEnderecoDTO(), imagensValidasParaCriacao()
                    )
            );
        }

        @Test
        @DisplayName("deve estourar RecursoNaoEncontradoException se a categoria não existir")
        void erroCategoriaInexistente() {
            AnuncioCriacaoComEnderecoDTO dto = novoDtoCriacao(CATEGORIA_INEXISTENTE_ID);

            Mockito.when(usuarioRepository.findByEmail(EMAIL_DONO))
                    .thenReturn(Optional.of(usuarioDono));
            prepararResolucaoEnderecoComSucesso();
            Mockito.when(categoriaRepository.findById(CATEGORIA_INEXISTENTE_ID))
                    .thenReturn(Optional.empty());

            assertThrows(RecursoNaoEncontradoException.class, () ->
                    anuncioService.criarAnuncioComEndereco(EMAIL_DONO, dto, imagensValidasParaCriacao())
            );
        }

        @Test
        @DisplayName("deve estourar OperacaoInvalidaException se a quantidade de imagens for menor que o minimo")
        void erroQuantidadeAbaixoDoMinimo() {
            AnuncioCriacaoComEnderecoDTO dto = novoDtoCriacao(CATEGORIA_EXISTENTE_ID);
            List<MultipartFile> abaixoDoMinimo = criarListaDeImagens(QUANTIDADE_MINIMA_IMAGENS - 1);

            assertThrows(OperacaoInvalidaException.class, () ->
                    anuncioService.criarAnuncioComEndereco(EMAIL_DONO, dto, abaixoDoMinimo)
            );
        }

        @Test
        @DisplayName("deve estourar OperacaoInvalidaException se a quantidade de imagens for maior que o maximo")
        void erroQuantidadeAcimaDoMaximo() {
            AnuncioCriacaoComEnderecoDTO dto = novoDtoCriacao(CATEGORIA_EXISTENTE_ID);
            List<MultipartFile> acimaDoMaximo = criarListaDeImagens(QUANTIDADE_MAXIMA_IMAGENS + 1);

            assertThrows(OperacaoInvalidaException.class, () ->
                    anuncioService.criarAnuncioComEndereco(EMAIL_DONO, dto, acimaDoMaximo)
            );
        }

        @Test
        @DisplayName("deve estourar OperacaoInvalidaException se a lista de imagens for nula")
        void erroListaDeImagensNula() {
            AnuncioCriacaoComEnderecoDTO dto = novoDtoCriacao(CATEGORIA_EXISTENTE_ID);

            assertThrows(OperacaoInvalidaException.class, () ->
                    anuncioService.criarAnuncioComEndereco(EMAIL_DONO, dto, null)
            );
        }
    }
    
    @Nested
    @DisplayName("Cenários para obterAnuncioPorId")
    class ObterAnuncioCenarios {

        @Test
        @DisplayName("deve obter anúncio ATIVO sem incrementar contador")
        void obterAtivoSemIncrementarContador() {
            anuncioPendente.setStatus(Anuncio.StatusAnuncio.ATIVO);
            UUID validId = anuncioPendente.getId();
            assertNotNull(validId);

            Mockito.when(anuncioRepository.findById(validId)).thenReturn(Optional.of(anuncioPendente));

            AnuncioRespostaDTO resultado = anuncioService.obterAnuncioPorId(validId, null);

            assertNotNull(resultado);
            assertEquals(0, anuncioPendente.getTotalVisualizacoes(),
                    "GET nao deve incrementar; tracking acontece via POST dedicado com dedupe");
        }

        @Test
        @DisplayName("deve permitir que o DONO veja seu próprio anúncio PENDENTE")
        void donoObtendoPendente() {
            UUID validId = anuncioPendente.getId();
            assertNotNull(validId);

            Mockito.when(anuncioRepository.findById(validId)).thenReturn(Optional.of(anuncioPendente));
            Mockito.when(usuarioRepository.findByEmail("dono@reusehub.com")).thenReturn(Optional.of(usuarioDono));

            AnuncioRespostaDTO resultado = anuncioService.obterAnuncioPorId(validId, "dono@reusehub.com");
            assertNotNull(resultado);
        }

        @Test
        @DisplayName("deve estourar OperacaoInvalidaException se outro usuário tentar ver anúncio PENDENTE")
        void invasorVerificandoPendente() {
            UUID validId = anuncioPendente.getId();
            assertNotNull(validId);

            Mockito.when(anuncioRepository.findById(validId)).thenReturn(Optional.of(anuncioPendente));
            Mockito.when(usuarioRepository.findByEmail("invasor@reusehub.com")).thenReturn(Optional.of(usuarioInvasor));

            assertThrows(OperacaoInvalidaException.class, () -> {
                anuncioService.obterAnuncioPorId(validId, "invasor@reusehub.com");
            });
        }
    }

    @Nested
    @DisplayName("Cenários para atualizarAnuncio")
    class AtualizarAnuncioCenarios {

        @Test
        @DisplayName("deve atualizar anúncio com sucesso se for o dono")
        void atualizarComSucesso() {
            UUID validId = anuncioPendente.getId();
            assertNotNull(validId);

            UUID randomEnderecoId = UUID.randomUUID();

            AnuncioAtualizacaoDTO dto = new AnuncioAtualizacaoDTO();
            dto.setEnderecoId(randomEnderecoId);
            dto.setTitulo("Título Novo");
            dto.setCategoriaId(1);

            Mockito.when(anuncioRepository.findById(validId)).thenReturn(Optional.of(anuncioPendente));
            Mockito.when(enderecoRepository.findByIdAndUsuarioId(Mockito.any(UUID.class), Mockito.any()))
                   .thenReturn(Optional.of(Endereco.builder().build()));
            Mockito.when(anuncioRepository.save(Mockito.any(Anuncio.class))).thenAnswer(i -> i.getArgument(0));

            AnuncioRespostaDTO resultado = anuncioService.atualizarAnuncio(validId, "dono@reusehub.com", dto);

            assertNotNull(resultado);
            assertEquals("Título Novo", anuncioPendente.getTitulo());
        }

        @Test
        @DisplayName("deve persistir a categoria nova quando o dono trocar a categoria do anuncio")
        void atualizarPersisteCategoriaNova() {
            UUID validId = anuncioPendente.getId();
            Integer idCategoriaOriginal = anuncioPendente.getCategoria().getId();
            Integer idCategoriaNova = idCategoriaOriginal + 5;

            AnuncioAtualizacaoDTO dto = new AnuncioAtualizacaoDTO();
            dto.setTitulo(anuncioPendente.getTitulo());
            dto.setEnderecoId(UUID.randomUUID());
            dto.setCategoriaId(idCategoriaNova);

            Mockito.when(anuncioRepository.findById(validId))
                    .thenReturn(Optional.of(anuncioPendente));
            Mockito.when(enderecoRepository.findByIdAndUsuarioId(Mockito.any(UUID.class), Mockito.any()))
                    .thenReturn(Optional.of(Endereco.builder().build()));
            Mockito.when(anuncioRepository.save(Mockito.any(Anuncio.class)))
                    .thenAnswer(i -> i.getArgument(0));

            AnuncioRespostaDTO resultado = anuncioService.atualizarAnuncio(validId, EMAIL_DONO, dto);

            assertEquals(idCategoriaNova, anuncioPendente.getCategoria().getId(),
                    "categoria do anuncio deveria refletir o id enviado no DTO");
            assertEquals(idCategoriaNova, resultado.getCategoriaId(),
                    "resposta da API deveria devolver a categoria atualizada");
        }

        @Test
        @DisplayName("deve estourar RecursoNaoEncontradoException se categoriaId nao existir")
        void erroAoAtualizarComCategoriaInexistente() {
            UUID validId = anuncioPendente.getId();
            Integer idCategoriaInexistente = 999;

            AnuncioAtualizacaoDTO dto = new AnuncioAtualizacaoDTO();
            dto.setTitulo("Título Novo");
            dto.setEnderecoId(UUID.randomUUID());
            dto.setCategoriaId(idCategoriaInexistente);

            Mockito.when(anuncioRepository.findById(validId))
                    .thenReturn(Optional.of(anuncioPendente));
            Mockito.when(enderecoRepository.findByIdAndUsuarioId(Mockito.any(UUID.class), Mockito.any()))
                    .thenReturn(Optional.of(Endereco.builder().build()));
            Mockito.when(categoriaRepository.findById(idCategoriaInexistente))
                    .thenReturn(Optional.empty());

            assertThrows(RecursoNaoEncontradoException.class,
                    () -> anuncioService.atualizarAnuncio(validId, EMAIL_DONO, dto));
        }

        @Test
        @DisplayName("deve forcar status para PENDENTE quando anúncio ATIVO for editado (regra de reanalise)")
        void devolverAnuncioParaReanaliseAposEdicao() {
            UUID validId = anuncioPendente.getId();
            anuncioPendente.setStatus(Anuncio.StatusAnuncio.ATIVO);

            AnuncioAtualizacaoDTO dto = new AnuncioAtualizacaoDTO();
            dto.setEnderecoId(UUID.randomUUID());
            dto.setTitulo("Título Editado");
            dto.setCategoriaId(1);

            Mockito.when(anuncioRepository.findById(validId))
                    .thenReturn(Optional.of(anuncioPendente));
            Mockito.when(enderecoRepository.findByIdAndUsuarioId(Mockito.any(UUID.class), Mockito.any()))
                    .thenReturn(Optional.of(Endereco.builder().build()));
            Mockito.when(anuncioRepository.save(Mockito.any(Anuncio.class)))
                    .thenAnswer(i -> i.getArgument(0));

            AnuncioRespostaDTO resultado = anuncioService.atualizarAnuncio(validId, EMAIL_DONO, dto);

            assertEquals(Anuncio.StatusAnuncio.PENDENTE, resultado.getStatus());
            assertEquals(Anuncio.StatusAnuncio.PENDENTE, anuncioPendente.getStatus());
        }

        @Test
        @DisplayName("deve estourar AcessoNegadoException se tentar editar anúncio alheio")
        void erroEditarAlheio() {
            UUID validId = anuncioPendente.getId();
            assertNotNull(validId);

            Mockito.when(anuncioRepository.findById(validId)).thenReturn(Optional.of(anuncioPendente));

            assertThrows(AcessoNegadoException.class, () -> {
                anuncioService.atualizarAnuncio(validId, "hacker@reusehub.com", new AnuncioAtualizacaoDTO());
            });
        }

        @Test
        @DisplayName("deve estourar RecursoNaoEncontradoException se o endereço informado não for do usuário")
        void erroEnderecoNaoPertenceAoUsuario() {
            UUID validId = anuncioPendente.getId();
            assertNotNull(validId);

            UUID randomEnderecoId = UUID.randomUUID();

            AnuncioAtualizacaoDTO dto = new AnuncioAtualizacaoDTO();
            dto.setEnderecoId(randomEnderecoId);

            Mockito.when(anuncioRepository.findById(validId)).thenReturn(Optional.of(anuncioPendente));
            Mockito.when(enderecoRepository.findByIdAndUsuarioId(Mockito.any(UUID.class), Mockito.any())).thenReturn(Optional.empty());

            assertThrows(RecursoNaoEncontradoException.class, () -> {
                anuncioService.atualizarAnuncio(validId, "dono@reusehub.com", dto);
            });
        }
    }

    @Nested
    @DisplayName("Cenários para atualizarImagensDoAnuncio")
    class AtualizarImagensCenarios {

        @Test
        @DisplayName("deve manter ids selecionados, adicionar novas imagens e voltar status para PENDENTE")
        void atualizarImagensComSucesso() {
            UUID anuncioId = anuncioPendente.getId();
            anuncioPendente.setStatus(Anuncio.StatusAnuncio.ATIVO);

            List<ImagemAnuncio> imagensAtuais = criarImagensAtuais(3);
            UUID idDaSegundaImagem = imagensAtuais.get(1).getId();
            UUID idDaTerceiraImagem = imagensAtuais.get(2).getId();

            AnuncioImagensAtualizacaoDTO dto = new AnuncioImagensAtualizacaoDTO(
                    List.of(idDaTerceiraImagem, idDaSegundaImagem)
            );
            List<MultipartFile> novasImagens = criarListaDeImagens(2);

            prepararMocksDeEdicaoDeImagens(anuncioId, imagensAtuais, novasImagens.size());

            AnuncioRespostaDTO resultado = anuncioService.atualizarImagensDoAnuncio(
                    anuncioId, EMAIL_DONO, dto, novasImagens
            );

            assertNotNull(resultado);
            assertEquals(Anuncio.StatusAnuncio.PENDENTE, anuncioPendente.getStatus());
            Mockito.verify(storageService).excluirImagem(imagensAtuais.get(0).getUrlImagem());
            Mockito.verify(imagemAnuncioRepository).delete(imagensAtuais.get(0));
            Mockito.verify(storageService).salvarImagens(novasImagens);
        }

        @Test
        @DisplayName("deve estourar OperacaoInvalidaException quando o total apos edicao for menor que o minimo")
        void erroQuandoTotalFinalAbaixoDoMinimo() {
            UUID anuncioId = anuncioPendente.getId();
            List<ImagemAnuncio> imagensAtuais = criarImagensAtuais(3);

            Mockito.when(anuncioRepository.findById(anuncioId)).thenReturn(Optional.of(anuncioPendente));

            AnuncioImagensAtualizacaoDTO dto = new AnuncioImagensAtualizacaoDTO(
                    List.of(imagensAtuais.get(0).getId(), imagensAtuais.get(1).getId())
            );

            assertThrows(OperacaoInvalidaException.class,
                    () -> anuncioService.atualizarImagensDoAnuncio(anuncioId, EMAIL_DONO, dto, List.of()));
            Mockito.verify(storageService, Mockito.never()).salvarImagens(Mockito.any());
        }

        @Test
        @DisplayName("deve estourar OperacaoInvalidaException quando o total apos edicao for maior que o maximo")
        void erroQuandoTotalFinalAcimaDoMaximo() {
            UUID anuncioId = anuncioPendente.getId();
            List<ImagemAnuncio> imagensAtuais = criarImagensAtuais(3);

            Mockito.when(anuncioRepository.findById(anuncioId)).thenReturn(Optional.of(anuncioPendente));

            List<UUID> idsParaManter = imagensAtuais.stream().map(ImagemAnuncio::getId).toList();
            AnuncioImagensAtualizacaoDTO dto = new AnuncioImagensAtualizacaoDTO(idsParaManter);
            List<MultipartFile> tresNovas = criarListaDeImagens(3);

            assertThrows(OperacaoInvalidaException.class,
                    () -> anuncioService.atualizarImagensDoAnuncio(anuncioId, EMAIL_DONO, dto, tresNovas));
            Mockito.verify(storageService, Mockito.never()).salvarImagens(Mockito.any());
        }

        @Test
        @DisplayName("deve estourar RecursoNaoEncontradoException quando um id nao pertencer ao anuncio")
        void erroQuandoIdNaoPertenceAoAnuncio() {
            UUID anuncioId = anuncioPendente.getId();
            List<ImagemAnuncio> imagensAtuais = criarImagensAtuais(3);

            Mockito.when(anuncioRepository.findById(anuncioId)).thenReturn(Optional.of(anuncioPendente));
            Mockito.when(imagemAnuncioRepository.findByAnuncioId(anuncioId)).thenReturn(imagensAtuais);

            UUID idIntruso = UUID.randomUUID();
            AnuncioImagensAtualizacaoDTO dto = new AnuncioImagensAtualizacaoDTO(
                    List.of(imagensAtuais.get(0).getId(), imagensAtuais.get(1).getId(), idIntruso)
            );

            assertThrows(RecursoNaoEncontradoException.class,
                    () -> anuncioService.atualizarImagensDoAnuncio(anuncioId, EMAIL_DONO, dto, List.of()));
            Mockito.verify(imagemAnuncioRepository, Mockito.never()).delete(Mockito.any());
        }

        @Test
        @DisplayName("deve estourar AcessoNegadoException quando usuario nao for o dono do anuncio")
        void erroQuandoUsuarioNaoForDono() {
            UUID anuncioId = anuncioPendente.getId();

            Mockito.when(anuncioRepository.findById(anuncioId)).thenReturn(Optional.of(anuncioPendente));

            AnuncioImagensAtualizacaoDTO dto = new AnuncioImagensAtualizacaoDTO(List.of());

            assertThrows(AcessoNegadoException.class,
                    () -> anuncioService.atualizarImagensDoAnuncio(
                            anuncioId, "hacker@reusehub.com", dto, criarListaDeImagens(3)
                    ));
        }

        private List<ImagemAnuncio> criarImagensAtuais(int quantidade) {
            List<ImagemAnuncio> imagens = new ArrayList<>();
            for (int i = 0; i < quantidade; i++) {
                imagens.add(ImagemAnuncio.builder()
                        .id(UUID.randomUUID())
                        .anuncio(anuncioPendente)
                        .urlImagem("https://reusehub-uploads.s3.us-east-2.amazonaws.com/foto-" + i + ".png")
                        .ordemExibicao((short) i)
                        .capa(i == 0)
                        .build());
            }
            return imagens;
        }

        private void prepararMocksDeEdicaoDeImagens(
                UUID anuncioId,
                List<ImagemAnuncio> imagensAtuais,
                int quantidadeNovas
        ) {
            Mockito.when(anuncioRepository.findById(anuncioId)).thenReturn(Optional.of(anuncioPendente));
            Mockito.when(imagemAnuncioRepository.findByAnuncioId(anuncioId)).thenReturn(imagensAtuais);
            Mockito.when(anuncioRepository.save(Mockito.any(Anuncio.class))).thenAnswer(i -> i.getArgument(0));

            List<String> urlsNovas = IntStream.rangeClosed(1, quantidadeNovas)
                    .mapToObj(i -> "https://reusehub-uploads.s3.us-east-2.amazonaws.com/nova-" + i + ".png")
                    .toList();
            Mockito.when(storageService.salvarImagens(Mockito.anyList())).thenReturn(urlsNovas);
        }
    }

    @Nested
    @DisplayName("Cenários para alterarStatus (Usuário)")
    class AlterarStatusCenarios {

        @Test
        @DisplayName("deve alterar status para RESERVADO com sucesso pelo dono")
        void alterarStatusSucesso() {
            UUID validId = anuncioPendente.getId();
            assertNotNull(validId);

            Mockito.when(anuncioRepository.findById(validId)).thenReturn(Optional.of(anuncioPendente));
            Mockito.when(anuncioRepository.save(Mockito.any(Anuncio.class))).thenAnswer(i -> i.getArgument(0));

            AnuncioRespostaDTO resultado = anuncioService.alterarStatus(validId, "dono@reusehub.com", Anuncio.StatusAnuncio.RESERVADO);
            
            assertNotNull(resultado);
            assertEquals(Anuncio.StatusAnuncio.RESERVADO, anuncioPendente.getStatus());
        }

        @Test
        @DisplayName("deve estourar AcessoNegadoException se invasor tentar alterar status")
        void erroInvasorAlterarStatus() {
            UUID validId = anuncioPendente.getId();
            assertNotNull(validId);

            Mockito.when(anuncioRepository.findById(validId)).thenReturn(Optional.of(anuncioPendente));

            assertThrows(AcessoNegadoException.class, () -> {
                anuncioService.alterarStatus(validId, "hacker@reusehub.com", Anuncio.StatusAnuncio.CONCLUIDO);
            });
        }

        @Test
        @DisplayName("deve estourar RegraNegocioException se usuário tentar forçar status de moderação")
        void erroForçarStatusModeracao() {
            UUID validId = anuncioPendente.getId();
            assertNotNull(validId);

            Mockito.when(anuncioRepository.findById(validId)).thenReturn(Optional.of(anuncioPendente));

            assertThrows(RegraNegocioException.class, () -> {
                anuncioService.alterarStatus(validId, "dono@reusehub.com", Anuncio.StatusAnuncio.ATIVO);
            });
        }
    }

    @Nested
    @DisplayName("Cenários para aprovarAnuncio")
    class AprovarAnuncioCenarios {

        @Test
        @DisplayName("deve aprovar anúncio com sucesso")
        void aprovarComSucesso() {
            UUID validId = anuncioPendente.getId();
            assertNotNull(validId);

            Mockito.when(usuarioRepository.findByEmail("moderador@reusehub.com")).thenReturn(Optional.of(usuarioModerador));
            Mockito.when(anuncioRepository.findById(validId)).thenReturn(Optional.of(anuncioPendente));
            Mockito.when(anuncioRepository.save(Mockito.any(Anuncio.class))).thenAnswer(i -> i.getArgument(0));

            AnuncioRespostaDTO resultado = anuncioService.aprovarAnuncio(validId, "moderador@reusehub.com");

            assertNotNull(resultado);
            assertEquals(Anuncio.StatusAnuncio.ATIVO, resultado.getStatus());
        }

        @Test
        @DisplayName("deve estourar AcessoNegadoException se não for Moderador/Admin")
        void erroAprovarSemPermissao() {
            UUID validId = anuncioPendente.getId();
            assertNotNull(validId);

            Mockito.when(usuarioRepository.findByEmail("dono@reusehub.com")).thenReturn(Optional.of(usuarioDono));

            assertThrows(AcessoNegadoException.class, () -> {
                anuncioService.aprovarAnuncio(validId, "dono@reusehub.com");
            });
        }

        @Test
        @DisplayName("deve estourar RegraNegocioException se o anúncio não estiver PENDENTE")
        void erroAprovarNaoPendente() {
            UUID validId = anuncioPendente.getId();
            assertNotNull(validId);

            anuncioPendente.setStatus(Anuncio.StatusAnuncio.ATIVO);
            Mockito.when(usuarioRepository.findByEmail("moderador@reusehub.com")).thenReturn(Optional.of(usuarioModerador));
            Mockito.when(anuncioRepository.findById(validId)).thenReturn(Optional.of(anuncioPendente));

            assertThrows(RegraNegocioException.class, () -> {
                anuncioService.aprovarAnuncio(validId, "moderador@reusehub.com");
            });
        }
    }

    @Nested
    @DisplayName("Cenários para reprovarAnuncio")
    class ReprovarAnuncioCenarios {

        @Test
        @DisplayName("deve reprovar anúncio com sucesso")
        void reprovarComSucesso() {
            UUID validId = anuncioPendente.getId();
            assertNotNull(validId);

            Mockito.when(usuarioRepository.findByEmail("moderador@reusehub.com")).thenReturn(Optional.of(usuarioModerador));
            Mockito.when(anuncioRepository.findById(validId)).thenReturn(Optional.of(anuncioPendente));
            Mockito.when(anuncioRepository.save(Mockito.any(Anuncio.class))).thenAnswer(i -> i.getArgument(0));

            AnuncioRespostaDTO resultado = anuncioService.reprovarAnuncio(validId, "moderador@reusehub.com");

            assertNotNull(resultado);
            assertEquals(Anuncio.StatusAnuncio.REPROVADO, resultado.getStatus());
        }

        @Test
        @DisplayName("deve estourar AcessoNegadoException se usuário sem permissão tentar reprovar")
        void erroReprovarSemPermissao() {
            UUID validId = anuncioPendente.getId();
            assertNotNull(validId);

            Mockito.when(usuarioRepository.findByEmail("dono@reusehub.com")).thenReturn(Optional.of(usuarioDono));

            assertThrows(AcessoNegadoException.class, () -> {
                anuncioService.reprovarAnuncio(validId, "dono@reusehub.com");
            });
        }

        @Test
        @DisplayName("deve estourar RegraNegocioException se o anúncio já foi processado")
        void erroReprovarJaAtivo() {
            UUID validId = anuncioPendente.getId();
            assertNotNull(validId);

            anuncioPendente.setStatus(Anuncio.StatusAnuncio.REPROVADO);
            Mockito.when(usuarioRepository.findByEmail("moderador@reusehub.com")).thenReturn(Optional.of(usuarioModerador));
            Mockito.when(anuncioRepository.findById(validId)).thenReturn(Optional.of(anuncioPendente));

            assertThrows(RegraNegocioException.class, () -> {
                anuncioService.reprovarAnuncio(validId, "moderador@reusehub.com");
            });
        }
    }

    @Nested
    @DisplayName("Cenarios para favoritos")
    class FavoritosCenarios {

        @Test
        @DisplayName("deve listar ids de favoritos do usuario")
        void listarIdsFavoritos() {
            Mockito.when(usuarioRepository.findByEmail("dono@reusehub.com")).thenReturn(Optional.of(usuarioDono));
            Mockito.when(anuncioFavoritoRepository.findAnuncioIdsByUsuarioId(usuarioDono.getId()))
                    .thenReturn(java.util.List.of(UUID.randomUUID()));

            var resultado = anuncioService.listarIdsFavoritosDoUsuario("dono@reusehub.com");

            assertEquals(1, resultado.size());
        }

        @Test
        @DisplayName("deve favoritar anuncio ativo de outro usuario")
        void favoritarAnuncio() {
            UUID anuncioId = UUID.randomUUID();
            Anuncio anuncioAtivo = Anuncio.builder()
                    .id(anuncioId)
                    .usuario(usuarioInvasor)
                    .status(Anuncio.StatusAnuncio.ATIVO)
                    .endereco(Endereco.builder().id(UUID.randomUUID()).build())
                    .categoria(Categoria.builder().id(1).nome("Games").build())
                    .build();

            Mockito.when(usuarioRepository.findByEmail("dono@reusehub.com")).thenReturn(Optional.of(usuarioDono));
            Mockito.when(anuncioRepository.findById(anuncioId)).thenReturn(Optional.of(anuncioAtivo));
            Mockito.when(anuncioFavoritoRepository.existsByUsuarioIdAndAnuncioId(usuarioDono.getId(), anuncioId))
                    .thenReturn(false);

            assertDoesNotThrow(() -> anuncioService.favoritarAnuncio(anuncioId, "dono@reusehub.com"));
            Mockito.verify(anuncioFavoritoRepository).save(Mockito.any());
        }

        @Test
        @DisplayName("deve impedir favoritar o proprio anuncio")
        void impedirFavoritarProprioAnuncio() {
            UUID anuncioId = UUID.randomUUID();
            Anuncio anuncioAtivo = Anuncio.builder()
                    .id(anuncioId)
                    .usuario(usuarioDono)
                    .status(Anuncio.StatusAnuncio.ATIVO)
                    .build();

            Mockito.when(usuarioRepository.findByEmail("dono@reusehub.com")).thenReturn(Optional.of(usuarioDono));
            Mockito.when(anuncioRepository.findById(anuncioId)).thenReturn(Optional.of(anuncioAtivo));

            assertThrows(RegraNegocioException.class, () ->
                    anuncioService.favoritarAnuncio(anuncioId, "dono@reusehub.com"));
        }

        @Test
        @DisplayName("deve desfavoritar anuncio do usuario")
        void desfavoritarAnuncio() {
            UUID anuncioId = UUID.randomUUID();
            Mockito.when(usuarioRepository.findByEmail("dono@reusehub.com")).thenReturn(Optional.of(usuarioDono));

            anuncioService.desfavoritarAnuncio(anuncioId, "dono@reusehub.com");

            Mockito.verify(anuncioFavoritoRepository)
                    .deleteByUsuarioIdAndAnuncioId(usuarioDono.getId(), anuncioId);
        }
    }
}
