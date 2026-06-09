package com.reusehub.anuncio.destaque.job;

import com.reusehub.anuncio.destaque.service.RelevanciaAnuncioService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class RelevanciaScheduler {

    private final RelevanciaAnuncioService relevanciaAnuncioService;

    @Scheduled(cron = "${relevancia.recalculo.cron:0 0 * * * *}")
    public void recalcularPeriodicamente() {
        long inicio = System.currentTimeMillis();
        int quantidade = relevanciaAnuncioService.recalcularTodosAtivos();
        log.info("Relevancia recalculada para {} anuncios em {} ms",
                quantidade, System.currentTimeMillis() - inicio);
    }
}
