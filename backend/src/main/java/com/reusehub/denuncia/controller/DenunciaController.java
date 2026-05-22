package com.reusehub.denuncia.controller;

import com.reusehub.denuncia.dto.DenunciaCriacaoDTO;
import com.reusehub.denuncia.dto.DenunciaRespostaDTO;
import com.reusehub.moderacao.service.ModeracaoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/denuncias")
@RequiredArgsConstructor
public class DenunciaController {

    private final ModeracaoService moderacaoService;

    @PostMapping("/anuncios")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<DenunciaRespostaDTO> denunciarAnuncio(
            @Valid @RequestBody DenunciaCriacaoDTO dto,
            Authentication authentication
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(moderacaoService.criarDenuncia(authentication.getName(), dto));
    }
}
