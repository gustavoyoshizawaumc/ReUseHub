package com.reusehub.backend.anuncio.expiracao.service;

import com.reusehub.anuncio.expiracao.service.ExpiracaoAnuncioService;
import com.reusehub.anuncio.model.Anuncio;
import com.reusehub.anuncio.repository.AnuncioRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes Unitarios de ExpiracaoAnuncioService")
class ExpiracaoAnuncioServiceTest {

    @Mock
    private AnuncioRepository anuncioRepository;

    @InjectMocks
    private ExpiracaoAnuncioService service;

    @Test
    @DisplayName("muda os anuncios vencidos de ATIVO para EXPIRADO e retorna a quantidade")
    void expiraAnunciosVencidos() {
        Anuncio a1 = Anuncio.builder().status(Anuncio.StatusAnuncio.ATIVO).build();
        Anuncio a2 = Anuncio.builder().status(Anuncio.StatusAnuncio.ATIVO).build();
        when(anuncioRepository.findAnunciosExpirados()).thenReturn(List.of(a1, a2));

        int quantidade = service.expirarVencidos();

        assertEquals(2, quantidade);
        assertEquals(Anuncio.StatusAnuncio.EXPIRADO, a1.getStatus());
        assertEquals(Anuncio.StatusAnuncio.EXPIRADO, a2.getStatus());
    }

    @Test
    @DisplayName("retorna 0 quando nao ha anuncios vencidos")
    void semVencidosRetornaZero() {
        when(anuncioRepository.findAnunciosExpirados()).thenReturn(List.of());

        assertEquals(0, service.expirarVencidos());
    }
}
