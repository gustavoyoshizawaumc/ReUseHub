package com.reusehub.backend.anuncio.destaque.service;

import com.reusehub.anuncio.destaque.service.RotacaoDeCategoriaService;
import com.reusehub.anuncio.model.Categoria;
import com.reusehub.anuncio.repository.AnuncioRepository;
import com.reusehub.anuncio.repository.CategoriaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes Unitarios de RotacaoDeCategoriaService")
class RotacaoDeCategoriaServiceTest {

    @Mock
    private AnuncioRepository anuncioRepository;
    @Mock
    private CategoriaRepository categoriaRepository;

    @InjectMocks
    private RotacaoDeCategoriaService rotacaoDeCategoriaService;

    private Categoria categoria(int id, String nome) {
        return Categoria.builder().id(id).nome(nome).slug(nome.toLowerCase()).build();
    }

    @BeforeEach
    void prepararCategoriasNoBanco() {
        Mockito.lenient().when(categoriaRepository.findById(Mockito.anyInt()))
                .thenAnswer(invocacao -> Optional.of(categoria(invocacao.getArgument(0), "cat-" + invocacao.getArgument(0))));
    }

    @Nested
    @DisplayName("Rotacao deterministica por dia")
    class RotacaoCenarios {

        @Test
        @DisplayName("dado o mesmo dia e o mesmo pool, sempre retorna a mesma categoria")
        void deterministica() {
            Mockito.when(anuncioRepository.listarCategoriasMaisPopulares(eq(6L), any(Pageable.class)))
                    .thenReturn(List.<Object[]>of(
                            new Object[]{10, 100L},
                            new Object[]{20, 50L},
                            new Object[]{30, 25L}
                    ));

            LocalDate diaFixo = LocalDate.of(2026, 6, 1);
            Optional<Categoria> primeira = rotacaoDeCategoriaService.obterCategoriaDoDia(diaFixo);
            Optional<Categoria> segunda = rotacaoDeCategoriaService.obterCategoriaDoDia(diaFixo);

            assertTrue(primeira.isPresent());
            assertEquals(primeira.get().getId(), segunda.get().getId());
        }

        @Test
        @DisplayName("dias diferentes podem retornar categorias diferentes")
        void variaEntreDias() {
            Mockito.when(anuncioRepository.listarCategoriasMaisPopulares(eq(6L), any(Pageable.class)))
                    .thenReturn(List.<Object[]>of(
                            new Object[]{10, 100L},
                            new Object[]{20, 50L}
                    ));

            LocalDate dia1 = LocalDate.of(2026, 6, 1);
            LocalDate dia2 = LocalDate.of(2026, 6, 2);
            Optional<Categoria> escolha1 = rotacaoDeCategoriaService.obterCategoriaDoDia(dia1);
            Optional<Categoria> escolha2 = rotacaoDeCategoriaService.obterCategoriaDoDia(dia2);

            assertTrue(escolha1.isPresent());
            assertTrue(escolha2.isPresent());
            assertTrue(escolha1.get().getId() != escolha2.get().getId(),
                    "categorias deveriam diferir em dias consecutivos com pool de 2");
        }
    }

    @Nested
    @DisplayName("Fallback de elegibilidade")
    class FallbackCenarios {

        @Test
        @DisplayName("se pool com minimo 6 vier vazio, tenta com minimo 3")
        void fallbackAtivado() {
            Mockito.when(anuncioRepository.listarCategoriasMaisPopulares(eq(6L), any(Pageable.class)))
                    .thenReturn(List.<Object[]>of());
            Mockito.when(anuncioRepository.listarCategoriasMaisPopulares(eq(3L), any(Pageable.class)))
                    .thenReturn(List.<Object[]>of(new Object[]{42, 5L}));

            Optional<Categoria> escolha = rotacaoDeCategoriaService.obterCategoriaDoDia(LocalDate.now());

            assertTrue(escolha.isPresent());
            assertEquals(42, escolha.get().getId());
        }

        @Test
        @DisplayName("se ambos os pools vierem vazios, devolve empty")
        void semCategoriasElegiveis() {
            Mockito.when(anuncioRepository.listarCategoriasMaisPopulares(anyLong(), any(Pageable.class)))
                    .thenReturn(List.<Object[]>of());

            Optional<Categoria> escolha = rotacaoDeCategoriaService.obterCategoriaDoDia(LocalDate.now());

            assertTrue(escolha.isEmpty());
        }
    }
}
