package com.reusehub.auth.controller;

import com.reusehub.anuncio.service.StorageService;
import com.reusehub.auth.dto.*;
import com.reusehub.auth.service.AuthService;
import com.reusehub.auth.service.PasswordResetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final StorageService storageService;
    private final PasswordResetService passwordResetService;

    @PostMapping("/registrar")
    public ResponseEntity<AuthResponse> registrar(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.registrar(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/minha-conta")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UsuarioRespostaDTO> obterPerfil(Authentication authentication) {
        return ResponseEntity.ok(authService.obterPerfilPorEmail(authentication.getName()));
    }

    @PutMapping(value = "/minha-conta", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UsuarioRespostaDTO> atualizarPerfilComArquivo(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) String bio,
            @RequestParam(required = false) MultipartFile avatarFile,
            Authentication authentication) {
        
        UsuarioAtualizacaoDTO dto = new UsuarioAtualizacaoDTO();
        dto.setName(name);
        dto.setPhone(phone);
        dto.setBio(bio);
        
        if (avatarFile != null && !avatarFile.isEmpty()) {
            List<String> urls = storageService.salvarImagens(Collections.singletonList(avatarFile));
            if (!urls.isEmpty()) {
                dto.setAvatarUrl(urls.get(0));
            }
        }
        
        return ResponseEntity.ok(authService.atualizarPerfilPorEmail(authentication.getName(), dto));
    }

    @PatchMapping(value = "/minha-conta", consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UsuarioRespostaDTO> atualizarPerfilSemArquivo(
            @Valid @RequestBody UsuarioAtualizacaoDTO dto,
            Authentication authentication) {
        
        return ResponseEntity.ok(authService.atualizarPerfilPorEmail(authentication.getName(), dto));
    }

    @DeleteMapping("/minha-conta")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deletarConta(Authentication authentication) {
        authService.deletarContaPorEmail(authentication.getName());
        return ResponseEntity.noContent().build();
    }

    /**
     * Inicia o fluxo de recuperação de senha.
     * Resposta sempre genérica para evitar user enumeration.
     */
    @PostMapping("/esqueci-senha")
    public ResponseEntity<Map<String, String>> esqueciSenha(@Valid @RequestBody EsqueciSenhaRequest request) {
        passwordResetService.solicitarRecuperacao(request.getEmail());
        return ResponseEntity.ok(Map.of(
                "mensagem", "Se o e-mail informado estiver cadastrado, você receberá as instruções em breve."
        ));
    }

    /**
     * Redefine a senha usando o token recebido por e-mail.
     */
    @PostMapping("/redefinir-senha")
    public ResponseEntity<Map<String, String>> redefinirSenha(@Valid @RequestBody RedefinirSenhaRequest request) {
        passwordResetService.redefinirSenha(request);
        return ResponseEntity.ok(Map.of(
                "mensagem", "Senha redefinida com sucesso. Você já pode fazer login."
        ));
    }
}