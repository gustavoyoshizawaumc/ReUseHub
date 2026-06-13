package com.reusehub.interesse.service;

import com.reusehub.anuncio.model.Anuncio;
import com.reusehub.auth.model.Usuario;
import com.reusehub.interesse.model.InteresseTroca;
import com.reusehub.interesse.repository.InteresseTrocaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class InteresseCancelamentoService {

    private static final List<InteresseTroca.StatusInteresse> STATUS_ATIVOS = List.of(
            InteresseTroca.StatusInteresse.PENDENTE,
            InteresseTroca.StatusInteresse.ACEITO
    );

    private final InteresseTrocaRepository interesseTrocaRepository;

    public List<InteresseCancelado> cancelarRelacionadosAoAnuncio(Anuncio anuncioAfetado, Usuario responsavel) {
        List<InteresseTroca> interesses = interesseTrocaRepository
                .findAtivosRelacionadosAoAnuncioOrderByCriadoEmDesc(anuncioAfetado.getId(), STATUS_ATIVOS);
        return cancelar(interesses, responsavel);
    }

    public List<InteresseCancelado> cancelarRelacionadosAoUsuario(Usuario usuarioAfetado, Usuario responsavel) {
        List<InteresseTroca> interesses = interesseTrocaRepository
                .findAtivosRelacionadosAoUsuarioOrderByCriadoEmDesc(usuarioAfetado.getId(), STATUS_ATIVOS);
        return cancelar(interesses, responsavel);
    }

    private List<InteresseCancelado> cancelar(List<InteresseTroca> interesses, Usuario responsavel) {
        if (interesses.isEmpty()) {
            return List.of();
        }

        LocalDateTime canceladoEm = LocalDateTime.now();
        List<InteresseCancelado> cancelados = interesses.stream()
                .map(interesse -> {
                    InteresseTroca.StatusInteresse statusAnterior = interesse.getStatus();
                    interesse.setStatus(InteresseTroca.StatusInteresse.CANCELADO);
                    interesse.setCanceladoEm(canceladoEm);
                    interesse.setCanceladoPor(responsavel);
                    return new InteresseCancelado(interesse, statusAnterior);
                })
                .toList();

        interesseTrocaRepository.saveAll(interesses);
        return cancelados;
    }

    public record InteresseCancelado(
            InteresseTroca interesse,
            InteresseTroca.StatusInteresse statusAnterior
    ) {
    }
}
