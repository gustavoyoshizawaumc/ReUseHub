package com.reusehub.anuncio.expiracao.job;

import com.reusehub.anuncio.expiracao.service.ExpiracaoAnuncioService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ExpiracaoScheduler {

    private final ExpiracaoAnuncioService expiracaoAnuncioService;

    @Scheduled(cron = "${anuncio.expiracao.cron:0 0 3 * * *}")
    public void expirarVencidos() {
        long inicio = System.currentTimeMillis();
        int quantidade = expiracaoAnuncioService.expirarVencidos();
        log.info("Anuncios expirados: {} em {} ms",
                quantidade, System.currentTimeMillis() - inicio);
    }
}
