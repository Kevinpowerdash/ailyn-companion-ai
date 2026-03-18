import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const emotions = [
  { emoji: "😤", label: "Frustrado/a", technique: "Técnica 3-3-3: Nombra 3 cosas que ves, 3 que oyes, 3 que sientes." },
  { emoji: "🥺", label: "Vulnerable", technique: "Repite: 'Es válido sentirme así. No necesito ser fuerte todo el tiempo.'" },
  { emoji: "😰", label: "Abrumado/a", technique: "Grounding 5-4-3-2-1: 5 ves, 4 tocas, 3 oyes, 2 hueles, 1 saboreas." },
  { emoji: "🌟", label: "Esperanzado/a", technique: "Escribe una cosa que esperas con ilusión esta semana." },
  { emoji: "😶", label: "Vacío/a", technique: "A veces el vacío es descanso. Respira 3 veces profundo sin esperar nada." },
  { emoji: "💪", label: "Determinado/a", technique: "Canaliza esa energía: ¿qué pequeño paso puedes dar ahora mismo?" },
  { emoji: "😔", label: "Nostálgico/a", technique: "Honra ese recuerdo. ¿Qué te enseñó ese momento?" },
  { emoji: "🤯", label: "Confuso/a", technique: "Escribe en una línea qué te confunde. Verlo escrito aclara." },
  { emoji: "😌", label: "En paz", technique: "Saborea este momento. Inhala 4s, sostén 7s, exhala 8s." },
  { emoji: "💔", label: "Herido/a", technique: "Pon tu mano en el pecho. Di: 'Este dolor pasará, y yo seguiré aquí.'" },
  { emoji: "🙃", label: "Irónico/a", technique: "A veces reír de lo absurdo es válido. ¿Qué te parece ridículo hoy?" },
  { emoji: "🥰", label: "Agradecido/a", technique: "Nombra 3 cosas por las que sientes gratitud ahora mismo." },
];

interface EmotionWheelProps {
  onSelect: (message: string) => void;
  disabled?: boolean;
}

const EmotionWheel = ({ onSelect, disabled }: EmotionWheelProps) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="space-y-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-body transition-all duration-300 text-left"
        style={{
          background: expanded ? "var(--sanctuary-sage)" + "15" : "var(--sanctuary-moss)",
          color: "var(--sanctuary-bone)",
          opacity: expanded ? 1 : 0.7,
          border: `1px solid ${expanded ? "var(--sanctuary-sage)" + "30" : "transparent"}`,
        }}
      >
        <span>🎭</span>
        <span>Rueda de Emociones</span>
        <span className="ml-auto text-xs" style={{ opacity: 0.4 }}>{expanded ? "▲" : "▼"}</span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              {emotions.map((e) => (
                <button
                  key={e.label}
                  onClick={() => {
                    onSelect(`Me siento ${e.label.toLowerCase()}. ${e.technique}`);
                    setExpanded(false);
                  }}
                  disabled={disabled}
                  className="flex flex-col items-center gap-0.5 p-2 rounded-lg transition-all duration-200 hover:scale-105 disabled:opacity-30"
                  style={{ background: "var(--sanctuary-moss)" }}
                  title={e.technique}
                >
                  <span className="text-lg">{e.emoji}</span>
                  <span className="text-[9px]" style={{ color: "var(--sanctuary-muted)" }}>{e.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmotionWheel;
