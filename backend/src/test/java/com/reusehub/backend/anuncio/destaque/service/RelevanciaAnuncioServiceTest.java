package com.reusehub.backend.anuncio.destaque.service;

import com.reusehub.anuncio.destaque.service.RelevanciaAnuncioService;
import com.reusehub.anuncio.model.Anuncio;
import com.reusehub.anuncio.repository.AnuncioRepository;
import com.reusehub.anuncio.visualizacao.repository.VisualizacaoAnuncioRepository;
import com.reusehub.auth.model.Usuario;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes Unitarios de RelevanciaAnuncioService")
class RelevanciaAnuncioServiceTest {

    private static final UUID ANUNCIO_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

    @Mock
    private AnuncioRepository anuncioRepository;

    @Mock
    private VisualizacaoAnuncioRepository visualizacaoAnuncioRepository;

    @InjectMocks
    private RelevanciaAnuncioService service;

    @Test
    @DisplayName("grava nota_relevancia em [0,5] com escala 4 e retorna a quantidade recalculada")
    void recalculaEPersisteRelevancia() {
        Usuario dono = Usuario.builder()
                .reputationScore(new BigDecimal("5.00"))
                .build();
        Anuncio anuncio = Anuncio.builder()
                .id(ANUNCIO_ID)
                .usuario(dono)
                .criadoEm(LocalDateTime.now())
                .status(Anuncio.StatusAnuncio.ATIVO)
                .totalVisualizacoes(0)
                .build();

        List<Object[]> contagemVisitas = List.<Object[]>of(new Object[]{ANUNCIO_ID, 50L});
        when(anuncioRepository.findAtivosNaoExpiradosParaRelevancia())
                .thenReturn(List.of(anuncio));
        when(visualizacaoAnuncioRepository.contarPorAnuncioDesde(anyList(), any()))
                .thenReturn(contagemVisitas);

        int quantidade = service.recalcularTodosAtivos();

        assertEquals(1, quantidade);
        BigDecimal nota = anuncio.getNotaRelevancia();
        assertNotNull(nota);
        assertEquals(4, nota.scale(), "deve gravar na escala da coluna (4 casas)");
        assertTrue(nota.compareTo(BigDecimal.ZERO) > 0, "score deve ser > 0 (tem visitas e reputacao)");
        assertTrue(nota.compareTo(BigDecimal.valueOf(5)) <= 0, "score nao pode ultrapassar a escala 0..5");
    }

    @Test
    @DisplayName("nao recalcula nada (nem consulta visitas) quando nao ha anuncios ativos")
    void semAnunciosAtivosNaoFazTrabalho() {
        when(anuncioRepository.findAtivosNaoExpiradosParaRelevancia())
                .thenReturn(List.of());

        int quantidade = service.recalcularTodosAtivos();

        assertEquals(0, quantidade);
        verifyNoInteractions(visualizacaoAnuncioRepository);
    }
}
