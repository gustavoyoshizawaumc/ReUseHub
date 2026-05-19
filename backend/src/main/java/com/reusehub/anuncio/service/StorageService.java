package com.reusehub.anuncio.service;

import com.reusehub.anuncio.exception.OperacaoInvalidaException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
public class StorageService {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    private static final List<String> EXTENSOES_PERMITIDAS = Arrays.asList(".jpg", ".jpeg", ".png", ".webp");

    public List<String> salvarImagens(List<MultipartFile> imagens) {
        List<String> urls = new ArrayList<>();
        if (imagens == null || imagens.isEmpty()) {
            return urls;
        }

        try {
            Path diretorio = inicializarDiretorioUpload();

            for (MultipartFile imagem : imagens) {
                if (imagem.isEmpty()) continue;

                String nomeOriginal = imagem.getOriginalFilename();
                String extensao = obterExtensao(nomeOriginal);
                validarExtensaoImagem(extensao, nomeOriginal);

                String nomeArquivo = UUID.randomUUID() + extensao;
                Path destino = diretorio.resolve(nomeArquivo);
                
                imagem.transferTo(destino);
                urls.add("/uploads/" + nomeArquivo);
            }
        } catch (IOException e) {
            throw new OperacaoInvalidaException("Falha crítica no sistema de arquivos ao salvar imagens: " + e.getMessage());
        }

        return urls;
    }

    private Path inicializarDiretorioUpload() throws IOException {
        Path diretorio = Paths.get(uploadDir);
        if (!Files.exists(diretorio)) {
            Files.createDirectories(diretorio);
        }
        return diretorio;
    }

    private String obterExtensao(String nomeOriginal) {
        if (nomeOriginal != null && nomeOriginal.contains(".")) {
            return nomeOriginal.substring(nomeOriginal.lastIndexOf(".")).toLowerCase();
        }
        return ".jpg";
    }

    private void validarExtensaoImagem(String extensao, String nomeOriginal) {
        if (!EXTENSOES_PERMITIDAS.contains(extensao)) {
            throw new OperacaoInvalidaException("O arquivo [" + nomeOriginal + "] possui uma extensão inválida. Apenas imagens são permitidas.");
        }
    }
}