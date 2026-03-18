interface GuidedSessionsProps {
  onSelect: (message: string) => void;
  disabled?: boolean;
}

const sessions = [
  {
    emoji: "🌍",
    label: "Grounding 5-4-3-2-1",
    message: "Guíame en un ejercicio de grounding 5-4-3-2-1 para conectar con el presente",
  },
  {
    emoji: "🌬️",
    label: "Respiración 4-7-8",
    message: "Guíame paso a paso en la técnica de respiración 4-7-8",
  },
  {
    emoji: "💜",
    label: "Autocompasión",
    message: "Guíame en un ejercicio breve de autocompasión estilo Kristin Neff",
  },
  {
    emoji: "🏔️",
    label: "Lugar seguro",
    message: "Ayúdame a visualizar mi lugar seguro con una guía breve y calmada",
  },
  {
    emoji: "🌙",
    label: "Cierre con gratitud",
    message: "Guíame en un cierre de día con gratitud y liberación emocional",
  },
];

const GuidedSessions = ({ onSelect, disabled }: GuidedSessionsProps) => {
  return (
    <div className="space-y-2">
      <p className="text-[var(--sanctuary-muted)] text-xs font-medium uppercase tracking-wider">
        Sesiones guiadas
      </p>
      {sessions.map((s, i) => (
        <button
          key={i}
          onClick={() => onSelect(s.message)}
          disabled={disabled}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-body transition-all duration-300 disabled:opacity-30 text-left"
          style={{
            background: "var(--sanctuary-moss)",
            color: "var(--sanctuary-bone)",
            opacity: 0.7,
            border: "1px solid transparent",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "1";
            e.currentTarget.style.borderColor = "var(--sanctuary-sage)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "0.7";
            e.currentTarget.style.borderColor = "transparent";
          }}
        >
          <span className="text-base">{s.emoji}</span>
          <span>{s.label}</span>
        </button>
      ))}
    </div>
  );
};

export default GuidedSessions;
