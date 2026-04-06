package com.reusehub.auth.controller;

import com.reusehub.auth.dto.*;
import com.reusehub.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> registrar(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.registrar(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<UsuarioRespostaDTO> obterPerfil(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        String email = authentication.getName();
        return ResponseEntity.ok(authService.obterPerfilPorEmail(email));
    }

    @PutMapping(value = "/me", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UsuarioRespostaDTO> atualizarPerfilComArquivo(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) String bio,
            @RequestParam(required = false) MultipartFile avatarFile,
            Authentication authentication) {
        
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        String email = authentication.getName();
        
        String avatarUrl = null;
        if (avatarFile != null && !avatarFile.isEmpty()) {
            avatarUrl = salvarFoto(avatarFile);
        }
        
        UsuarioAtualizacaoDTO dto = new UsuarioAtualizacaoDTO();
        dto.setName(name);
        dto.setPhone(phone);
        dto.setBio(bio);
        if (avatarUrl != null) {
            dto.setAvatarUrl(avatarUrl);
        }
        
        return ResponseEntity.ok(authService.atualizarPerfilPorEmail(email, dto));
    }

    @PatchMapping(value = "/me", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<UsuarioRespostaDTO> atualizarPerfilSemArquivo(
            @Valid @RequestBody UsuarioAtualizacaoDTO dto,
            Authentication authentication) {
        
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        String email = authentication.getName();
        return ResponseEntity.ok(authService.atualizarPerfilPorEmail(email, dto));
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> deletarConta(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        String email = authentication.getName();
        authService.deletarContaPorEmail(email);
        return ResponseEntity.noContent().build();
    }
    // 

    private String salvarFoto(MultipartFile file) {
        try {
            if (file.getContentType() == null || !file.getContentType().startsWith("image/")) {
                throw new IllegalArgumentException("Arquivo deve ser uma imagem");
            }

            if (file.getSize() > 5 * 1024 * 1024) {
                throw new IllegalArgumentException("Arquivo não pode ser maior que 5MB");
            }

            String nomeOriginal = file.getOriginalFilename()
                .replaceAll("\s+", "_")
                .replaceAll("[^a-zA-Z0-9._-]", "");
            
            String nomeArquivo = System.currentTimeMillis() + "_" + nomeOriginal;
            
            Path uploadDir = Paths.get("uploads").toAbsolutePath();
            
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
                System.out.println("Pasta de uploads criada: " + uploadDir);
            }

            Path filePath = uploadDir.resolve(nomeArquivo);
            Files.write(filePath, file.getBytes());
            
            System.out.println("Foto salva em: " + filePath);

            return "/uploads/" + nomeArquivo;
        } catch (Exception e) {
            System.err.println("Erro ao salvar foto: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Erro ao salvar foto: " + e.getMessage());
        }
    }
}