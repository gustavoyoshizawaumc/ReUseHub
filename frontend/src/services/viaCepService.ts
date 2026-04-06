import type { DadosCEP } from "../types/anuncio.types";

const VIACEP_API = "https://viacep.com.br/ws";

export const buscarEnderecoPorCEP = async (cep: string): Promise<DadosCEP> => {
  try {
    const cepFormatado = cep.replace(/\D/g, "");

    if (cepFormatado.length !== 8) {
      throw new Error("CEP deve conter 8 dígitos");
    }

    const response = await fetch(`${VIACEP_API}/${cepFormatado}/json/`);

    if (!response.ok) {
      throw new Error("Erro ao buscar CEP");
    }

    const dados = await response.json();

    if (dados.erro) {
      throw new Error("CEP não encontrado");
    }

    return {
      cep: dados.cep,
      rua: dados.logradouro,
      bairro: dados.bairro,
      cidade: dados.localidade,
      uf: dados.uf,
    };
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Erro ao buscar CEP",
    );
  }
};
