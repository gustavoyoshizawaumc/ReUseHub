package com.reusehub.admin.controller;

import com.reusehub.admin.dto.AdminCriarModeradorDTO;
import com.reusehub.admin.dto.AdminDashboardDTO;
import com.reusehub.admin.dto.AdminUsuarioDTO;
import com.reusehub.admin.service.AdminService;
import com.reusehub.auth.model.Perfil;
import com.reusehub.moderacao.dto.HistoricoModeracaoDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    @PostMapping("/moderadores")
    public ResponseEntity<AdminUsuarioDTO> criarModerador(@Valid @RequestBody AdminCriarModeradorDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.criarContaInterna(dto, Perfil.MODERADOR));
    }

    @PostMapping("/administradores")
    public ResponseEntity<AdminUsuarioDTO> criarAdministrador(@Valid @RequestBody AdminCriarModeradorDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.criarContaInterna(dto, Perfil.ADMIN));
    }

    @GetMapping("/usuarios")
    public ResponseEntity<Page<AdminUsuarioDTO>> listarUsuarios(
            @RequestParam(required = false) String termo,
            @RequestParam(required = false) Perfil perfil,
            @RequestParam(required = false) Boolean ativo,
            @RequestParam(required = false) Boolean banido,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate criadoDe,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate criadoAte,
            Pageable pageable
    ) {
        return ResponseEntity.ok(adminService.listarUsuarios(termo, perfil, ativo, banido, criadoDe, criadoAte, pageable));
    }

    @PatchMapping("/usuarios/{id}/ativar")
    public ResponseEntity<AdminUsuarioDTO> ativar(@PathVariable UUID id) {
        return ResponseEntity.ok(adminService.ativarUsuario(id));
    }

    @PatchMapping("/usuarios/{id}/desativar")
    public ResponseEntity<AdminUsuarioDTO> desativar(@PathVariable UUID id, Authentication authentication) {
        return ResponseEntity.ok(adminService.desativarUsuario(id, authentication.getName()));
    }

    @PatchMapping("/usuarios/{id}/banir")
    public ResponseEntity<AdminUsuarioDTO> banir(@PathVariable UUID id, Authentication authentication) {
        return ResponseEntity.ok(adminService.banirUsuario(id, authentication.getName()));
    }

    @DeleteMapping("/usuarios/{id}")
    public ResponseEntity<Void> excluir(@PathVariable UUID id, Authentication authentication) {
        adminService.excluirUsuario(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/dashboard")
    public ResponseEntity<AdminDashboardDTO> dashboard() {
        return ResponseEntity.ok(adminService.dashboard());
    }

    @GetMapping("/auditoria")
    public ResponseEntity<Page<HistoricoModeracaoDTO>> auditoria(Pageable pageable) {
        return ResponseEntity.ok(adminService.logsAuditoria(pageable));
    }
}
