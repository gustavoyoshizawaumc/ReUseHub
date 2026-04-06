package com.reusehub.anuncio.controller;

import com.reusehub.anuncio.dto.*;
import com.reusehub.anuncio.model.Anuncio;
import com.reusehub.anuncio.service.AnuncioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController 
@RequestMapping("/api/anuncios")  
@RequiredArgsConstructor
public class AnuncioController {

    private final AnuncioService anuncioService;

    @PostMapping
    public ResponseEntity<AnuncioRespostaDTO> criarAnuncio(
            @Valid @RequestBody AnuncioCriacaoComEnderecoDTO dto,
            Authentication authentication) {
        
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String email = authentication.getName();
        AnuncioRespostaDTO resposta = anuncioService.criarAnuncioComEndereco(email, dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(resposta);
    }

   
    @GetMapping
    public ResponseEntity<Page<AnuncioRespostaDTO>> listarAnuncios(Pageable pageable) {
        Page<AnuncioRespostaDTO> resposta = anuncioService.listarAnunciosAtivos(pageable);
        return ResponseEntity.ok(resposta);
    }

    
    @GetMapping("/meus")
    public ResponseEntity<Page<AnuncioRespostaDTO>> listarMeusAnuncios(
            Pageable pageable,
            Authentication authentication) {
        
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String email = authentication.getName();
        Page<AnuncioRespostaDTO> resposta = anuncioService.listarAnunciosDoUsuario(email, pageable);
        return ResponseEntity.ok(resposta);
    }

    
    @GetMapping("/buscar")
    public ResponseEntity<Page<AnuncioRespostaDTO>> buscarAnuncios(
            @RequestParam String termo,
            Pageable pageable) {
        Page<AnuncioRespostaDTO> resposta = anuncioService.buscarAnuncios(termo, pageable);
        return ResponseEntity.ok(resposta);
    }

    
    @GetMapping("/categoria/{categoryId}")
    public ResponseEntity<Page<AnuncioRespostaDTO>> listarPorCategoria(
            @PathVariable Integer categoryId,
            Pageable pageable) {
        Page<AnuncioRespostaDTO> resposta = anuncioService.listarPorCategoria(categoryId, pageable);
        return ResponseEntity.ok(resposta);
    }

    
    @GetMapping("/tipo/{tipo}")
    public ResponseEntity<Page<AnuncioRespostaDTO>> listarPorTipo(
            @PathVariable Anuncio.TipoAnuncio tipo,
            Pageable pageable) {
        Page<AnuncioRespostaDTO> resposta = anuncioService.listarPorTipo(tipo, pageable);
        return ResponseEntity.ok(resposta);
    }

    
    @GetMapping("/{id}")
    public ResponseEntity<AnuncioRespostaDTO> obterAnuncio(@PathVariable UUID id) {
        AnuncioRespostaDTO resposta = anuncioService.obterAnuncioPorId(id);
        return ResponseEntity.ok(resposta);
    }

    
    @PutMapping("/{id}")
    public ResponseEntity<AnuncioRespostaDTO> atualizarAnuncio(
            @PathVariable UUID id,
            @Valid @RequestBody AnuncioAtualizacaoDTO dto,
            Authentication authentication) {
        
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String email = authentication.getName();
        AnuncioRespostaDTO resposta = anuncioService.atualizarAnuncio(id, email, dto);
        return ResponseEntity.ok(resposta);
    }

    
    @PatchMapping("/{id}/status")
    public ResponseEntity<AnuncioRespostaDTO> alterarStatus(
            @PathVariable UUID id,
            @RequestParam Anuncio.StatusAnuncio status,
            Authentication authentication) {
        
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String email = authentication.getName();
        AnuncioRespostaDTO resposta = anuncioService.alterarStatus(id, email, status);
        return ResponseEntity.ok(resposta);
    }

   
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarAnuncio(
            @PathVariable UUID id,
            Authentication authentication) {
        
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String email = authentication.getName();
        anuncioService.deletarAnuncio(id, email);
        return ResponseEntity.noContent().build();
    }
}