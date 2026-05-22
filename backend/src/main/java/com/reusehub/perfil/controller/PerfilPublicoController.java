package com.reusehub.perfil.controller;

import com.reusehub.perfil.dto.PerfilPublicoDTO;
import com.reusehub.perfil.service.PerfilPublicoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/perfis")
@RequiredArgsConstructor
public class PerfilPublicoController {

    private final PerfilPublicoService perfilPublicoService;

    @GetMapping("/{usuarioId}")
    public ResponseEntity<PerfilPublicoDTO> obter(@PathVariable UUID usuarioId) {
        return ResponseEntity.ok(perfilPublicoService.obter(usuarioId));
    }
}
