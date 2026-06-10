package com.reusehub.backend.avaliacao.service;

import com.reusehub.anuncio.exception.RegraNegocioException;
import com.reusehub.anuncio.model.Anuncio;
import com.reusehub.anuncio.repository.AnuncioRepository;
import com.reusehub.auth.model.Usuario;
import com.reusehub.auth.repository.UsuarioRepository;
import com.reusehub.avaliacao.dto.AvaliacaoCriacaoDTO;
import com.reusehub.avaliacao.model.Avaliacao;
import com.reusehub.avaliacao.repository.AvaliacaoRepository;
import com.reusehub.avaliacao.service.AvaliacaoService;
import com.reusehub.interesse.model.InteresseTroca;
import com.reusehub.interesse.repository.InteresseTrocaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes unitarios de AvaliacaoService")
class AvaliacaoServiceTest {

    @Mock private AvaliacaoRepository avaliacaoRepository;
    @Mock private UsuarioRepository usuarioRepository;
    @Mock private AnuncioRepository anuncioRepository;
    @Mock private InteresseTrocaRepository interesseTrocaRepository;

    @InjectMocks
    private AvaliacaoService avaliacaoService;

    private Usuario dono;
    private Usuario interessado;
    private Anuncio anuncio;

    @BeforeEach
    void preparar() {
        dono = usuario("dono@reusehub.com", "Dono");
        interessado = usuario("interessado@reusehub.com", "Interessado");
        anuncio = Anuncio.builder()
                .id(UUID.randomUUID())
                .usuario(dono)
                .titulo("Item negociado")
                .status(Anuncio.StatusAnuncio.CONCLUIDO)
                .build();
    }

    @Test
    @DisplayName("bloqueia comentario com termo proibido antes de salvar avaliacao")
    void bloqueiaComentarioComTermoProibido() {
        prepararAvaliacaoPermitida();

        AvaliacaoCriacaoDTO dto = new AvaliacaoCriacaoDTO(
                anuncio.getId(),
                dono.getId(),
                (short) 5,
                "Foi um i.d.i.o.t.a na negociacao"
        );

        assertThrows(RegraNegocioException.class, () -> avaliacaoService.criar(interessado.getEmail(), dto));
        Mockito.verify(avaliacaoRepository, Mockito.never()).save(Mockito.any(Avaliacao.class));
    }

    @Test
    @DisplayName("salva comentario limpo com espacos normalizados")
    void salvaComentarioLimpo() {
        prepararAvaliacaoPermitida();
        Mockito.when(avaliacaoRepository.existsByAvaliadorIdAndAnuncioId(interessado.getId(), anuncio.getId()))
                .thenReturn(false);
        Mockito.when(avaliacaoRepository.save(Mockito.any(Avaliacao.class))).thenAnswer(invocation -> {
            Avaliacao avaliacao = invocation.getArgument(0);
            avaliacao.setId(UUID.randomUUID());
            avaliacao.setCriadoEm(LocalDateTime.now());
            return avaliacao;
        });
        Mockito.when(avaliacaoRepository.calcularMediaDoAvaliado(dono.getId())).thenReturn(5.0);

        AvaliacaoCriacaoDTO dto = new AvaliacaoCriacaoDTO(
                anuncio.getId(),
                dono.getId(),
                (short) 5,
                "  Entrega correta e combinacao tranquila.  "
        );

        var resposta = avaliacaoService.criar(interessado.getEmail(), dto);

        assertEquals("Entrega correta e combinacao tranquila.", resposta.comentario());
        Mockito.verify(avaliacaoRepository).save(Mockito.any(Avaliacao.class));
        Mockito.verify(usuarioRepository).save(dono);
    }

    private void prepararAvaliacaoPermitida() {
        Mockito.when(usuarioRepository.findByEmail(interessado.getEmail())).thenReturn(Optional.of(interessado));
        Mockito.when(usuarioRepository.findById(dono.getId())).thenReturn(Optional.of(dono));
        Mockito.when(anuncioRepository.findById(anuncio.getId())).thenReturn(Optional.of(anuncio));
        Mockito.when(interesseTrocaRepository.existsByAnuncioDesejadoIdAndInteressadoIdAndStatus(
                anuncio.getId(),
                interessado.getId(),
                InteresseTroca.StatusInteresse.ACEITO
        )).thenReturn(true);
        Mockito.when(interesseTrocaRepository.existsByAnuncioDesejadoIdAndInteressadoIdAndStatus(
                anuncio.getId(),
                dono.getId(),
                InteresseTroca.StatusInteresse.ACEITO
        )).thenReturn(false);
    }

    private Usuario usuario(String email, String nome) {
        Usuario usuario = new Usuario();
        usuario.setId(UUID.randomUUID());
        usuario.setEmail(email);
        usuario.setName(nome);
        return usuario;
    }
}
