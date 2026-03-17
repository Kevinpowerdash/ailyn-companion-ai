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
      {/* Video background */}
      <video
        className="absolute inset-0 w-full h-full object-cover opacity-25"
        src="/intro.mp4"
        autoPlay
        muted
        loop
        playsInline
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-sanctuary-deep/60" />

      {/* Floating leaves decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 rounded-full bg-sanctuary-sage/10"
            initial={{
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 800),
              y: -20,
            }}
            animate={{
              y: (typeof window !== 'undefined' ? window.innerHeight : 800) + 20,
              x: `+=${Math.random() * 100 - 50}`,
              rotate: 360,
            }}
            transition={{
              duration: 8 + Math.random() * 6,
              repeat: Infinity,
              delay: i * 1.5,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Content */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.img
          src="/logo.png"
          alt="AILYN"
          className="w-32 h-32 object-contain"
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        <h1 className="font-display text-4xl font-medium tracking-tighter text-sanctuary-bone text-center">
          Un espacio para ser, sin juicio.
        </h1>

        <p className="text-sanctuary-muted text-lg max-w-md text-center leading-relaxed">
          Acompañamiento Inteligente Liberador Y Nutritivo
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
            className="mt-4 rounded-full px-10"
          >
            <motion.span
              className="flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
            >
              🌿 Entrar
            </motion.span>
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default ThresholdScreen;
