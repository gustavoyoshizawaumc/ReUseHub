package com.reusehub.moderacao.controller;

import com.reusehub.denuncia.dto.DenunciaRespostaDTO;
import com.reusehub.denuncia.model.DenunciaAnuncio;
import com.reusehub.moderacao.dto.AcaoModeracaoDTO;
import com.reusehub.moderacao.dto.AnuncioSuspeitoDTO;
import com.reusehub.moderacao.dto.HistoricoModeracaoDTO;
import com.reusehub.moderacao.service.ModeracaoService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/moderacao")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('MODERADOR', 'ADMIN')")
public class ModeracaoController {

    private final ModeracaoService moderacaoService;

    @GetMapping("/denuncias")
    public ResponseEntity<Page<DenunciaRespostaDTO>> listarDenuncias(
            @RequestParam(defaultValue = "ABERTA") DenunciaAnuncio.StatusDenuncia status,
            Pageable pageable
    ) {
        return ResponseEntity.ok(moderacaoService.listarDenuncias(status, pageable));
    }

    @PatchMapping("/denuncias/{id}/analisar")
    public ResponseEntity<DenunciaRespostaDTO> analisar(
            @PathVariable UUID id,
            @RequestBody(required = false) AcaoModeracaoDTO dto,
            Authentication authentication
    ) {
        return ResponseEntity.ok(moderacaoService.analisarDenuncia(
                id,
                authentication.getName(),
                dto != null ? dto.justificativa() : null
        ));
    }

    @PatchMapping("/denuncias/{id}/descartar")
    public ResponseEntity<DenunciaRespostaDTO> descartar(
            @PathVariable UUID id,
            @RequestBody(required = false) AcaoModeracaoDTO dto,
            Authentication authentication
    ) {
        return ResponseEntity.ok(moderacaoService.descartarDenuncia(
                id,
                authentication.getName(),
                dto != null ? dto.justificativa() : null
        ));
    }

    @GetMapping("/suspeitos")
    public ResponseEntity<List<AnuncioSuspeitoDTO>> listarSuspeitos(
            @RequestParam(defaultValue = "2") long minimoDenuncias
    ) {
        return ResponseEntity.ok(moderacaoService.listarSuspeitos(minimoDenuncias));
    }

    @PatchMapping("/anuncios/{id}/suspender")
    public ResponseEntity<AnuncioSuspeitoDTO> suspender(
            @PathVariable UUID id,
            @RequestBody(required = false) AcaoModeracaoDTO dto,
            Authentication authentication
    ) {
        return ResponseEntity.ok(moderacaoService.suspenderAnuncio(id, authentication.getName(), dto != null ? dto.justificativa() : null));
    }

    @PatchMapping("/anuncios/{id}/reativar")
    public ResponseEntity<AnuncioSuspeitoDTO> reativar(
            @PathVariable UUID id,
            @RequestBody(required = false) AcaoModeracaoDTO dto,
            Authentication authentication
    ) {
        return ResponseEntity.ok(moderacaoService.reativarAnuncio(id, authentication.getName(), dto != null ? dto.justificativa() : null));
    }

    @PatchMapping("/anuncios/{id}/reprovar")
    public ResponseEntity<AnuncioSuspeitoDTO> reprovar(
            @PathVariable UUID id,
            @RequestBody(required = false) AcaoModeracaoDTO dto,
            Authentication authentication
    ) {
        return ResponseEntity.ok(moderacaoService.reprovarDefinitivo(id, authentication.getName(), dto != null ? dto.justificativa() : null));
    }

    @DeleteMapping("/avaliacoes/{id}")
    public ResponseEntity<Void> removerAvaliacao(
            @PathVariable UUID id,
            @RequestBody(required = false) AcaoModeracaoDTO dto,
            Authentication authentication
    ) {
        moderacaoService.removerAvaliacao(id, authentication.getName(), dto != null ? dto.justificativa() : null);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/historico/me")
    public ResponseEntity<Page<HistoricoModeracaoDTO>> meuHistorico(Authentication authentication, Pageable pageable) {
        return ResponseEntity.ok(moderacaoService.meuHistorico(authentication.getName(), pageable));
    }
}
