package com.reusehub.backend.anuncio.destaque.service;

import com.reusehub.anuncio.destaque.dto.AnuncioDestaqueDTO;
import com.reusehub.anuncio.destaque.dto.BootstrapHomeDTO;
import com.reusehub.anuncio.destaque.dto.CategoriaEmDestaqueDTO;
import com.reusehub.anuncio.destaque.enums.CenarioHome;
import com.reusehub.anuncio.destaque.enums.ContextoDestaque;
import com.reusehub.anuncio.destaque.enums.TipoSelecaoCategoria;
import com.reusehub.anuncio.destaque.service.AnuncioDestaqueService;
import com.reusehub.anuncio.destaque.service.BootstrapHomeService;
import com.reusehub.anuncio.destaque.service.CategoriaEmDestaqueService;
import com.reusehub.anuncio.dto.AnuncioRespostaDTO;
import com.reusehub.anuncio.repository.AnuncioFavoritoRepository;
import com.reusehub.auth.model.Usuario;
import com.reusehub.auth.repository.UsuarioRepository;
import com.reusehub.interesse.repository.InteresseTrocaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes Unitarios de BootstrapHomeService")
class BootstrapHomeServiceTest {

    private static final String EMAIL_USUARIO = "user@reusehub.com";
    private static final UUID ID_USUARIO = UUID.randomUUID();

    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private AnuncioFavoritoRepository anuncioFavoritoRepository;
    @Mock
    private InteresseTrocaRepository interesseTrocaRepository;
    @Mock
    private CategoriaEmDestaqueService categoriaEmDestaqueService;
    @Mock
    private AnuncioDestaqueService anuncioDestaqueService;

    @InjectMocks
    private BootstrapHomeService bootstrapHomeService;

    private Usuario usuario;
    private CategoriaEmDestaqueDTO categoriaRotativa;

    @BeforeEach
    void prepararCenario() {
        usuario = new Usuario();
        usuario.setId(ID_USUARIO);
        usuario.setEmail(EMAIL_USUARIO);

        categoriaRotativa = new CategoriaEmDestaqueDTO(21, "Moveis", "moveis", TipoSelecaoCategoria.ROTATIVA);

        Mockito.lenient().when(categoriaEmDestaqueService.obterRotativaDoDia(any(LocalDate.class)))
                .thenReturn(Optional.of(categoriaRotativa));
    }

    private AnuncioDestaqueDTO anuncioDeExemplo() {
        AnuncioRespostaDTO anuncio = AnuncioRespostaDTO.builder()
                .id(UUID.randomUUID())
                .titulo("Anuncio teste")
                .build();
        return AnuncioDestaqueDTO.de(anuncio, BigDecimal.valueOf(0.5));
    }

    @Nested
    @DisplayName("Cenario ANONIMO")
    class AnonimoCenarios {

        @Test
        @DisplayName("usuario nao autenticado recebe cenario ANONIMO com 3 secoes (rotativa, populares, recentes)")
        void anonimoCom3Secoes() {
            Mockito.when(anuncioDestaqueService.obterDestaques(any(), any(), anyInt(), any()))
                    .thenReturn(List.of(anuncioDeExemplo()));

            BootstrapHomeDTO receita = bootstrapHomeService.montarReceita(null);

            assertEquals(CenarioHome.ANONIMO, receita.cenario());
            assertEquals(3, receita.secoes().size());
            assertEquals(ContextoDestaque.MAIS_PROCURADOS, receita.secoes().get(0).contexto());
            assertEquals(ContextoDestaque.POPULARES, receita.secoes().get(1).contexto());
            assertEquals(ContextoDestaque.RECENTES, receita.secoes().get(2).contexto());
        }

        @Test
        @DisplayName("usuario anonimo nao recebe RECOMENDADOS_PARA_VOCE")
        void anonimoNaoTemRecomendados() {
            Mockito.when(anuncioDestaqueService.obterDestaques(any(), any(), anyInt(), any()))
                    .thenReturn(List.of(anuncioDeExemplo()));

            BootstrapHomeDTO receita = bootstrapHomeService.montarReceita(null);

            boolean temRecomendados = receita.secoes().stream()
                    .anyMatch(s -> s.contexto() == ContextoDestaque.RECOMENDADOS_PARA_VOCE);
            assertTrue(!temRecomendados);
        }
    }

    @Nested
    @DisplayName("Cenario SEM_HISTORICO")
    class SemHistoricoCenarios {

        @Test
        @DisplayName("usuario logado com poucos favoritos cai em SEM_HISTORICO (mesma estrutura do anonimo)")
        void semHistoricoIgualAoAnonimo() {
            Mockito.when(usuarioRepository.findByEmail(EMAIL_USUARIO)).thenReturn(Optional.of(usuario));
            Mockito.when(anuncioFavoritoRepository.countByUsuarioId(ID_USUARIO)).thenReturn(1L);
            Mockito.when(interesseTrocaRepository.countByInteressadoId(ID_USUARIO)).thenReturn(0L);
            Mockito.when(anuncioDestaqueService.obterDestaques(any(), any(), anyInt(), any()))
                    .thenReturn(List.of(anuncioDeExemplo()));

            BootstrapHomeDTO receita = bootstrapHomeService.montarReceita(EMAIL_USUARIO);

            assertEquals(CenarioHome.SEM_HISTORICO, receita.cenario());
            assertEquals(3, receita.secoes().size());
        }
    }

    @Nested
    @DisplayName("Cenario HISTORICO_USUARIO")
    class HistoricoUsuarioCenarios {

