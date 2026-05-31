package com.reusehub.anuncio.service;

import com.reusehub.anuncio.exception.OperacaoInvalidaException;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
public class StorageService {

    private static final List<String> EXTENSOES_PERMITIDAS = Arrays.asList(
            ".jpg", ".jpeg", ".jfif", ".png", ".webp", ".gif", ".bmp"
    );
    private static final String EXTENSAO_PADRAO = ".jpg";
    private static final String FORMATO_URL_S3 = "https://%s.s3.%s.amazonaws.com/%s";

    @Value("${aws.s3.bucket:reusehub-uploads}")
    private String bucketName;

    @Value("${aws.s3.region:us-east-2}")
    private String region;

    @Value("${aws.access-key-id:test-access-key}")
    private String accessKeyId;

    @Value("${aws.secret-access-key:test-secret-key}")
    private String secretAccessKey;

    private S3Client s3Client;

    @PostConstruct
    public void inicializar() {
        this.s3Client = construirClienteS3();
    }

    public List<String> salvarImagens(List<MultipartFile> imagens) {
        List<String> urls = new ArrayList<>();
        if (imagens == null || imagens.isEmpty()) {
            return urls;
        }

        for (MultipartFile imagem : imagens) {
            if (imagem.isEmpty()) continue;
            urls.add(enviarImagemParaS3(imagem));
        }

        return urls;
    }

    /**
     * Remove uma imagem do S3 a partir da URL publica armazenada no banco.
     * Falhas de remocao sao toleradas (defesa em profundidade): a imagem ja
     * foi desreferenciada no banco, entao um orfao no S3 nao quebra o usuario.
     */
    public void excluirImagem(String urlImagem) {
        if (urlImagem == null || urlImagem.isBlank()) {
            return;
        }

        String chaveDoObjeto = extrairChaveDaUrl(urlImagem);
        if (chaveDoObjeto == null) {
            return;
        }

        try {
            s3Client.deleteObject(DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(chaveDoObjeto)
                    .build());
        } catch (RuntimeException ignored) {
            // Orfaos no S3 sao aceitaveis; nao bloqueamos a operacao do usuario.
        }
    }

    private String extrairChaveDaUrl(String urlImagem) {
        try {
            String caminho = new URI(urlImagem).getPath();
            if (caminho == null || caminho.length() <= 1) {
                return null;
            }
            return caminho.startsWith("/") ? caminho.substring(1) : caminho;
        } catch (URISyntaxException e) {
            return null;
        }
    }

    private S3Client construirClienteS3() {
        AwsBasicCredentials credenciais = AwsBasicCredentials.create(accessKeyId, secretAccessKey);
        return S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(credenciais))
                .build();
    }

    private String enviarImagemParaS3(MultipartFile imagem) {
        String nomeOriginal = imagem.getOriginalFilename();
        String extensao = obterExtensao(nomeOriginal);
        validarExtensaoImagem(extensao, nomeOriginal);

        String nomeArquivo = gerarNomeUnico(extensao);
        executarUpload(nomeArquivo, imagem);
        return construirUrlPublica(nomeArquivo);
    }

    private void executarUpload(String nomeArquivo, MultipartFile imagem) {
        try {
            PutObjectRequest requisicao = construirRequisicaoUpload(nomeArquivo, imagem.getContentType());
            s3Client.putObject(requisicao, RequestBody.fromBytes(imagem.getBytes()));
        } catch (IOException e) {
            throw new OperacaoInvalidaException("Falha ao ler o arquivo de imagem: " + e.getMessage());
        } catch (RuntimeException e) {
            throw new OperacaoInvalidaException("Falha ao enviar imagem para o S3: " + e.getMessage());
        }
    }

    private PutObjectRequest construirRequisicaoUpload(String nomeArquivo, String contentType) {
        return PutObjectRequest.builder()
                .bucket(bucketName)
                .key(nomeArquivo)
                .contentType(contentType)
                .build();
    }

    private String gerarNomeUnico(String extensao) {
        return UUID.randomUUID() + extensao;
    }

    private String construirUrlPublica(String nomeArquivo) {
        return String.format(FORMATO_URL_S3, bucketName, region, nomeArquivo);
    }

    private String obterExtensao(String nomeOriginal) {
        if (nomeOriginal != null && nomeOriginal.contains(".")) {
            return nomeOriginal.substring(nomeOriginal.lastIndexOf(".")).toLowerCase();
        }
        return EXTENSAO_PADRAO;
    }

    private void validarExtensaoImagem(String extensao, String nomeOriginal) {
        if (!EXTENSOES_PERMITIDAS.contains(extensao)) {
            throw new OperacaoInvalidaException(
                    "O arquivo [" + nomeOriginal + "] possui uma extensão inválida. Apenas imagens são permitidas."
            );
        }
    }
}
