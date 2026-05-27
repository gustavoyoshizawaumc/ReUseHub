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
        List<ItemRankingDTO> anunciosMaisVisualizados,
        List<ItemRankingDTO> usuariosMelhorReputacao
) {
    public record SerieDTO(String label, long valor) {
    }

    public record ItemRankingDTO(String id, String label, Number valor) {
    }
}
