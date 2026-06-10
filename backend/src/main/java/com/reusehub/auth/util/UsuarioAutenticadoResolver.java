package com.reusehub.auth.util;

import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;

import java.util.Optional;

public final class UsuarioAutenticadoResolver {

    private static final String PRINCIPAL_ANONIMO = "anonymousUser";

    private UsuarioAutenticadoResolver() {
        throw new UnsupportedOperationException("Utility class");
    }

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