        @Test
        @DisplayName("usuario com 3+ favoritos+interesses recebe RECOMENDADOS_PARA_VOCE + MAIS_PROCURADOS na categoria de interesse")
        void historicoComCategoriaDeInteresse() {
            CategoriaEmDestaqueDTO categoriaInteresse =
                    new CategoriaEmDestaqueDTO(5, "Casa", "casa", TipoSelecaoCategoria.INTERESSE_USUARIO);

            Mockito.when(usuarioRepository.findByEmail(EMAIL_USUARIO)).thenReturn(Optional.of(usuario));
            Mockito.when(anuncioFavoritoRepository.countByUsuarioId(ID_USUARIO)).thenReturn(3L);
            Mockito.when(interesseTrocaRepository.countByInteressadoId(ID_USUARIO)).thenReturn(1L);
            Mockito.when(categoriaEmDestaqueService.obterParaUsuarioComHistorico(ID_USUARIO))
                    .thenReturn(Optional.of(categoriaInteresse));
            Mockito.when(anuncioDestaqueService.obterDestaques(any(), any(), anyInt(), any()))
                    .thenReturn(List.of(anuncioDeExemplo()));

            BootstrapHomeDTO receita = bootstrapHomeService.montarReceita(EMAIL_USUARIO);

            assertEquals(CenarioHome.HISTORICO_USUARIO, receita.cenario());
            assertEquals(TipoSelecaoCategoria.INTERESSE_USUARIO,
                    receita.categoriaEmDestaque().tipoSelecao());
            assertEquals(2, receita.secoes().size());
            assertEquals(ContextoDestaque.RECOMENDADOS_PARA_VOCE, receita.secoes().get(0).contexto());
            assertEquals(ContextoDestaque.MAIS_PROCURADOS, receita.secoes().get(1).contexto());
        }

        @Test
        @DisplayName("se categoria de interesse nao for elegivel, faz fallback para rotativa")
        void fallbackParaRotativa() {
            Mockito.when(usuarioRepository.findByEmail(EMAIL_USUARIO)).thenReturn(Optional.of(usuario));
            Mockito.when(anuncioFavoritoRepository.countByUsuarioId(ID_USUARIO)).thenReturn(5L);
            Mockito.when(interesseTrocaRepository.countByInteressadoId(ID_USUARIO)).thenReturn(0L);
            Mockito.when(categoriaEmDestaqueService.obterParaUsuarioComHistorico(ID_USUARIO))
                    .thenReturn(Optional.empty());
            Mockito.when(anuncioDestaqueService.obterDestaques(any(), any(), anyInt(), any()))
                    .thenReturn(List.of(anuncioDeExemplo()));

            BootstrapHomeDTO receita = bootstrapHomeService.montarReceita(EMAIL_USUARIO);

            assertEquals(TipoSelecaoCategoria.ROTATIVA, receita.categoriaEmDestaque().tipoSelecao());
        }
    }

    @Nested
    @DisplayName("Omissao de secoes vazias")
    class OmissaoSecoesVazias {

        @Test
        @DisplayName("secao com lista vazia e omitida da receita")
        void secaoVaziaOmitida() {
            Mockito.when(anuncioDestaqueService.obterDestaques(eq(ContextoDestaque.MAIS_PROCURADOS), any(), anyInt(), any()))
                    .thenReturn(List.of(anuncioDeExemplo()));
            Mockito.when(anuncioDestaqueService.obterDestaques(eq(ContextoDestaque.POPULARES), any(), anyInt(), any()))
                    .thenReturn(List.of());
            Mockito.when(anuncioDestaqueService.obterDestaques(eq(ContextoDestaque.RECENTES), any(), anyInt(), any()))
                    .thenReturn(List.of(anuncioDeExemplo()));

            BootstrapHomeDTO receita = bootstrapHomeService.montarReceita(null);

            assertEquals(2, receita.secoes().size(),
                    "secao POPULARES vazia deveria ter sido omitida");
            assertEquals(ContextoDestaque.MAIS_PROCURADOS, receita.secoes().get(0).contexto());
            assertEquals(ContextoDestaque.RECENTES, receita.secoes().get(1).contexto());
        }

        @Test
        @DisplayName("base sem categorias elegiveis omite MAIS_PROCURADOS e devolve so POPULARES/RECENTES")
        void semCategoriaElegivelOmiteSecao() {
            Mockito.when(categoriaEmDestaqueService.obterRotativaDoDia(any(LocalDate.class)))
                    .thenReturn(Optional.empty());
            Mockito.when(anuncioDestaqueService.obterDestaques(eq(ContextoDestaque.POPULARES), any(), anyInt(), any()))
                    .thenReturn(List.of(anuncioDeExemplo()));
            Mockito.when(anuncioDestaqueService.obterDestaques(eq(ContextoDestaque.RECENTES), any(), anyInt(), any()))
                    .thenReturn(List.of(anuncioDeExemplo()));

            BootstrapHomeDTO receita = bootstrapHomeService.montarReceita(null);

            assertNull(receita.categoriaEmDestaque());
            assertEquals(2, receita.secoes().size());
        }
    }

    @Nested
    @DisplayName("Metadados (geradoEm, dataRotacao)")
    class MetadadosCenarios {

        @Test
        @DisplayName("inclui geradoEm e dataRotacao na resposta")
        void incluiMetadados() {
            Mockito.when(anuncioDestaqueService.obterDestaques(any(), any(), anyInt(), any()))
                    .thenReturn(List.of(anuncioDeExemplo()));

            BootstrapHomeDTO receita = bootstrapHomeService.montarReceita(null);

            assertNotNull(receita.geradoEm());
            assertNotNull(receita.dataRotacao());
            assertEquals(LocalDate.now(), receita.dataRotacao());
        }
    }
}
