package com.reusehub.interesse.service;

import com.reusehub.anuncio.exception.AcessoNegadoException;
import com.reusehub.anuncio.exception.OperacaoInvalidaException;
import com.reusehub.anuncio.exception.RecursoNaoEncontradoException;
import com.reusehub.anuncio.exception.RegraNegocioException;
import com.reusehub.anuncio.model.Anuncio;
import com.reusehub.anuncio.repository.AnuncioRepository;
import com.reusehub.auth.model.Usuario;
import com.reusehub.auth.repository.UsuarioRepository;
import com.reusehub.chat.dto.ConversaRespostaDTO;
import com.reusehub.chat.dto.IniciarConversaDTO;
import com.reusehub.chat.service.ChatService;
import com.reusehub.interesse.dto.InteresseCriacaoDTO;
import com.reusehub.interesse.dto.InteresseRespostaDTO;
import com.reusehub.interesse.model.InteresseTroca;
import com.reusehub.interesse.repository.InteresseTrocaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class InteresseTrocaService {

    private final InteresseTrocaRepository interesseTrocaRepository;
    private final UsuarioRepository usuarioRepository;
    private final AnuncioRepository anuncioRepository;
    private final ChatService chatService;

    public InteresseRespostaDTO criarInteresse(String emailInteressado, InteresseCriacaoDTO dto) {
        Usuario interessado = buscarUsuarioPorEmail(emailInteressado);
        Anuncio anuncioDesejado = buscarAnuncio(dto.anuncioDesejadoId());

        validarAnuncioDisponivelParaInteresse(anuncioDesejado);

        if (anuncioDesejado.getUsuario().getId().equals(interessado.getId())) {
            throw new RegraNegocioException("Você não pode demonstrar interesse no seu próprio anúncio.");
        }

        Anuncio anuncioOferecido = null;

        if (dto.anuncioOferecidoId() != null) {
            anuncioOferecido = buscarAnuncio(dto.anuncioOferecidoId());

            if (!anuncioOferecido.getUsuario().getId().equals(interessado.getId())) {
                throw new AcessoNegadoException("Você só pode oferecer um anúncio que seja seu.");
            }

            if (anuncioOferecido.getStatus() != Anuncio.StatusAnuncio.ATIVO) {
                throw new RegraNegocioException("Você só pode oferecer anúncios ativos.");
            }

            if (anuncioOferecido.getId().equals(anuncioDesejado.getId())) {
                throw new RegraNegocioException("O anúncio oferecido não pode ser o mesmo anúncio desejado.");
            }
        }

        InteresseTroca interesse = InteresseTroca.builder()
                .anuncioDesejado(anuncioDesejado)
                .interessado(interessado)
                .anuncioOferecido(anuncioOferecido)
                .mensagem(dto.mensagem())
                .status(InteresseTroca.StatusInteresse.PENDENTE)
                .build();

        InteresseTroca salvo = interesseTrocaRepository.save(interesse);
        return mapear(salvo, null);
    }

    @Transactional(readOnly = true)
    public List<InteresseRespostaDTO> listarInteressesRecebidos(String emailUsuario) {
        Usuario usuario = buscarUsuarioPorEmail(emailUsuario);

        return interesseTrocaRepository.findByAnuncioDesejadoUsuarioIdOrderByCriadoEmDesc(usuario.getId())
                .stream()
                .map(interesse -> mapear(interesse, null))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<InteresseRespostaDTO> listarInteressesEnviados(String emailUsuario) {
        Usuario usuario = buscarUsuarioPorEmail(emailUsuario);

        return interesseTrocaRepository.findByInteressadoIdOrderByCriadoEmDesc(usuario.getId())
                .stream()
                .map(interesse -> mapear(interesse, null))
                .toList();
    }

    public InteresseRespostaDTO aceitarInteresse(UUID interesseId, String emailUsuario) {
        Usuario dono = buscarUsuarioPorEmail(emailUsuario);

        InteresseTroca interesse = interesseTrocaRepository.findById(interesseId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Interesse", interesseId));

        if (!interesse.getAnuncioDesejado().getUsuario().getId().equals(dono.getId())) {
            throw new AcessoNegadoException("Você não pode responder este interesse.");
        }

        if (interesse.getStatus() != InteresseTroca.StatusInteresse.PENDENTE) {
            throw new RegraNegocioException("Somente interesses pendentes podem ser aceitos.");
        }

        interesse.setStatus(InteresseTroca.StatusInteresse.ACEITO);

        ConversaRespostaDTO conversa = chatService.iniciarOuRecuperarConversa(
                dono.getEmail(),
                new IniciarConversaDTO(
                        interesse.getInteressado().getId().toString(),
                        interesse.getAnuncioDesejado().getId().toString()
                )
        );

        InteresseTroca salvo = interesseTrocaRepository.save(interesse);
        return mapear(salvo, conversa.id());
    }

    public InteresseRespostaDTO rejeitarInteresse(UUID interesseId, String emailUsuario) {
        Usuario dono = buscarUsuarioPorEmail(emailUsuario);

        InteresseTroca interesse = interesseTrocaRepository.findById(interesseId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Interesse", interesseId));

        if (!interesse.getAnuncioDesejado().getUsuario().getId().equals(dono.getId())) {
            throw new AcessoNegadoException("Você não pode responder este interesse.");
        }

        if (interesse.getStatus() != InteresseTroca.StatusInteresse.PENDENTE) {
            throw new RegraNegocioException("Somente interesses pendentes podem ser rejeitados.");
        }

        interesse.setStatus(InteresseTroca.StatusInteresse.REJEITADO);

        InteresseTroca salvo = interesseTrocaRepository.save(interesse);
        return mapear(salvo, null);
    }

    private Usuario buscarUsuarioPorEmail(String email) {
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário", email));
    }

    private Anuncio buscarAnuncio(UUID id) {
        return anuncioRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Anúncio", id));
    }

    private void validarAnuncioDisponivelParaInteresse(Anuncio anuncio) {
        if (anuncio.getStatus() != Anuncio.StatusAnuncio.ATIVO) {
            throw new OperacaoInvalidaException("Só é possível demonstrar interesse em anúncios ativos.");
        }
    }

    private InteresseRespostaDTO mapear(InteresseTroca interesse, String conversaId) {
        return new InteresseRespostaDTO(
                interesse.getId(),
                interesse.getAnuncioDesejado().getId(),
                interesse.getAnuncioDesejado().getTitulo(),
                interesse.getInteressado().getId(),
                interesse.getInteressado().getName(),
                interesse.getAnuncioOferecido() != null ? interesse.getAnuncioOferecido().getId() : null,
                interesse.getAnuncioOferecido() != null ? interesse.getAnuncioOferecido().getTitulo() : null,
                interesse.getMensagem(),
                interesse.getStatus(),
                interesse.getCriadoEm(),
                conversaId
        );
    }
}