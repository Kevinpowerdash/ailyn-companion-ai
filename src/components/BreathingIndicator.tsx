import { motion } from "framer-motion";

const BreathingIndicator = () => (
  <motion.div
    className="flex items-center gap-3 py-3 px-1"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.4 }}
  >
    <div className="flex items-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full"
          style={{ background: "var(--sanctuary-sage)", opacity: 0.7 }}
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.3,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
    <span className="text-sm font-body italic" style={{ color: "var(--sanctuary-muted)", opacity: 0.8 }}>Lumina respira…</span>
  </motion.div>
);

export default BreathingIndicator;
