package com.reusehub.anuncio.service;

import com.reusehub.anuncio.dto.CategoriaRespostaDTO;
import com.reusehub.anuncio.repository.CategoriaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoriaService {

    private final CategoriaRepository categoriaRepository;

    public List<CategoriaRespostaDTO> listarCategoriasAtivas() {
        return categoriaRepository.findAllByAtivaTrueOrderByNomeAsc()
                .stream()
                .map(CategoriaRespostaDTO::deEntidade)
                .toList();
    }
}
