package com.reusehub.admin.service;

import com.reusehub.auth.crypto.SensitiveDataCrypto;
import com.reusehub.auth.model.Usuario;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class AdminRootGuard {

    private final String emailAdminRaiz;

    public AdminRootGuard(@Value("${admin.bootstrap.email:}") String emailAdminRaiz) {
        this.emailAdminRaiz = SensitiveDataCrypto.normalizarEmail(emailAdminRaiz);
    }

    public boolean isAdminRaiz(Usuario usuario) {
        if (usuario == null || emailAdminRaiz == null || emailAdminRaiz.isBlank()) {
            return false;
        }

        return emailAdminRaiz.equals(SensitiveDataCrypto.normalizarEmail(usuario.getEmail()));
    }
}
