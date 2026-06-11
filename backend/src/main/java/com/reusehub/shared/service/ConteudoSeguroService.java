package com.reusehub.shared.service;

import com.reusehub.anuncio.exception.RegraNegocioException;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

@Service
public class ConteudoSeguroService {

    private static final Pattern MARCAS_DE_ACENTO = Pattern.compile("\\p{M}+");
    private static final Pattern CARACTERES_NAO_ALFANUMERICOS = Pattern.compile("[^a-z0-9]+");
    private static final Set<String> TERMOS_BLOQUEADOS = Set.of(
            "arrombado",
            "babaca",
            "besta",
            "boceta",
            "buceta",
            "bosta",
            "boiola",
            "burro",
            "cacete",
            "canalha",
            "caralho",
            "corno",
            "cu",
            "desgracado",
            "escroto",
            "fdp",
            "filho da puta",
            "foda",
            "foder",
            "fudido",
            "idiota",
            "imbecil",
            "infeliz",
            "lixo",
            "merda",
            "otario",
            "palhaco",
            "pau no cu",
            "piranha",
            "porra",
            "retardado",
            "ridiculo",
            "safado",
            "tapado",
            "trouxa",
            "vagabundo",
            "vai tomar no cu",
            "vtnc",
            "anta",
            "animal",
            "asno",
            "babao",
            "babaca do caralho",
            "bocal",
            "cuzao",
            "cusao",
            "cretino",
            "debil",
            "demente",
            "energumeno",
            "escoria",
            "estrume",
            "estupido",
            "feioso",
            "folgado",
            "fracassado",
            "gayzinho",
            "ignorante",
            "incapaz",
            "incompetente",
            "jumento",
            "lazarento",
            "maldito",
            "mongol",
            "nojento",
            "otario do caralho",
            "pau no seu cu",
            "paspalho",
            "pateta",
            "pau mandado",
            "pauzudo",
            "pauzao",
            "pirralho",
            "puta",
            "putinha",
            "puto",
            "rabudo",
            "sarnento",
            "seu merda",
            "seu lixo",
            "seu bosta",
            "seu idiota",
            "seu imbecil",
            "seu animal",
            "seu corno",
            "sifude",
            "tonto",
            "verme",
            "viado",
            "viadinho",
            "vagabunda",
            "vaca",
            "ze ruela",
            "ze mane"
    );

    public void validarTextoSeguro(String texto, String mensagemErro) {
        if (texto == null || texto.isBlank()) {
            return;
        }

        String textoNormalizado = normalizarParaFiltro(texto);
        String textoSemAcentos = removerAcentos(texto).toLowerCase(Locale.ROOT);
        for (String termo : TERMOS_BLOQUEADOS) {
            String termoNormalizado = normalizarParaFiltro(termo);
            String termoCompacto = normalizarCompacto(termo);
            boolean termoPermiteComparacaoCompacta = termoCompacto.length() >= 3;

            if (textoNormalizado.contains(termoNormalizado)
                    || (termoPermiteComparacaoCompacta && contemTermoOfuscado(textoSemAcentos, termoCompacto))) {
                throw new RegraNegocioException(mensagemErro);
            }
        }
    }

    private String normalizarParaFiltro(String texto) {
        String semAcentos = removerAcentos(texto);
        String normalizado = CARACTERES_NAO_ALFANUMERICOS
                .matcher(semAcentos.toLowerCase(Locale.ROOT))
                .replaceAll(" ")
                .trim()
                .replaceAll("\\s+", " ");
        return " " + normalizado + " ";
    }

    private String normalizarCompacto(String texto) {
        String semAcentos = removerAcentos(texto);
        return CARACTERES_NAO_ALFANUMERICOS
                .matcher(semAcentos.toLowerCase(Locale.ROOT))
                .replaceAll("");
    }

    private boolean contemTermoOfuscado(String texto, String termoCompacto) {
        StringBuilder regex = new StringBuilder("(?<![a-z0-9])");
        for (char caractere : termoCompacto.toCharArray()) {
            regex.append(Pattern.quote(String.valueOf(caractere))).append("[^a-z0-9]*");
        }
        regex.append("(?![a-z0-9])");
        return Pattern.compile(regex.toString()).matcher(texto).find();
    }

    private String removerAcentos(String texto) {
        return MARCAS_DE_ACENTO
                .matcher(Normalizer.normalize(texto, Normalizer.Form.NFD))
                .replaceAll("");
    }
}
