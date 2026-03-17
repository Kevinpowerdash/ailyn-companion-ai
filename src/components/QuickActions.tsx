import { motion } from "framer-motion";

interface QuickActionsProps {
  onSend: (text: string) => void;
  disabled: boolean;
}

const actions = [
  { label: "Estoy ansioso/a", emoji: "😮‍💨", message: "Estoy sintiéndome ansioso/a y necesito calmarme" },
  { label: "Necesito desahogarme", emoji: "💭", message: "Necesito desahogarme, ¿puedo contarte algo?" },
  { label: "Pensar en voz alta", emoji: "🧠", message: "Quiero pensar en voz alta sobre algo" },
];

const QuickActions = ({ onSend, disabled }: QuickActionsProps) => (
  <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
    {actions.map((action, i) => (
      <motion.button
        key={i}
        onClick={() => onSend(action.message)}
        disabled={disabled}
        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sanctuary-moss/30 border border-sanctuary-sage/10 text-sanctuary-muted/70 text-xs font-body hover:bg-sanctuary-moss/50 hover:text-sanctuary-bone/80 hover:border-sanctuary-sage/20 transition-all duration-300 disabled:opacity-40"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        <span>{action.emoji}</span>
        <span>{action.label}</span>
      </motion.button>
    ))}
  </div>
);

export default QuickActions;
