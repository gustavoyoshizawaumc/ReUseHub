import React, { useState } from "react";
import { Star } from "lucide-react";
import { criarAvaliacao } from "../../services/avaliacaoService";

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

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      await criarAvaliacao({
        anuncioId,
        avaliadoId,
        nota,
        comentario: comentario.trim() || undefined,
      });
      alert("Avaliação enviada com sucesso!");
      onSuccess?.();
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao enviar avaliação");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-lg p-6 shadow-lg">
        <h3 className="text-xl font-bold text-slate-900 mb-2">Avaliar negociação</h3>
        <p className="text-sm text-slate-500 mb-5">
          Conte como foi sua experiência com <strong>{avaliadoNome}</strong>.
        </p>

        <div className="flex gap-2 mb-5">
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

        <div className="flex justify-end gap-3 mt-5">
          <button
            onClick={onClose}
            className="px-5 py-3 rounded-lg bg-slate-100 text-slate-700 font-bold"
            disabled={submitting}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-3 rounded-lg bg-blue-600 text-white font-bold disabled:opacity-60"
          >
            {submitting ? "Enviando..." : "Enviar avaliação"}
          </button>
        </div>
      </div>
    </div>
  );
};
