package com.reusehub.anuncio.service;

import com.reusehub.anuncio.dto.BuscaFiltroDTO;
import com.reusehub.anuncio.model.Endereco;
import com.reusehub.anuncio.repository.EnderecoRepository;
import com.reusehub.auth.model.Usuario;
import com.reusehub.auth.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class LocalizacaoService {

    private static final Double RAIO_PADRAO_KM = 10.0;

    private final ViaCepService viaCepService;
    private final NominatimService nominatimService;
    private final UsuarioRepository usuarioRepository;
    private final EnderecoRepository enderecoRepository;

    public void resolverLocalizacaoEmCascata(BuscaFiltroDTO filtro, String emailUsuario) {
        if (filtro.possuiCoordenadas()) {
            aplicarRaioPadraoSeAusente(filtro);
            return;
        }

        if (filtro.possuiCep()) {
            resolverCoordenadasPorCepInformado(filtro);
            aplicarRaioPadraoSeAusente(filtro);
            return;
        }

        if (emailUsuario != null) {
            resolverCoordenadasPorEnderecoPrincipal(filtro, emailUsuario);
        }
    }

    private void resolverCoordenadasPorCepInformado(BuscaFiltroDTO filtro) {
        try {
            NominatimService.Coordenadas coordenadas = converterCepEmCoordenadas(filtro.getCep());
            filtro.setLatitude(coordenadas.latitude());
            filtro.setLongitude(coordenadas.longitude());
        } catch (Exception ignored) {
            // Falha silenciosa: busca prossegue sem filtro geográfico
        }
    }

    private void resolverCoordenadasPorEnderecoPrincipal(BuscaFiltroDTO filtro, String emailUsuario) {
        Optional<Endereco> enderecoPrincipal = buscarEnderecoPrincipalDoUsuario(emailUsuario);

        if (enderecoPrincipal.isEmpty()) {
            return;
        }

        Endereco endereco = enderecoPrincipal.get();

        if (possuiCoordenadasValidas(endereco)) {
            filtro.setLatitude(endereco.getLatitude().doubleValue());
            filtro.setLongitude(endereco.getLongitude().doubleValue());
            aplicarRaioPadraoSeAusente(filtro);
        }
    }

    private Optional<Endereco> buscarEnderecoPrincipalDoUsuario(String emailUsuario) {
        return usuarioRepository.findByEmail(emailUsuario)
                .flatMap(usuario -> enderecoRepository.findFirstByUsuarioIdAndPrincipalTrue(usuario.getId()));
    }

    private boolean possuiCoordenadasValidas(Endereco endereco) {
        return endereco.getLatitude() != null
                && endereco.getLongitude() != null
                && endereco.getLatitude().doubleValue() != 0.0
                && endereco.getLongitude().doubleValue() != 0.0;
    }

    private void aplicarRaioPadraoSeAusente(BuscaFiltroDTO filtro) {
        if (filtro.getRaioKm() == null) {
            filtro.setRaioKm(RAIO_PADRAO_KM);
        }
    }

    public NominatimService.Coordenadas converterCepEmCoordenadas(String cep) {
        ViaCepService.DadosCEP dadosCEP = viaCepService.buscarDadosCEP(cep);
        String enderecoTextual = montarEnderecoTextualParaBusca(dadosCEP);
        return nominatimService.buscarCoordenadasPorEndereco(enderecoTextual);
    }

    private String montarEnderecoTextualParaBusca(ViaCepService.DadosCEP dadosCEP) {
        return String.format("%s, %s, %s, Brasil",
                dadosCEP.bairro(),
                dadosCEP.cidade(),
                dadosCEP.uf()
        );
    }
}