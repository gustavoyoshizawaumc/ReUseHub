package com.reusehub.anuncio.visualizacao.controller;

import com.reusehub.anuncio.visualizacao.dto.RegistroVisualizacaoComando;
import com.reusehub.anuncio.visualizacao.dto.RegistroVisualizacaoRequestDTO;
import com.reusehub.anuncio.visualizacao.service.RegistroVisualizacaoService;
import com.reusehub.anuncio.visualizacao.util.ExtratorIpCliente;
import com.reusehub.auth.util.UsuarioAutenticadoResolver;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Endpoint publico de tracking de visualizacoes (PR D.2).
 *
 * <p>Aceita usuario logado ou anonimo. Sempre responde {@code 204 No Content}
 * mesmo quando a visualizacao e descartada (dono ou dedupe), para nao revelar
 * a logica anti-fraude ao cliente.
 */
@RestController
@RequestMapping("/api/anuncios")
@RequiredArgsConstructor
public class VisualizacaoAnuncioController {

    private static final String HEADER_ANON_ID = "X-Anon-Id";

    private final RegistroVisualizacaoService registroVisualizacaoService;

    @PostMapping("/{id}/visualizacao")
    public ResponseEntity<Void> registrarVisualizacao(
            @PathVariable UUID id,
            @Valid @RequestBody RegistroVisualizacaoRequestDTO body,
            @RequestHeader(value = HEADER_ANON_ID, required = false) String anonId,
            HttpServletRequest httpRequest,
            Authentication authentication
    ) {
        RegistroVisualizacaoComando comando = new RegistroVisualizacaoComando(
                id,
                body.origem(),
                UsuarioAutenticadoResolver.resolverEmail(authentication).orElse(null),
                normalizarAnonId(anonId),
                ExtratorIpCliente.extrair(httpRequest)
        );

        registroVisualizacaoService.registrarSeValido(comando);
        return ResponseEntity.noContent().build();
    }

    private String normalizarAnonId(String anonId) {
        if (anonId == null) {
            return null;
        }
        String trimmed = anonId.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
