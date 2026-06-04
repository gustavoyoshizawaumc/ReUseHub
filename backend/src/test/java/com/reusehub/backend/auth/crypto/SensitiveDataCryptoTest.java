package com.reusehub.backend.auth.crypto;

import com.reusehub.auth.crypto.SensitiveDataCrypto;
import com.reusehub.auth.crypto.SensitiveStringConverter;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Criptografia de dados sensiveis")
class SensitiveDataCryptoTest {

    @Test
    @DisplayName("deve criptografar e descriptografar valores sensiveis")
    void criptografarEDescriptografar() {
        String textoOriginal = "gusta@email.com";

        String criptografado = SensitiveDataCrypto.encrypt(textoOriginal);

        assertNotEquals(textoOriginal, criptografado);
        assertTrue(criptografado.startsWith("enc:v1:"));
        assertEquals(textoOriginal, SensitiveDataCrypto.decrypt(criptografado));
    }

    @Test
    @DisplayName("deve gerar hashes estaveis para email e CPF normalizados")
    void gerarHashesNormalizados() {
        assertEquals(
                SensitiveDataCrypto.emailHash("gusta@email.com"),
                SensitiveDataCrypto.emailHash(" GUSTA@EMAIL.COM ")
        );
        assertEquals(
                SensitiveDataCrypto.cpfHash("12345678901"),
                SensitiveDataCrypto.cpfHash("123.456.789-01")
        );
    }

    @Test
    @DisplayName("converter deve aceitar dados legados em texto puro")
    void converterAceitaValorLegado() {
        SensitiveStringConverter converter = new SensitiveStringConverter();

        assertEquals("texto legado", converter.convertToEntityAttribute("texto legado"));
    }
}
