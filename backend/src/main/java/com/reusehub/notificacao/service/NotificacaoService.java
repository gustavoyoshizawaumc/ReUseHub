package com.reusehub.notificacao.service;

import com.reusehub.auth.model.Usuario;
import com.reusehub.notificacao.model.Notificacao;
import com.reusehub.notificacao.repository.NotificacaoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificacaoService {

    private final NotificacaoRepository notificacaoRepository;

    @Transactional
    public void criar(
            Usuario usuario,
            String tipo,
            String titulo,
            String mensagem,
            UUID referenciaId,
            String tipoReferencia
    ) {
        notificacaoRepository.save(Notificacao.builder()
                .usuario(usuario)
                .tipo(tipo)
                .titulo(titulo)
                .mensagem(mensagem)
                .referenciaId(referenciaId)
                .tipoReferencia(tipoReferencia)
                .build());
    }
}
