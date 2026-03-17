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
        <h2 className="font-display text-2xl font-medium tracking-tight text-sanctuary-bone text-center">
          Antes de comenzar
        </h2>

        <div className="bg-sanctuary-moss/40 border border-sanctuary-sage/10 rounded-2xl p-5 space-y-3">
          <p className="text-sanctuary-bone/80 text-sm leading-relaxed font-body">
            AILYN es un asistente de acompañamiento emocional basado en inteligencia artificial. 
            <strong className="text-sanctuary-sage"> No sustituye</strong> la atención de un profesional de salud mental.
          </p>
          <p className="text-sanctuary-bone/80 text-sm leading-relaxed font-body">
            No emite diagnósticos, no prescribe tratamientos y no debe ser usada en situaciones de crisis. 
            Si necesitas ayuda profesional, contacta a un especialista.
          </p>
          <p className="text-sanctuary-muted text-xs leading-relaxed font-body">
            Tus conversaciones se guardan temporalmente para mantener contexto. 
            Puedes limpiar tu memoria en cualquier momento.
          </p>
        </div>

        <label className="flex items-start gap-3 cursor-pointer group">
          <div
            onClick={() => setAccepted(!accepted)}
            className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-300 ${
              accepted
                ? "bg-sanctuary-sage border-sanctuary-sage"
                : "border-sanctuary-sage/30 group-hover:border-sanctuary-sage/50"
            }`}
          >
            {accepted && (
              <svg className="w-3 h-3 text-sanctuary-deep" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <span className="text-sanctuary-bone/70 text-sm font-body leading-relaxed">
            Entiendo y acepto que AILYN es una herramienta de apoyo, no un sustituto profesional.
          </span>
        </label>

        <Button
          variant="sanctuary-solid"
          size="lg"
          disabled={!accepted}
          onClick={onAccept}
          className={`w-full rounded-xl transition-all duration-500 ${
            accepted ? "opacity-100 sage-glow" : "opacity-40"
          }`}
        >
          Aceptar y continuar
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default DisclaimerScreen;
