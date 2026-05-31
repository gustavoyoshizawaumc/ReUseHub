package com.reusehub.admin.dto;

import java.util.List;

public record AdminDashboardDTO(
        long totalUsuarios,
        long usuariosAtivos,
        long usuariosBanidos,
        long totalAnuncios,
        long anunciosAtivos,
        long anunciosPendentes,
        long anunciosReprovados,
        long anunciosConcluidos,
        long anunciosDoacao,
        long anunciosTroca,
        long denunciasAbertas,
        long denunciasResolvidas,
        List<SerieDTO> usuariosPorMes,
        List<SerieDTO> concluidosPorMes,
        List<SerieComparativaDTO> anunciosCriadosPorMes,
        List<SerieComparativaDTO> denunciasPorMes,
        List<ItemRankingDTO> anunciosMaisVisualizados,
        List<ItemRankingDTO> usuariosMelhorReputacao,
        List<ItemRankingDTO> categoriasComMaisAnuncios
) {
    public record SerieDTO(String label, long valor) {
    }

    public record SerieComparativaDTO(String label, long primeiroValor, long segundoValor) {
    }

    public record ItemRankingDTO(String id, String label, Number valor) {
    }
}
