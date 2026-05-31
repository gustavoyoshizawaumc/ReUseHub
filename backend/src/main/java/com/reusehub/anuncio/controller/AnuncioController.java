package com.reusehub.anuncio.controller;

import com.reusehub.anuncio.dto.*;
import com.reusehub.anuncio.model.Anuncio;
import com.reusehub.anuncio.service.AnuncioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/anuncios")
@RequiredArgsConstructor
public class AnuncioController {

    private final AnuncioService anuncioService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AnuncioRespostaDTO> criarAnuncio(
            @RequestPart("dados") @Valid AnuncioCriacaoComEnderecoDTO dto,
            @RequestPart("imagens") List<MultipartFile> imagens,
            Authentication authentication) {

        String email = authentication.getName();
        AnuncioRespostaDTO resposta = anuncioService.criarAnuncioComEndereco(email, dto, imagens);
        return ResponseEntity.status(HttpStatus.CREATED).body(resposta);
    }

    @GetMapping
    public ResponseEntity<Page<AnuncioRespostaDTO>> listarAnuncios(Pageable pageable) {
        Page<AnuncioRespostaDTO> resposta = anuncioService.listarAnunciosAtivos(pageable);
        return ResponseEntity.ok(resposta);
    }

    @GetMapping("/meus")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<AnuncioRespostaDTO>> listarMeusAnuncios(
            Pageable pageable,
            Authentication authentication) {

        String email = authentication.getName();
        Page<AnuncioRespostaDTO> resposta = anuncioService.listarAnunciosDoUsuario(email, pageable);
        return ResponseEntity.ok(resposta);
    }

    @GetMapping("/favoritos")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<AnuncioRespostaDTO>> listarFavoritos(Authentication authentication) {
        String email = authentication.getName();
        List<AnuncioRespostaDTO> resposta = anuncioService.listarFavoritosDoUsuario(email);
        return ResponseEntity.ok(resposta);
    }

    @GetMapping("/favoritos/ids")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<UUID>> listarIdsFavoritos(Authentication authentication) {
        String email = authentication.getName();
        List<UUID> resposta = anuncioService.listarIdsFavoritosDoUsuario(email);
        return ResponseEntity.ok(resposta);
    }

    @GetMapping("/buscar")
    public ResponseEntity<Page<AnuncioRespostaDTO>> buscarAnuncios(
            @RequestParam String termo,
            Pageable pageable) {
        Page<AnuncioRespostaDTO> resposta = anuncioService.buscarAnuncios(termo, pageable);
        return ResponseEntity.ok(resposta);
    }

    @GetMapping("/filtrar")
    public ResponseEntity<Page<AnuncioRespostaDTO>> filtrarAnuncios(
            @ModelAttribute BuscaFiltroDTO filtro,
            Pageable pageable,
            Authentication authentication) {

        String email = obterEmailUsuarioLogado(authentication);
        Page<AnuncioRespostaDTO> resposta = anuncioService.buscarComFiltros(filtro, email, pageable);
        return ResponseEntity.ok(resposta);
    }

    @GetMapping("/categoria/{categoriaId}")
    public ResponseEntity<Page<AnuncioRespostaDTO>> listarPorCategoria(
            @PathVariable Integer categoriaId,
            Pageable pageable) {
        Page<AnuncioRespostaDTO> resposta = anuncioService.listarPorCategoria(categoriaId, pageable);
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
    public ResponseEntity<AnuncioRespostaDTO> obterAnuncio(
            @PathVariable UUID id,
            Authentication authentication) {

        String email = obterEmailUsuarioLogado(authentication);
        AnuncioRespostaDTO resposta = anuncioService.obterAnuncioPorId(id, email);
        return ResponseEntity.ok(resposta);
    }

    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AnuncioRespostaDTO> atualizarAnuncio(
            @PathVariable UUID id,
            @Valid @RequestBody AnuncioAtualizacaoDTO dto,
            Authentication authentication) {

        String email = authentication.getName();
        AnuncioRespostaDTO resposta = anuncioService.atualizarAnuncio(id, email, dto);
        return ResponseEntity.ok(resposta);
    }

    @PutMapping(value = "/{id}/imagens", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AnuncioRespostaDTO> atualizarImagensDoAnuncio(
            @PathVariable UUID id,
            @RequestPart("dados") @Valid AnuncioImagensAtualizacaoDTO dto,
            @RequestPart(value = "novasImagens", required = false) List<MultipartFile> novasImagens,
            Authentication authentication) {

        String email = authentication.getName();
        AnuncioRespostaDTO resposta = anuncioService.atualizarImagensDoAnuncio(id, email, dto, novasImagens);
        return ResponseEntity.ok(resposta);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AnuncioRespostaDTO> alterarStatus(
            @PathVariable UUID id,
            @RequestParam Anuncio.StatusAnuncio status,
            Authentication authentication) {

        String email = authentication.getName();
        AnuncioRespostaDTO resposta = anuncioService.alterarStatus(id, email, status);
        return ResponseEntity.ok(resposta);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deletarAnuncio(
            @PathVariable UUID id,
            Authentication authentication) {

        String email = authentication.getName();
        anuncioService.deletarAnuncio(id, email);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/favoritos")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> favoritarAnuncio(
            @PathVariable UUID id,
            Authentication authentication) {

        String email = authentication.getName();
        anuncioService.favoritarAnuncio(id, email);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/{id}/favoritos")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> desfavoritarAnuncio(
            @PathVariable UUID id,
            Authentication authentication) {

        String email = authentication.getName();
        anuncioService.desfavoritarAnuncio(id, email);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasAnyRole('MODERADOR', 'ADMIN')")
    @GetMapping("/moderacao/pendentes")
    public ResponseEntity<Page<AnuncioRespostaDTO>> listarPendentes(
            Pageable pageable,
            Authentication authentication
    ) {
        Page<AnuncioRespostaDTO> resposta = anuncioService.listarAnunciosPendentes(pageable);
        return ResponseEntity.ok(resposta);
    }

    @PreAuthorize("hasAnyRole('MODERADOR', 'ADMIN')")
    @PatchMapping("/moderacao/{id}/aprovar")
    public ResponseEntity<AnuncioRespostaDTO> aprovar(
            @PathVariable UUID id,
            Authentication authentication
    ) {
        String email = authentication.getName();
        AnuncioRespostaDTO resposta = anuncioService.aprovarAnuncio(id, email);
        return ResponseEntity.ok(resposta);
    }

    @PreAuthorize("hasAnyRole('MODERADOR', 'ADMIN')")
    @PatchMapping("/moderacao/{id}/reprovar")
    public ResponseEntity<AnuncioRespostaDTO> reprovar(
            @PathVariable UUID id,
            Authentication authentication
    ) {
        String email = authentication.getName();
        AnuncioRespostaDTO resposta = anuncioService.reprovarAnuncio(id, email);
        return ResponseEntity.ok(resposta);
    }

    private String obterEmailUsuarioLogado(Authentication authentication) {
        return (authentication != null && authentication.isAuthenticated())
                ? authentication.getName()
                : null;
    }
}
