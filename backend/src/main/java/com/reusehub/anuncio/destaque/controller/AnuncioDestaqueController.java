package com.reusehub.anuncio.destaque.controller;

import com.reusehub.anuncio.destaque.dto.AnuncioDestaqueDTO;
import com.reusehub.anuncio.destaque.dto.BootstrapHomeDTO;
import com.reusehub.anuncio.destaque.enums.ContextoDestaque;
import com.reusehub.anuncio.destaque.service.AnuncioDestaqueService;
import com.reusehub.anuncio.destaque.service.BootstrapHomeService;
import com.reusehub.anuncio.destaque.service.ConfiguracaoDestaque;
import com.reusehub.auth.model.Usuario;
import com.reusehub.auth.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/anuncios/destaques")
@RequiredArgsConstructor
public class AnuncioDestaqueController {

    private final BootstrapHomeService bootstrapHomeService;
    private final AnuncioDestaqueService anuncioDestaqueService;
    private final UsuarioRepository usuarioRepository;

    @GetMapping("/bootstrap-home")
    public ResponseEntity<BootstrapHomeDTO> bootstrapHome(Authentication authentication) {
        String emailAutenticado = extrairEmailAutenticado(authentication);
        BootstrapHomeDTO receita = bootstrapHomeService.montarReceita(emailAutenticado);
        return ResponseEntity.ok(receita);
    }

    @GetMapping
    public ResponseEntity<List<AnuncioDestaqueDTO>> obterDestaquesPorContexto(
            @RequestParam("contexto") ContextoDestaque contexto,
            @RequestParam(value = "categoriaId", required = false) Integer categoriaId,
            @RequestParam(value = "size", required = false) Integer size,
            Authentication authentication
    ) {
        int sizeFinal = Optional.ofNullable(size).orElse(ConfiguracaoDestaque.DEFAULT_SIZE);
        UUID usuarioId = extrairIdAutenticado(authentication);
        List<AnuncioDestaqueDTO> destaques = anuncioDestaqueService.obterDestaques(
                contexto, categoriaId, sizeFinal, usuarioId
        );
        return ResponseEntity.ok(destaques);
    }

    private String extrairEmailAutenticado(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() || authentication.getPrincipal().equals("anonymousUser")) {
            return null;
        }
        return authentication.getName();
    }

    private UUID extrairIdAutenticado(Authentication authentication) {
        String email = extrairEmailAutenticado(authentication);
        if (email == null) {
            return null;
        }
        return usuarioRepository.findByEmail(email).map(Usuario::getId).orElse(null);
    }
}
