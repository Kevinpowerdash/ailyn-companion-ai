import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface DisclaimerScreenProps {
  onAccept: () => void;
}

const DisclaimerScreen = ({ onAccept }: DisclaimerScreenProps) => {
  const [accepted, setAccepted] = useState(false);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center sanctuary-gradient-animated"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="flex flex-col gap-6 w-full max-w-md px-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <h2
          className="font-display text-3xl tracking-tight text-center"
          style={{ color: "var(--sanctuary-bone)" }}
        >
          Antes de comenzar
        </h2>

        <div
          className="rounded-2xl p-5 space-y-3 lumina-halo"
          style={{
            background: "var(--sanctuary-moss)",
            border: "1px solid rgba(var(--particle-color, 232,210,160), 0.25)",
          }}
        >
          <p className="text-sm leading-relaxed font-body" style={{ color: "var(--sanctuary-bone)", opacity: 0.85 }}>
            Soy <strong style={{ color: "var(--sanctuary-sage)" }}>Lumina</strong>, una entidad digital
            de escucha y acompañamiento. <strong>No sustituyo</strong> la atención de un profesional de salud mental.
          </p>
          <p className="text-sm leading-relaxed font-body" style={{ color: "var(--sanctuary-bone)", opacity: 0.85 }}>
            No emito diagnósticos ni prescribo tratamientos, y no debo ser tu única vía en situaciones de crisis.
            Si lo necesitas, busca a un especialista humano.
          </p>
          <p className="text-xs leading-relaxed font-body" style={{ color: "var(--sanctuary-muted)" }}>
            Nuestras conversaciones se guardan en este dispositivo para mantener contexto.
            Puedes limpiar la memoria cuando quieras.
          </p>
        </div>

        <label className="flex items-start gap-3 cursor-pointer group">
          <div
            onClick={() => setAccepted(!accepted)}
            className="mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-300"
            style={{
              background: accepted ? "var(--sanctuary-sage)" : "transparent",
              borderColor: accepted ? "var(--sanctuary-sage)" : "rgba(var(--particle-color, 232,210,160), 0.45)",
            }}
          >
            {accepted && (
              <svg className="w-3 h-3" style={{ color: "var(--sanctuary-deep)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <span className="text-sm font-body leading-relaxed" style={{ color: "var(--sanctuary-bone)", opacity: 0.75 }}>
            Entiendo que Lumina es una presencia de apoyo, no un sustituto profesional.
          </span>
        </label>

        <Button
          variant="sanctuary-solid"
          size="lg"
          disabled={!accepted}
          onClick={onAccept}
          className={`w-full rounded-xl transition-all duration-500 ${accepted ? "opacity-100 sage-glow" : "opacity-40"}`}
        >
          Aceptar y continuar ✦
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default DisclaimerScreen;
