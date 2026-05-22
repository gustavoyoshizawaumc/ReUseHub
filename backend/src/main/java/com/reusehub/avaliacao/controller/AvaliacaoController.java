package com.reusehub.avaliacao.controller;

import com.reusehub.avaliacao.dto.AvaliacaoCriacaoDTO;
import com.reusehub.avaliacao.dto.AvaliacaoRespostaDTO;
import com.reusehub.avaliacao.service.AvaliacaoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/avaliacoes")
@RequiredArgsConstructor
public class AvaliacaoController {

    private final AvaliacaoService avaliacaoService;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AvaliacaoRespostaDTO> criar(
            @Valid @RequestBody AvaliacaoCriacaoDTO dto,
            Authentication authentication
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(avaliacaoService.criar(authentication.getName(), dto));
    }

    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<List<AvaliacaoRespostaDTO>> listarRecebidas(@PathVariable UUID usuarioId) {
        return ResponseEntity.ok(avaliacaoService.listarRecebidas(usuarioId));
    }
}
