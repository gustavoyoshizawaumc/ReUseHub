package com.reusehub.anuncio.service;

import com.reusehub.anuncio.dto.BuscaFiltroDTO;
import com.reusehub.anuncio.dto.ResultadoGeocoding;
import com.reusehub.anuncio.exception.OperacaoInvalidaException;
import com.reusehub.anuncio.exception.RecursoNaoEncontradoException;
import com.reusehub.anuncio.model.Endereco;
import com.reusehub.anuncio.repository.EnderecoRepository;
import com.reusehub.auth.model.Usuario;
import com.reusehub.auth.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class LocalizacaoService {

    private static final Double RAIO_PADRAO_KM = 10.0;

    private final ViaCepService viaCepService;
    private final GeocodingHibridoService geocodingHibridoService;
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
            ResultadoGeocoding geocoding = converterCepEmCoordenadas(filtro.getCep());
            if (geocoding.possuiCoordenadas()) {
                filtro.setLatitude(geocoding.latitude().doubleValue());
                filtro.setLongitude(geocoding.longitude().doubleValue());
            }
        } catch (OperacaoInvalidaException | RecursoNaoEncontradoException e) {
            log.warn("Geocoding do CEP '{}' falhou; busca seguira sem filtro geografico: {}",
                    filtro.getCep(), e.getMessage());
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

    public ResultadoGeocoding converterCepEmCoordenadas(String cep) {
        ViaCepService.DadosCEP dadosCEP = viaCepService.buscarDadosCEP(cep);
        return geocodingHibridoService.obterCoordenadasPorEndereco(dadosCEP.paraEnderecoCompleto());
    }
}
