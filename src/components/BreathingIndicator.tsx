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
          className="w-2 h-2 rounded-full bg-sanctuary-sage/70"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 1, 0.5],
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
    <span className="text-sanctuary-muted/70 text-sm font-body">AILYN está presente…</span>
  </motion.div>
);

export default BreathingIndicator;
