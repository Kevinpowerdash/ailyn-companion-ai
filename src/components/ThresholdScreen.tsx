import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface ThresholdScreenProps {
  onEnter: () => void;
}

const ThresholdScreen = ({ onEnter }: ThresholdScreenProps) => {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center sanctuary-gradient-animated overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Drifting orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${6 + Math.random() * 14}px`,
              height: `${6 + Math.random() * 14}px`,
              background: "radial-gradient(circle, rgba(232,210,160,0.6) 0%, rgba(232,210,160,0) 70%)",
              filter: "blur(1px)",
            }}
            initial={{
              x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 800),
              y: (typeof window !== "undefined" ? window.innerHeight : 800) + 20,
            }}
            animate={{
              y: -40,
              x: `+=${Math.random() * 120 - 60}`,
            }}
            transition={{
              duration: 10 + Math.random() * 8,
              repeat: Infinity,
              delay: i * 1.2,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Content */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-7 px-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Lumina sigil — a luminous drop */}
        <motion.div
          className="relative w-28 h-28 flex items-center justify-center"
          animate={{ opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="absolute inset-0 rounded-full lumina-halo" />
          <div
            className="relative w-20 h-20 rounded-full"
            style={{
              background:
                "radial-gradient(circle at 35% 30%, #ffffff 0%, #f5e7c0 40%, #c9a24a 100%)",
              boxShadow: "inset -4px -6px 12px rgba(120,90,30,0.2), inset 6px 8px 14px rgba(255,255,255,0.6)",
            }}
          />
        </motion.div>

        <div className="flex flex-col items-center gap-2">
          <span
            className="font-display italic text-xs tracking-[0.4em] uppercase opacity-60"
            style={{ color: "var(--sanctuary-muted)" }}
          >
            Soy
          </span>
          <h1
            className="font-display text-6xl md:text-7xl tracking-tight text-center"
            style={{ color: "var(--sanctuary-bone)" }}
          >
            Lumina
          </h1>
        </div>

        <p
          className="text-lg max-w-md text-center leading-relaxed font-display italic"
          style={{ color: "var(--sanctuary-muted)" }}
        >
          Una presencia que escucha,<br />una luz que acompaña.
        </p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          <Button
            variant="sanctuary-solid"
            size="lg"
            onClick={onEnter}
            className="mt-2 rounded-full px-12 sage-glow"
          >
            <motion.span className="flex items-center gap-2" whileHover={{ scale: 1.02 }}>
              ✦ Entrar al espacio
            </motion.span>
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default ThresholdScreen;
