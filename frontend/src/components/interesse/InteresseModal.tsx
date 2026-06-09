import React, { useEffect, useState } from "react";
import * as anuncioService from "../../services/anuncioService";
import * as interesseService from "../../services/interesseService";
import type { Anuncio } from "../../types/anuncio.types";
import { useFeedback } from "../feedback/feedbackContext";

type InteresseModalProps = {
  open: boolean;
  onClose: () => void;
  anuncio: Anuncio;
  onSuccess?: () => void;
};

export const InteresseModal: React.FC<InteresseModalProps> = ({
  open,
  onClose,
  anuncio,
  onSuccess,
}) => {
  const [mensagem, setMensagem] = useState("");
  const [anuncioOferecidoId, setAnuncioOferecidoId] = useState("");
  const [meusAnuncios, setMeusAnuncios] = useState<Anuncio[]>([]);
  const [loadingAnuncios, setLoadingAnuncios] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { notify } = useFeedback();

  const isTroca = anuncio.tipo === "TROCA";

  useEffect(() => {
    const carregarMeusAnuncios = async () => {
      if (!open || !isTroca) return;

      try {
        setLoadingAnuncios(true);
        const resposta = await anuncioService.listarMeusAnuncios();
        setMeusAnuncios(
          (resposta.content ?? []).filter(
            (item: Anuncio) =>
              item.id !== anuncio.id &&
              item.status === "ATIVO" &&
              item.tipo === "TROCA"
          )
        );
      } catch {
        setMeusAnuncios([]);
      } finally {
        setLoadingAnuncios(false);
      }
    };

    carregarMeusAnuncios();
  }, [open, isTroca, anuncio.id]);

  useEffect(() => {
    if (!open) {
      // Reset do formulario quando o modal e fechado.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMensagem("");
      setAnuncioOferecidoId("");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!mensagem.trim()) {
      notify({
        variant: "warning",
        title: "Mensagem obrigatoria",
        message: "Escreva uma mensagem para enviar sua proposta.",
      });
      return;
    }

    if (isTroca && !anuncioOferecidoId) {
      notify({
        variant: "warning",
        title: "Escolha um anuncio",
        message: "Selecione qual anuncio voce quer oferecer na troca.",
      });
      return;
    }

    try {
      setSubmitting(true);

      await interesseService.criarInteresse({
        anuncioDesejadoId: anuncio.id,
        anuncioOferecidoId: isTroca ? anuncioOferecidoId : null,
        mensagem: mensagem.trim(),
      });

      notify({
        variant: "success",
        title: "Interesse enviado",
        message: "Sua proposta foi enviada ao anunciante.",
      });
      onClose();
      onSuccess?.();
    } catch (err) {
      notify({
        variant: "error",
        title: "Erro ao enviar interesse",
        message: err instanceof Error ? err.message : "Tente novamente em alguns instantes.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3 py-4">
      <div className="max-h-[calc(100svh-2rem)] w-full max-w-lg overflow-y-auto rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/10 sm:p-6">
        <h3 className="text-xl font-bold text-slate-900 mb-2">
          {isTroca ? "Quero trocar" : "Tenho interesse"}
        </h3>

        <p className="text-sm text-slate-500 mb-4">
          Envie uma proposta para o anunciante de <strong>{anuncio.titulo}</strong>.
        </p>

        {isTroca && (
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Qual anúncio você quer oferecer?
            </label>

            <select
              value={anuncioOferecidoId}
              onChange={(e) => setAnuncioOferecidoId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
              disabled={loadingAnuncios}
            >
              <option value="">
                {loadingAnuncios ? "Carregando seus anúncios..." : "Selecione um anúncio"}
              </option>
              {meusAnuncios.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.titulo}
                </option>
              ))}
            </select>
            {!loadingAnuncios && meusAnuncios.length === 0 && (
              <p className="mt-2 text-xs font-semibold text-orange-700">
                Você precisa ter um anúncio de troca publicado para enviar uma proposta.
              </p>
            )}
          </div>
        )}

        <div className="mb-5">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Mensagem
          </label>
          <textarea
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            rows={5}
            className="w-full rounded-lg border border-slate-200 px-4 py-3 outline-none resize-none focus:ring-2 focus:ring-blue-200"
            placeholder="Escreva sua proposta..."
          />
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-slate-100 px-5 py-3 font-bold text-slate-700 sm:w-auto"
            disabled={submitting}
          >
            Cancelar
          </button>

          <button
            onClick={handleSubmit}
            disabled={submitting || (isTroca && meusAnuncios.length === 0)}
            className="w-full rounded-lg bg-blue-600 px-5 py-3 font-bold text-white disabled:opacity-60 sm:w-auto"
          >
            {submitting ? "Enviando..." : "Enviar proposta"}
          </button>
        </div>
      </div>
    </div>
  );
};
