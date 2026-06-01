package com.reusehub.backend.moderacao.repository;

import com.reusehub.anuncio.repository.AnuncioRepository;
import com.reusehub.avaliacao.repository.AvaliacaoRepository;
import com.reusehub.backend.BackendApplication;
import com.reusehub.denuncia.repository.DenunciaAnuncioRepository;
import com.reusehub.moderacao.repository.HistoricoModeracaoRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

@SpringBootTest(classes = BackendApplication.class)
@Transactional(readOnly = true)
@DisplayName("Filtros de moderacao integrados com PostgreSQL")
class FiltrosModeracaoRepositoryTest {

    private static final LocalDateTime INICIO = LocalDate.of(1900, 1, 1).atStartOfDay();
    private static final LocalDateTime FIM = LocalDate.of(9999, 12, 31).atStartOfDay();
    private static final UUID UUID_SENTINELA = new UUID(0, 0);

    @Autowired private AnuncioRepository anuncioRepository;
    @Autowired private DenunciaAnuncioRepository denunciaRepository;
    @Autowired private AvaliacaoRepository avaliacaoRepository;
    @Autowired private HistoricoModeracaoRepository historicoRepository;

    @Test
    @DisplayName("deve executar filtros vazios sem parametros nulos ambiguos")
    void filtrosVazios() {
        var pagina = PageRequest.of(0, 10);

        assertDoesNotThrow(() -> anuncioRepository.buscarParaModeracao("", "", pagina));
        assertDoesNotThrow(() -> denunciaRepository.buscarParaModeracao("", "", pagina));
        assertDoesNotThrow(() -> denunciaRepository.listarAnunciosSuspeitos(1, "", ""));
        assertDoesNotThrow(() -> avaliacaoRepository.buscarParaModeracao("", 0, INICIO, FIM, pagina));
        assertDoesNotThrow(() -> historicoRepository.buscar(
                UUID_SENTINELA, UUID_SENTINELA, "", "", INICIO, FIM, pagina
        ));
    }

    @Test
    @DisplayName("deve executar filtros preenchidos sem parametros nulos ambiguos")
    void filtrosPreenchidos() {
        var pagina = PageRequest.of(0, 10);
        var moderadorInexistente = UUID.randomUUID();

        assertDoesNotThrow(() -> anuncioRepository.buscarParaModeracao("inexistente", "ATIVO", pagina));
        assertDoesNotThrow(() -> denunciaRepository.buscarParaModeracao("inexistente", "ABERTA", pagina));
        assertDoesNotThrow(() -> denunciaRepository.listarAnunciosSuspeitos(1, "inexistente", "ATIVO"));
        assertDoesNotThrow(() -> avaliacaoRepository.buscarParaModeracao("inexistente", 5, INICIO, FIM, pagina));
        assertDoesNotThrow(() -> historicoRepository.buscar(
                moderadorInexistente, UUID_SENTINELA, "inexistente", "ANUNCIO_APROVADO", INICIO, FIM, pagina
        ));
    }
}
