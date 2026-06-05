import React, { useState } from "react";
import { Star } from "lucide-react";
import { criarAvaliacao } from "../../services/avaliacaoService";
import { useFeedback } from "../feedback/FeedbackProvider";

type AvaliacaoModalProps = {
  open: boolean;
  onClose: () => void;
  anuncioId: string;
  avaliadoId: string;
  avaliadoNome: string;
  onSuccess?: () => void;
};

export const AvaliacaoModal: React.FC<AvaliacaoModalProps> = ({
  open,
  onClose,
  anuncioId,
  avaliadoId,
  avaliadoNome,
  onSuccess,
}) => {
  const [nota, setNota] = useState(5);
  const [comentario, setComentario] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { notify } = useFeedback();

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      await criarAvaliacao({
        anuncioId,
        avaliadoId,
        nota,
        comentario: comentario.trim() || undefined,
      });
      notify({
        variant: "success",
        title: "Avaliacao enviada",
        message: "Obrigado pelo feedback. A reputacao do usuario foi atualizada.",
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      notify({
        variant: "error",
        title: "Erro ao enviar avaliacao",
        message: err instanceof Error ? err.message : "Tente novamente em alguns instantes.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3 py-4">
      <div className="max-h-[calc(100svh-2rem)] w-full max-w-md overflow-y-auto rounded-lg bg-white p-5 shadow-lg sm:p-6">
        <h3 className="text-xl font-bold text-slate-900 mb-2">Avaliar negociação</h3>
        <p className="text-sm text-slate-500 mb-5">
          Conte como foi sua experiência com <strong>{avaliadoNome}</strong>.
        </p>

        <div className="mb-5 flex justify-between gap-1 sm:justify-start sm:gap-2">
          {[1, 2, 3, 4, 5].map((valor) => (
            <button
              key={valor}
              type="button"
              onClick={() => setNota(valor)}
              className="p-1 text-orange-500"
              aria-label={`${valor} estrela${valor > 1 ? "s" : ""}`}
            >
              <Star size={28} fill={valor <= nota ? "currentColor" : "none"} />
            </button>
          ))}
        </div>

        <textarea
          value={comentario}
          onChange={(event) => setComentario(event.target.value)}
          rows={4}
          className="w-full rounded-lg border border-slate-200 px-4 py-3 outline-none resize-none focus:ring-2 focus:ring-blue-200"
          placeholder="Comentário opcional"
        />

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-slate-100 px-5 py-3 font-bold text-slate-700 sm:w-auto"
            disabled={submitting}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full rounded-lg bg-blue-600 px-5 py-3 font-bold text-white disabled:opacity-60 sm:w-auto"
          >
            {submitting ? "Enviando..." : "Enviar avaliação"}
          </button>
        </div>
      </div>
    </div>
  );
};
