package com.reusehub.interesse.controller;

import com.reusehub.interesse.dto.InteresseCriacaoDTO;
import com.reusehub.interesse.dto.InteresseRespostaDTO;
import com.reusehub.interesse.service.InteresseTrocaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/interesses")
@RequiredArgsConstructor
public class InteresseTrocaController {

    private final InteresseTrocaService interesseTrocaService;

    @PostMapping
    public ResponseEntity<InteresseRespostaDTO> criar(
            @Valid @RequestBody InteresseCriacaoDTO dto,
            Authentication authentication
    ) {
        String email = authentication.getName();
        InteresseRespostaDTO resposta = interesseTrocaService.criarInteresse(email, dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(resposta);
    }

    @GetMapping("/recebidos")
    public ResponseEntity<List<InteresseRespostaDTO>> listarRecebidos(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(interesseTrocaService.listarInteressesRecebidos(email));
    }

    @GetMapping("/enviados")
    public ResponseEntity<List<InteresseRespostaDTO>> listarEnviados(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(interesseTrocaService.listarInteressesEnviados(email));
    }

    @PatchMapping("/{id}/aceitar")
    public ResponseEntity<InteresseRespostaDTO> aceitar(
            @PathVariable UUID id,
            Authentication authentication
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(interesseTrocaService.aceitarInteresse(id, email));
    }

    @PatchMapping("/{id}/recusar")
    public ResponseEntity<InteresseRespostaDTO> recusar(
            @PathVariable UUID id,
            Authentication authentication
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(interesseTrocaService.rejeitarInteresse(id, email));
    }

    @PatchMapping("/{id}/marcar-entregue")
    public ResponseEntity<InteresseRespostaDTO> marcarEntregue(
            @PathVariable UUID id,
            Authentication authentication
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(interesseTrocaService.marcarComoEntregue(id, email));
    }

    @PatchMapping("/{id}/confirmar-recebimento")
    public ResponseEntity<InteresseRespostaDTO> confirmarRecebimento(
            @PathVariable UUID id,
            Authentication authentication
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(interesseTrocaService.confirmarRecebimento(id, email));
    }

    @PatchMapping("/{id}/cancelar")
    public ResponseEntity<InteresseRespostaDTO> cancelar(
            @PathVariable UUID id,
            Authentication authentication
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(interesseTrocaService.cancelarNegociacao(id, email));
    }
}
