package com.reusehub.anuncio.expiracao.service;

import com.reusehub.anuncio.model.Anuncio;
import com.reusehub.anuncio.repository.AnuncioRepository;
import com.reusehub.interesse.service.InteresseCancelamentoService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ExpiracaoAnuncioService {

    private final AnuncioRepository anuncioRepository;
    private final InteresseCancelamentoService interesseCancelamentoService;

    @Transactional
    public int expirarVencidos() {
        List<Anuncio> vencidos = anuncioRepository.findAnunciosExpirados();
        for (Anuncio anuncio : vencidos) {
            anuncio.setStatus(Anuncio.StatusAnuncio.EXPIRADO);
            interesseCancelamentoService.cancelarRelacionadosAoAnuncio(anuncio, null);
        }
        return vencidos.size();
    }
}
