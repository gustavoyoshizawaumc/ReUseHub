package com.reusehub.backend.anuncio.service;

import com.reusehub.anuncio.dto.AnuncioAtualizacaoDTO;
import com.reusehub.anuncio.dto.AnuncioCriacaoComEnderecoDTO;
import com.reusehub.anuncio.dto.AnuncioRespostaDTO;
import com.reusehub.anuncio.exception.AcessoNegadoException;
import com.reusehub.anuncio.exception.OperacaoInvalidaException;
import com.reusehub.anuncio.exception.RecursoNaoEncontradoException;
import com.reusehub.anuncio.exception.RegraNegocioException;
import com.reusehub.anuncio.model.Anuncio;
import com.reusehub.anuncio.model.Categoria;
import com.reusehub.anuncio.model.Endereco;

import com.reusehub.anuncio.service.AnuncioService;
import com.reusehub.anuncio.service.ViaCepService;
import com.reusehub.anuncio.service.StorageService;

import com.reusehub.anuncio.repository.AnuncioRepository;
import com.reusehub.anuncio.repository.AnuncioFavoritoRepository;
import com.reusehub.anuncio.repository.CategoriaRepository;
import com.reusehub.anuncio.repository.EnderecoRepository;
import com.reusehub.anuncio.repository.ImagemAnuncioRepository;
import com.reusehub.auth.model.Perfil;
import com.reusehub.auth.model.Usuario;
import com.reusehub.auth.repository.UsuarioRepository;
import com.reusehub.anuncio.service.LocalizacaoService;
import com.reusehub.anuncio.service.NominatimService;
import com.reusehub.moderacao.service.ModeracaoService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

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
    private static final double LATITUDE_SAO_PAULO = -23.55;
    private static final double LONGITUDE_SAO_PAULO = -46.63;

    private static final ViaCepService.DadosCEP DADOS_CEP_PADRAO = new ViaCepService.DadosCEP(
            CEP_VALIDO, "Rua A", "Bairro B", "Cidade C", "SP"
    );
    private static final NominatimService.Coordenadas COORDENADAS_PADRAO =
            new NominatimService.Coordenadas(LATITUDE_SAO_PAULO, LONGITUDE_SAO_PAULO);

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
    private NominatimService nominatimService;
    @Mock
    private ModeracaoService moderacaoService;

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
    }

    private void prepararResolucaoEnderecoComSucesso() {
        Mockito.when(viaCepService.buscarDadosCEP(Mockito.anyString()))
                .thenReturn(DADOS_CEP_PADRAO);
        Mockito.when(nominatimService.buscarCoordenadasPorEndereco(Mockito.anyString()))
                .thenReturn(COORDENADAS_PADRAO);
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
        @DisplayName("deve obter anúncio ATIVO publicamente com sucesso")
        void obterAtivoComSucesso() {
            anuncioPendente.setStatus(Anuncio.StatusAnuncio.ATIVO);
            UUID validId = anuncioPendente.getId();
            assertNotNull(validId);
            
            Mockito.when(anuncioRepository.findById(validId)).thenReturn(Optional.of(anuncioPendente));

            AnuncioRespostaDTO resultado = anuncioService.obterAnuncioPorId(validId, null);

            assertNotNull(resultado);
            assertEquals(1, anuncioPendente.getTotalVisualizacoes());
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

            Mockito.when(anuncioRepository.findById(validId)).thenReturn(Optional.of(anuncioPendente));
            Mockito.when(enderecoRepository.findByIdAndUsuarioId(Mockito.any(UUID.class), Mockito.any()))
                   .thenReturn(Optional.of(Endereco.builder().build()));
            Mockito.when(anuncioRepository.save(Mockito.any(Anuncio.class))).thenAnswer(i -> i.getArgument(0));

            AnuncioRespostaDTO resultado = anuncioService.atualizarAnuncio(validId, "dono@reusehub.com", dto);
            
            assertNotNull(resultado);
            assertEquals("Título Novo", anuncioPendente.getTitulo());
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
