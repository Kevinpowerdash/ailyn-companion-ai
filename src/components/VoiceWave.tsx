import { motion } from "framer-motion";

const VoiceWave = () => (
  <div className="flex items-center gap-0.5 ml-1">
    {[0, 1, 2, 3, 4].map((i) => (
      <motion.div
        key={i}
        className="w-0.5 bg-sanctuary-sage/60 rounded-full"
        animate={{
          height: [4, 12, 4],
        }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          delay: i * 0.1,
          ease: "easeInOut",
        }}
      />
    ))}
  </div>
);

export default VoiceWave;
