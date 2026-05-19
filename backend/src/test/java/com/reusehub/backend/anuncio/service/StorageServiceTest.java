package com.reusehub.backend.anuncio.service;

import com.reusehub.anuncio.exception.OperacaoInvalidaException;
import com.reusehub.anuncio.service.StorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Testes Unitários de StorageService")
class StorageServiceTest {

    private StorageService storageService;

    @TempDir
    Path pastaTemporaria;

    @BeforeEach
    void setUp() {
        storageService = new StorageService();
        ReflectionTestUtils.setField(storageService, "uploadDir", pastaTemporaria.toString());
    }

    @Test
    @DisplayName("deve fazer upload de imagens válidas com sucesso")
    void uploadComSucesso() {
        MockMultipartFile imagem1 = new MockMultipartFile("imagens", "cadeira.png", "image/png", "bytes".getBytes());
        MockMultipartFile imagem2 = new MockMultipartFile("imagens", "mesa.jpg", "image/jpeg", "bytes".getBytes());
        List<MultipartFile> listaImagens = Arrays.asList(imagem1, imagem2);

        List<String> urlsRetornadas = storageService.salvarImagens(listaImagens);

        assertNotNull(urlsRetornadas);
        assertEquals(2, urlsRetornadas.size());
        assertTrue(urlsRetornadas.get(0).startsWith("/uploads/"));
        assertTrue(urlsRetornadas.get(0).endsWith(".png"));
        assertTrue(urlsRetornadas.get(1).endsWith(".jpg"));
    }

    @Test
    @DisplayName("deve estourar OperacaoInvalidaException ao tentar subir arquivo malicioso (.php)")
    void erroArquivoMalicioso() {
        MockMultipartFile arquivoMalicioso = new MockMultipartFile("imagens", "exploit.php", "application/x-php", "<?php echo 'hack'; ?>".getBytes());
        List<MultipartFile> listaImagens = Collections.singletonList(arquivoMalicioso);

        assertThrows(OperacaoInvalidaException.class, () -> {
            storageService.salvarImagens(listaImagens);
        });
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