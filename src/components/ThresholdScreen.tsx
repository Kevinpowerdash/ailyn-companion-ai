import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface ThresholdScreenProps {
  onEnter: () => void;
}

const ThresholdScreen = ({ onEnter }: ThresholdScreenProps) => {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center sanctuary-gradient-animated"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Video background */}
      <video
        className="absolute inset-0 w-full h-full object-cover opacity-30"
        src="/intro.mp4"
        autoPlay
        muted
        loop
        playsInline
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-sanctuary-deep/60" />

      {/* Content */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <img
          src="/logo.png"
          alt="AILYN"
          className="w-32 h-32 object-contain opacity-90"
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
            className="mt-4 rounded-full px-10 breathing"
          >
            Entrar
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default ThresholdScreen;
