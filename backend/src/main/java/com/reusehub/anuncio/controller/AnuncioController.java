package com.reusehub.anuncio.controller;

import com.reusehub.anuncio.dto.AnuncioEdicaoDTO;
import com.reusehub.anuncio.dto.AnuncioRequestDTO;
import com.reusehub.anuncio.dto.AnuncioRespostaDTO;
import com.reusehub.anuncio.service.AnuncioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/anuncios")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AnuncioController {

    private final AnuncioService anuncioService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AnuncioRespostaDTO> publicar(
            @Valid @RequestPart("dados") AnuncioRequestDTO dto,
            @RequestPart(value = "imagens", required = false) List<MultipartFile> imagens
    ) throws IOException {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(anuncioService.publicar(dto, imagens));
    }

    @GetMapping
    public ResponseEntity<List<AnuncioRespostaDTO>> listarAtivos() {
        return ResponseEntity.ok(anuncioService.listarAtivos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AnuncioRespostaDTO> buscarPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(anuncioService.buscarPorId(id));
    }

    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<List<AnuncioRespostaDTO>> listarPorUsuario(
            @PathVariable UUID usuarioId) {
        return ResponseEntity.ok(anuncioService.listarPorUsuario(usuarioId));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AnuncioRespostaDTO> editar(
            @PathVariable UUID id,
            @Valid @RequestPart("dados") AnuncioEdicaoDTO dto,
            @RequestPart(value = "imagens", required = false) List<MultipartFile> imagens
    ) throws IOException {
        return ResponseEntity.ok(anuncioService.editar(id, dto, imagens));
    }

    @PatchMapping("/{id}/pausar")
    public ResponseEntity<AnuncioRespostaDTO> pausar(
            @PathVariable UUID id,
            @RequestParam UUID usuarioId) {
        return ResponseEntity.ok(anuncioService.pausar(id, usuarioId));
    }

    @PatchMapping("/{id}/reativar")
    public ResponseEntity<AnuncioRespostaDTO> reativar(
            @PathVariable UUID id,
            @RequestParam UUID usuarioId) {
        return ResponseEntity.ok(anuncioService.reativar(id, usuarioId));
    }

    @PatchMapping("/{id}/encerrar")
    public ResponseEntity<AnuncioRespostaDTO> encerrar(
            @PathVariable UUID id,
            @RequestParam UUID usuarioId) {
        return ResponseEntity.ok(anuncioService.encerrar(id, usuarioId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(
            @PathVariable UUID id,
            @RequestParam UUID usuarioId) throws IOException {
        anuncioService.deletar(id, usuarioId);
        return ResponseEntity.noContent().build();
    }
}