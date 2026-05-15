package com.reusehub.anuncio.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class StorageService {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    public List<String> salvarImagens(List<MultipartFile> imagens) {
        List<String> urls = new ArrayList<>();

        try {
            Path diretorio = Paths.get(uploadDir);
            if (!Files.exists(diretorio)) {
                Files.createDirectories(diretorio);
            }

            for (MultipartFile imagem : imagens) {
                String extensao = obterExtensao(imagem.getOriginalFilename());
                String nomeArquivo = UUID.randomUUID() + extensao;
                Path destino = diretorio.resolve(nomeArquivo);
                imagem.transferTo(destino);
                urls.add("/uploads/" + nomeArquivo);
            }
        } catch (IOException e) {
            throw new RuntimeException("Erro ao salvar imagens: " + e.getMessage());
        }

        return urls;
    }

    private String obterExtensao(String nomeOriginal) {
        if (nomeOriginal != null && nomeOriginal.contains(".")) {
            return nomeOriginal.substring(nomeOriginal.lastIndexOf("."));
        }
        return ".jpg";
    }
}