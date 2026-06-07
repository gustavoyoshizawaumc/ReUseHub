package com.reusehub.backend.moderacao.service;

import com.reusehub.anuncio.exception.RegraNegocioException;
import com.reusehub.anuncio.model.Anuncio;
import com.reusehub.anuncio.repository.AnuncioRepository;
import com.reusehub.anuncio.repository.ImagemAnuncioRepository;
import com.reusehub.auth.model.Usuario;
import com.reusehub.auth.repository.UsuarioRepository;
import com.reusehub.avaliacao.repository.AvaliacaoRepository;
import com.reusehub.denuncia.dto.DenunciaCriacaoDTO;
import com.reusehub.denuncia.dto.DenunciaRespostaDTO;
import com.reusehub.denuncia.model.DenunciaAnuncio;
import com.reusehub.denuncia.repository.DenunciaAnuncioRepository;
import com.reusehub.moderacao.repository.HistoricoModeracaoRepository;
import com.reusehub.moderacao.service.ModeracaoService;
import com.reusehub.notificacao.service.NotificacaoService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes Unitarios de ModeracaoService")
class ModeracaoServiceTest {

    private static final String EMAIL_DENUNCIANTE = "denunciante@reusehub.com";
    private static final String EMAIL_DONO_ANUNCIO = "dono@reusehub.com";
    private static final String MOTIVO_PADRAO = "CONTEUDO_INAPROPRIADO";
    private static final String DESCRICAO_PADRAO = "Descricao da denuncia para teste.";

    @Mock private UsuarioRepository usuarioRepository;
    @Mock private AnuncioRepository anuncioRepository;
    @Mock private ImagemAnuncioRepository imagemAnuncioRepository;
    @Mock private DenunciaAnuncioRepository denunciaRepository;
    @Mock private HistoricoModeracaoRepository historicoRepository;
    @Mock private AvaliacaoRepository avaliacaoRepository;
    @Mock private NotificacaoService notificacaoService;

    @InjectMocks
    private ModeracaoService moderacaoService;

    private Usuario denunciante;
    private Usuario donoAnuncio;
    private Anuncio anuncioAlheio;

    @BeforeEach
    void prepararCenario() {
        denunciante = construirUsuario(EMAIL_DENUNCIANTE);
        donoAnuncio = construirUsuario(EMAIL_DONO_ANUNCIO);
        anuncioAlheio = construirAnuncioDe(donoAnuncio);
    }

    @Nested
    @DisplayName("Cenarios para criarDenuncia")
    class CriarDenunciaCenarios {

        @Test
        @DisplayName("deve criar denuncia com sucesso quando regras forem atendidas")
        void criarComSucesso() {
            DenunciaCriacaoDTO dto = novoDtoDenuncia(anuncioAlheio.getId());

            Mockito.when(usuarioRepository.findByEmail(EMAIL_DENUNCIANTE))
                    .thenReturn(Optional.of(denunciante));
            Mockito.when(anuncioRepository.findById(anuncioAlheio.getId()))
                    .thenReturn(Optional.of(anuncioAlheio));
            Mockito.when(denunciaRepository.existsByDenuncianteIdAndAnuncioId(
                    denunciante.getId(), anuncioAlheio.getId()
            )).thenReturn(false);
            Mockito.when(denunciaRepository.save(Mockito.any(DenunciaAnuncio.class)))
                    .thenAnswer(invocacao -> invocacao.getArgument(0));

            DenunciaRespostaDTO resultado = moderacaoService.criarDenuncia(EMAIL_DENUNCIANTE, dto);

            assertNotNull(resultado);
            Mockito.verify(denunciaRepository).save(Mockito.any(DenunciaAnuncio.class));
        }

        @Test
        @DisplayName("deve estourar RegraNegocioException ao tentar denunciar o proprio anuncio")
        void erroAoDenunciarProprioAnuncio() {
            Anuncio anuncioProprio = construirAnuncioDe(denunciante);
            DenunciaCriacaoDTO dto = novoDtoDenuncia(anuncioProprio.getId());

            Mockito.when(usuarioRepository.findByEmail(EMAIL_DENUNCIANTE))
                    .thenReturn(Optional.of(denunciante));
            Mockito.when(anuncioRepository.findById(anuncioProprio.getId()))
                    .thenReturn(Optional.of(anuncioProprio));

            RegraNegocioException erro = assertThrows(RegraNegocioException.class,
                    () -> moderacaoService.criarDenuncia(EMAIL_DENUNCIANTE, dto));

            assertEquals("Voce nao pode denunciar o proprio anuncio.", erro.getMessage());
            Mockito.verify(denunciaRepository, Mockito.never()).save(Mockito.any());
        }

        @Test
        @DisplayName("deve estourar RegraNegocioException ao tentar denunciar o mesmo anuncio duas vezes")
        void erroAoDenunciarMesmoAnuncioDuasVezes() {
            DenunciaCriacaoDTO dto = novoDtoDenuncia(anuncioAlheio.getId());

            Mockito.when(usuarioRepository.findByEmail(EMAIL_DENUNCIANTE))
                    .thenReturn(Optional.of(denunciante));
            Mockito.when(anuncioRepository.findById(anuncioAlheio.getId()))
                    .thenReturn(Optional.of(anuncioAlheio));
            Mockito.when(denunciaRepository.existsByDenuncianteIdAndAnuncioId(
                    denunciante.getId(), anuncioAlheio.getId()
            )).thenReturn(true);

            RegraNegocioException erro = assertThrows(RegraNegocioException.class,
                    () -> moderacaoService.criarDenuncia(EMAIL_DENUNCIANTE, dto));

            assertEquals("Voce ja denunciou este anuncio.", erro.getMessage());
            Mockito.verify(denunciaRepository, Mockito.never()).save(Mockito.any());
        }
    }

    private Usuario construirUsuario(String email) {
        Usuario usuario = new Usuario();
        usuario.setId(UUID.randomUUID());
        usuario.setEmail(email);
        usuario.setName("Usuario " + email);
        return usuario;
    }

    private Anuncio construirAnuncioDe(Usuario dono) {
        return Anuncio.builder()
                .id(UUID.randomUUID())
                .usuario(dono)
                .titulo("Anuncio para teste")
                .status(Anuncio.StatusAnuncio.ATIVO)
                .build();
    }

    private DenunciaCriacaoDTO novoDtoDenuncia(UUID anuncioId) {
        return new DenunciaCriacaoDTO(anuncioId, MOTIVO_PADRAO, DESCRICAO_PADRAO);
    }
}
