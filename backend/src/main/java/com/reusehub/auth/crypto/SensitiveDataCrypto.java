package com.reusehub.auth.crypto;

import com.reusehub.anuncio.exception.OperacaoInvalidaException;

import javax.crypto.Cipher;
import javax.crypto.Mac;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

public final class SensitiveDataCrypto {

    private static final String PREFIXO = "enc:v1:";
    private static final String ALGORITMO_AES = "AES";
    private static final String TRANSFORMACAO = "AES/GCM/NoPadding";
    private static final String ALGORITMO_HMAC = "HmacSHA256";
    private static final int TAMANHO_IV_BYTES = 12;
    private static final int TAMANHO_TAG_BITS = 128;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private SensitiveDataCrypto() {
    }

    public static String encrypt(String valor) {
        if (valor == null) {
            return null;
        }
        if (valor.startsWith(PREFIXO)) {
            return valor;
        }

        try {
            byte[] iv = new byte[TAMANHO_IV_BYTES];
            SECURE_RANDOM.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(TRANSFORMACAO);
            cipher.init(Cipher.ENCRYPT_MODE, chaveAes(), new GCMParameterSpec(TAMANHO_TAG_BITS, iv));
            byte[] cifra = cipher.doFinal(valor.getBytes(StandardCharsets.UTF_8));

            ByteBuffer buffer = ByteBuffer.allocate(iv.length + cifra.length);
            buffer.put(iv);
            buffer.put(cifra);

            return PREFIXO + Base64.getUrlEncoder().withoutPadding().encodeToString(buffer.array());
        } catch (Exception e) {
            throw new OperacaoInvalidaException("Nao foi possivel proteger os dados sensiveis.");
        }
    }

    public static String decrypt(String valorBanco) {
        if (valorBanco == null || !valorBanco.startsWith(PREFIXO)) {
            return valorBanco;
        }

        try {
            byte[] payload = Base64.getUrlDecoder().decode(valorBanco.substring(PREFIXO.length()));
            ByteBuffer buffer = ByteBuffer.wrap(payload);
            byte[] iv = new byte[TAMANHO_IV_BYTES];
            buffer.get(iv);
            byte[] cifra = new byte[buffer.remaining()];
            buffer.get(cifra);

            Cipher cipher = Cipher.getInstance(TRANSFORMACAO);
            cipher.init(Cipher.DECRYPT_MODE, chaveAes(), new GCMParameterSpec(TAMANHO_TAG_BITS, iv));
            return new String(cipher.doFinal(cifra), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new OperacaoInvalidaException("Nao foi possivel ler os dados sensiveis.");
        }
    }

    public static String emailHash(String email) {
        String normalizado = normalizarEmail(email);
        return normalizado == null ? null : blindIndex("email:" + normalizado);
    }

    public static String cpfHash(String cpf) {
        String normalizado = normalizarCpf(cpf);
        return normalizado == null ? null : blindIndex("cpf:" + normalizado);
    }

    public static String normalizarEmail(String email) {
        if (email == null || email.isBlank()) {
            return null;
        }
        return email.trim().toLowerCase();
    }

    public static String normalizarCpf(String cpf) {
        if (cpf == null || cpf.isBlank()) {
            return null;
        }
        return cpf.replaceAll("\\D", "");
    }

    private static String blindIndex(String valorNormalizado) {
        try {
            Mac mac = Mac.getInstance(ALGORITMO_HMAC);
            mac.init(new SecretKeySpec(chaveBytes(), ALGORITMO_HMAC));
            return HexFormat.of().formatHex(mac.doFinal(valorNormalizado.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new OperacaoInvalidaException("Nao foi possivel indexar dados sensiveis.");
        }
    }

    private static SecretKeySpec chaveAes() {
        return new SecretKeySpec(chaveBytes(), ALGORITMO_AES);
    }

    private static byte[] chaveBytes() {
        String segredo = primeiroValorDisponivel(
                System.getenv("DATA_ENCRYPTION_KEY"),
                System.getenv("FIELD_ENCRYPTION_KEY"),
                System.getenv("JWT_SECRET"),
                System.getProperty("DATA_ENCRYPTION_KEY"),
                System.getProperty("FIELD_ENCRYPTION_KEY"),
                System.getProperty("JWT_SECRET"),
                valorDotEnv("DATA_ENCRYPTION_KEY"),
                valorDotEnv("FIELD_ENCRYPTION_KEY"),
                valorDotEnv("JWT_SECRET"),
                "reusehub-dev-key-change-before-production"
        );
        return MessageDigestHolder.sha256(segredo);
    }

    private static String primeiroValorDisponivel(String... valores) {
        for (String valor : valores) {
            if (valor != null && !valor.isBlank()) {
                return valor;
            }
        }
        throw new IllegalStateException("Chave criptografica nao configurada.");
    }

    private static String valorDotEnv(String chave) {
        for (Path caminho : ListPaths.DOT_ENV_PATHS) {
            String valor = valorDotEnv(caminho, chave);
            if (valor != null && !valor.isBlank()) {
                return valor;
            }
        }
        return null;
    }

    private static String valorDotEnv(Path caminho, String chave) {
        if (!Files.isRegularFile(caminho)) {
            return null;
        }

        try {
            for (String linha : Files.readAllLines(caminho)) {
                String limpa = linha.trim();
                if (limpa.isBlank() || limpa.startsWith("#") || !limpa.contains("=")) {
                    continue;
                }
                int posicaoSeparador = limpa.indexOf('=');
                String nome = limpa.substring(0, posicaoSeparador).trim();
                if (!chave.equals(nome)) {
                    continue;
                }
                return limpa.substring(posicaoSeparador + 1).trim();
            }
        } catch (Exception ignored) {
            return null;
        }
        return null;
    }

    private static final class ListPaths {
        private static final Path[] DOT_ENV_PATHS = {
                Path.of(".env"),
                Path.of("..", ".env")
        };
    }

    private static final class MessageDigestHolder {
        private static byte[] sha256(String valor) {
            try {
                return MessageDigest.getInstance("SHA-256").digest(valor.getBytes(StandardCharsets.UTF_8));
            } catch (Exception e) {
                throw new OperacaoInvalidaException("Nao foi possivel preparar a chave criptografica.");
            }
        }
    }
}
