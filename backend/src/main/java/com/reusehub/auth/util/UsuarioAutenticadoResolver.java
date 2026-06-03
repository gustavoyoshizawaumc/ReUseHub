package com.reusehub.auth.util;

import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;

import java.util.Optional;

/**
 * Resolve o email do usuario autenticado em endpoints publicos
 * ({@code permitAll}), tratando corretamente o gotcha do Spring Security
 * em que {@link AnonymousAuthenticationToken#isAuthenticated()} retorna
 * {@code true} e {@code getName()} devolve o literal {@code "anonymousUser"}.
 *
 * <p>Para endpoints que exigem autenticacao via {@code @PreAuthorize}, o
 * uso normal de {@code Authentication#getName()} continua sendo seguro - o
 * framework garante que o filter rejeitou anonimos antes do controller.
 * Este utility e necessario apenas quando o controller aceita ambos os
 * lados (logado + anonimo) e precisa distinguir um do outro.
 *
 * <p>Ordem das verificacoes (defesa em profundidade):
 * <ol>
 *   <li>{@code auth == null} - filter nem executou</li>
 *   <li>{@code AnonymousAuthenticationToken} - marca explicita do Spring</li>
 *   <li>{@code principal} igual ao literal {@code "anonymousUser"} - blindagem
 *       caso alguma configuracao customizada nao herde de {@code AnonymousAuthenticationToken}</li>
 *   <li>{@code isAuthenticated()} false - sanity check final</li>
 * </ol>
 *
 * <p>Apenas apos passar pelos quatro filtros consideramos o usuario realmente
 * autenticado e devolvemos o email via {@code getName()}.
 */
public final class UsuarioAutenticadoResolver {

    private static final String PRINCIPAL_ANONIMO = "anonymousUser";

    private UsuarioAutenticadoResolver() {
        throw new UnsupportedOperationException("Utility class");
    }

    /**
     * Devolve o email do usuario logado, ou {@link Optional#empty()} se
     * a request veio anonima (de fato, nao por falso positivo do framework).
     */
    public static Optional<String> resolverEmail(Authentication authentication) {
        if (authentication == null) {
            return Optional.empty();
        }
        if (authentication instanceof AnonymousAuthenticationToken) {
            return Optional.empty();
        }
        Object principal = authentication.getPrincipal();
        if (principal == null || PRINCIPAL_ANONIMO.equals(principal)) {
            return Optional.empty();
        }
        if (!authentication.isAuthenticated()) {
            return Optional.empty();
        }
        return Optional.ofNullable(authentication.getName());
    }
}
