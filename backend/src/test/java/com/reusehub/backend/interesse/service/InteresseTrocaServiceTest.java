package com.reusehub.backend.interesse.service;

import com.reusehub.anuncio.model.Anuncio;
import com.reusehub.anuncio.repository.AnuncioRepository;
import com.reusehub.anuncio.repository.ImagemAnuncioRepository;
import com.reusehub.auth.model.Usuario;
import com.reusehub.auth.repository.UsuarioRepository;
import com.reusehub.avaliacao.repository.AvaliacaoRepository;
import com.reusehub.chat.service.ChatService;
import com.reusehub.interesse.model.InteresseTroca;
import com.reusehub.interesse.repository.InteresseTrocaRepository;
import com.reusehub.interesse.service.InteresseTrocaService;
import com.reusehub.notificacao.service.NotificacaoService;
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

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes unitarios de InteresseTrocaService")
class InteresseTrocaServiceTest {

    @Mock private InteresseTrocaRepository interesseTrocaRepository;
    @Mock private UsuarioRepository usuarioRepository;
    @Mock private AnuncioRepository anuncioRepository;
    @Mock private ImagemAnuncioRepository imagemAnuncioRepository;
    @Mock private ChatService chatService;
    @Mock private NotificacaoService notificacaoService;
    @Mock private AvaliacaoRepository avaliacaoRepository;

    @InjectMocks
    private InteresseTrocaService interesseTrocaService;

    private Usuario dono;
    private Usuario interessado;
    private Anuncio anuncio;
    private InteresseTroca interesse;

    @BeforeEach
    void prepararNegociacao() {
        dono = usuario("dono@reusehub.com", "Dono");
        interessado = usuario("interessado@reusehub.com", "Interessado");
        anuncio = Anuncio.builder()
                .id(UUID.randomUUID())
                .usuario(dono)
                .titulo("Item para negociar")
                .status(Anuncio.StatusAnuncio.ATIVO)
                .build();
        interesse = InteresseTroca.builder()
                .id(UUID.randomUUID())
                .anuncioDesejado(anuncio)
                .interessado(interessado)
                .status(InteresseTroca.StatusInteresse.ACEITO)
                .build();

        Mockito.when(interesseTrocaRepository.findById(interesse.getId())).thenReturn(Optional.of(interesse));
        Mockito.when(interesseTrocaRepository.save(interesse)).thenReturn(interesse);
    }

    @Test
    @DisplayName("dono pode cancelar negociacao aceita")
    void donoCancelaNegociacao() {
        Mockito.when(usuarioRepository.findByEmail(dono.getEmail())).thenReturn(Optional.of(dono));

        interesseTrocaService.cancelarNegociacao(interesse.getId(), dono.getEmail());

        assertEquals(InteresseTroca.StatusInteresse.CANCELADO, interesse.getStatus());
        assertEquals(dono, interesse.getCanceladoPor());
        assertNotNull(interesse.getCanceladoEm());
        Mockito.verify(notificacaoService).criar(
                Mockito.eq(interessado),
                Mockito.eq("NEGOCIACAO_CANCELADA"),
                Mockito.anyString(),
                Mockito.anyString(),
                Mockito.eq(interesse.getId()),
                Mockito.eq("INTERESSE")
        );
    }

    @Test
    @DisplayName("interessado pode cancelar entrega pendente e anuncio volta a ficar ativo")
    void interessadoCancelaEntregaPendente() {
        anuncio.setStatus(Anuncio.StatusAnuncio.RESERVADO);
        interesse.setEntreguePeloDonoEm(LocalDateTime.now());
        Mockito.when(usuarioRepository.findByEmail(interessado.getEmail())).thenReturn(Optional.of(interessado));

        interesseTrocaService.cancelarNegociacao(interesse.getId(), interessado.getEmail());

        assertEquals(InteresseTroca.StatusInteresse.CANCELADO, interesse.getStatus());
        assertEquals(Anuncio.StatusAnuncio.ATIVO, anuncio.getStatus());
        assertEquals(interessado, interesse.getCanceladoPor());
        Mockito.verify(anuncioRepository).save(anuncio);
    }

    private Usuario usuario(String email, String nome) {
        Usuario usuario = new Usuario();
        usuario.setId(UUID.randomUUID());
        usuario.setEmail(email);
        usuario.setName(nome);
        return usuario;
    }
}
