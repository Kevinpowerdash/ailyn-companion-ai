import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface UsernameScreenProps {
  onSubmit: (name: string) => void;
}

const UsernameScreen = ({ onSubmit }: UsernameScreenProps) => {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) onSubmit(name.trim());
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center sanctuary-gradient-animated"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.form
        onSubmit={handleSubmit}
        className="flex flex-col items-center gap-6 w-full max-w-sm px-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <h2 className="font-display text-2xl font-medium tracking-tight text-sanctuary-bone">
          ¿Cómo te llamas?
        </h2>
        <p className="text-sanctuary-muted text-sm text-center leading-relaxed">
          Tu nombre nos ayuda a hacer este espacio más personal.
        </p>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tu nombre..."
          autoFocus
          className="w-full bg-sanctuary-moss/60 border border-sanctuary-sage/10 rounded-xl px-4 py-3 text-sanctuary-bone placeholder:text-sanctuary-muted/50 focus:outline-none focus:border-sanctuary-sage/30 transition-colors font-body"
        />

        <Button
          type="submit"
          variant="sanctuary-solid"
          size="lg"
          disabled={!name.trim()}
          className="w-full rounded-xl"
        >
          Continuar
        </Button>
      </motion.form>
    </motion.div>
  );
};

export default UsernameScreen;
