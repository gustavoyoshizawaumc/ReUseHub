import { useState, useCallback } from "react";

interface Coordenadas {
  latitude: number;
  longitude: number;
}

interface EstadoLocalizacao {
  coordenadas: Coordenadas | null;
  carregando: boolean;
  erro: string | null;
}

export const useLocalizacao = () => {
  const [estado, setEstado] = useState<EstadoLocalizacao>({
    coordenadas: null,
    carregando: false,
    erro: null,
  });

  const obterLocalizacao = useCallback(() => {
    if (!navigator.geolocation) {
      setEstado((prev) => ({
        ...prev,
        erro: "Geolocalização não suportada pelo navegador",
      }));
      return;
    }

    setEstado({ coordenadas: null, carregando: true, erro: null });

    navigator.geolocation.getCurrentPosition(
      (posicao) => {
        setEstado({
          coordenadas: {
            latitude: posicao.coords.latitude,
            longitude: posicao.coords.longitude,
          },
          carregando: false,
          erro: null,
        });
      },
      () => {
        setEstado({
          coordenadas: null,
          carregando: false,
          erro: "Permissão de localização negada",
        });
      }
    );
  }, []);

  const limparLocalizacao = useCallback(() => {
    setEstado({ coordenadas: null, carregando: false, erro: null });
  }, []);

  return {
    coordenadas: estado.coordenadas,
    carregandoLocalizacao: estado.carregando,
    erroLocalizacao: estado.erro,
    obterLocalizacao,
    limparLocalizacao,
  };
};
