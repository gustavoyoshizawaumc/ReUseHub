package com.reusehub.backend.anuncio.service;

import com.reusehub.anuncio.exception.OperacaoInvalidaException;
import com.reusehub.anuncio.service.StorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectResponse;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes Unitários de StorageService")
class StorageServiceTest {

    private static final String BUCKET_TESTE = "reusehub-uploads";
    private static final String REGIAO_TESTE = "us-east-2";
    private static final String PREFIXO_URL_ESPERADO = "https://reusehub-uploads.s3.us-east-2.amazonaws.com/";

    @Mock
    private S3Client s3Client;

    private StorageService storageService;

    @BeforeEach
    void prepararCenario() {
        storageService = new StorageService();
        ReflectionTestUtils.setField(storageService, "bucketName", BUCKET_TESTE);
        ReflectionTestUtils.setField(storageService, "region", REGIAO_TESTE);
        ReflectionTestUtils.setField(storageService, "s3Client", s3Client);
    }

    @Test
    @DisplayName("deve fazer upload de imagens válidas com sucesso")
    void uploadComSucesso() {
        when(s3Client.putObject(any(PutObjectRequest.class), any(RequestBody.class)))
                .thenReturn(PutObjectResponse.builder().build());

        MockMultipartFile imagem1 = new MockMultipartFile("imagens", "cadeira.png", "image/png", "bytes".getBytes());
        MockMultipartFile imagem2 = new MockMultipartFile("imagens", "mesa.jpg", "image/jpeg", "bytes".getBytes());
        List<MultipartFile> listaImagens = Arrays.asList(imagem1, imagem2);

        List<String> urlsRetornadas = storageService.salvarImagens(listaImagens);

        assertNotNull(urlsRetornadas);
        assertEquals(2, urlsRetornadas.size());
        assertTrue(urlsRetornadas.get(0).startsWith(PREFIXO_URL_ESPERADO));
        assertTrue(urlsRetornadas.get(0).endsWith(".png"));
        assertTrue(urlsRetornadas.get(1).endsWith(".jpg"));
    }

    @Test
    @DisplayName("deve estourar OperacaoInvalidaException ao tentar subir arquivo malicioso (.php)")
    void erroArquivoMalicioso() {
        MockMultipartFile arquivoMalicioso = new MockMultipartFile(
                "imagens", "exploit.php", "application/x-php", "<?php echo 'hack'; ?>".getBytes()
        );
        List<MultipartFile> listaImagens = Collections.singletonList(arquivoMalicioso);

        assertThrows(OperacaoInvalidaException.class, () -> storageService.salvarImagens(listaImagens));
    }

    @Test
    @DisplayName("deve retornar lista vazia imediatamente se nenhuma imagem for enviada")
    void listaVaziaImediata() {
        List<String> urlsNulas = storageService.salvarImagens(null);
        List<String> urlsVazias = storageService.salvarImagens(Collections.emptyList());

        assertNotNull(urlsNulas);
        assertNotNull(urlsVazias);
        assertTrue(urlsNulas.isEmpty());
        assertTrue(urlsVazias.isEmpty());
    }
}
