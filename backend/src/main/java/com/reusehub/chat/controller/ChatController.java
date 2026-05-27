package com.reusehub.chat.controller;

import com.reusehub.chat.dto.ConversaRespostaDTO;
import com.reusehub.chat.dto.IniciarConversaDTO;
import com.reusehub.chat.dto.ListaConversasDTO;
import com.reusehub.chat.dto.MensagemCriacaoDTO;
import com.reusehub.chat.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/enviar")
    public ResponseEntity<Void> enviarMensagem(
            @Valid @RequestBody MensagemCriacaoDTO dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        chatService.enviarMensagem(userDetails.getUsername(), dto.conversaId(), dto); 
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PostMapping("/iniciar")
    public ResponseEntity<ConversaRespostaDTO> iniciarConversa(
            @Valid @RequestBody IniciarConversaDTO dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        ConversaRespostaDTO conversa = chatService.iniciarOuRecuperarConversa(
                userDetails.getUsername(),
                dto
        );
        return ResponseEntity.ok(conversa);
    }

    @GetMapping("/conversa/{destinatario}")
    public ResponseEntity<ConversaRespostaDTO> obterConversa(
            @PathVariable String destinatario,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        ConversaRespostaDTO conversa = chatService.recuperarHistoricoConversa(userDetails.getUsername(), destinatario);
        return ResponseEntity.ok(conversa);
    }

    @GetMapping("/{conversaId}")
    public ResponseEntity<ConversaRespostaDTO> obterConversaPorId(
            @PathVariable String conversaId,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        ConversaRespostaDTO conversa = chatService.recuperarConversaPorId(conversaId, userDetails.getUsername());
        return ResponseEntity.ok(conversa);
    }

    @GetMapping("/minhas-conversas")
    public ResponseEntity<ListaConversasDTO> obterMinhasConversas(
            @AuthenticationPrincipal UserDetails userDetails) {
        
        ListaConversasDTO conversas = chatService.listarConversasUsuario(userDetails.getUsername());
        return ResponseEntity.ok(conversas);
    }

    @PatchMapping("/{conversaId}/lido")
    public ResponseEntity<Void> marcarComoLido(
            @PathVariable String conversaId,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        chatService.marcarComoLido(conversaId, userDetails.getUsername());
        return ResponseEntity.ok().build();
    }
}