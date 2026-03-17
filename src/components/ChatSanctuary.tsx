import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, RotateCcw, Mic, Volume2, VolumeX, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import ChatMessage from "./ChatMessage";
import BreathingIndicator from "./BreathingIndicator";
import LeafParticles from "./LeafParticles";
import QuickActions from "./QuickActions";
import VoiceWave from "./VoiceWave";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

interface ChatSanctuaryProps {
  username: string;
  onReset: () => void;
}

const ChatSanctuary = ({ username, onReset }: ChatSanctuaryProps) => {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: `Estoy aquí, ${username}. ¿Qué tienes en mente? 🌿` },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [showDailySuggestion, setShowDailySuggestion] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Daily suggestion (once per session)
  useEffect(() => {
    const lastShown = sessionStorage.getItem("ailyn_daily_shown");
    if (!lastShown) {
      const timer = setTimeout(() => setShowDailySuggestion(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismissDailySuggestion = () => {
    setShowDailySuggestion(false);
    sessionStorage.setItem("ailyn_daily_shown", "true");
  };

  const speak = useCallback((text: string) => {
    if (!ttsEnabled || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-ES";
    utterance.rate = 0.95;
    utterance.pitch = 1.05;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [ttsEnabled]);

  const sendMessage = async (text?: string) => {
    const msgText = (text || input).trim();
    if (!msgText || isLoading) return;

    const userMsg: Msg = { role: "user", content: msgText };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("chat-with-ailyn", {
        body: { messages: newMessages, username },
      });

      if (error) throw error;

      if (data?.error) {
        if (data.error.includes("Rate limit") || data.error.includes("429")) {
          toast.error("Demasiadas solicitudes. Espera un momento.");
        } else {
          toast.error(data.error);
        }
        return;
      }

      const reply = data?.reply || "Estoy aquí, pero no pude procesar tu mensaje. Intenta de nuevo.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      speak(reply);
    } catch (e: any) {
      console.error("Chat error:", e);
      toast.error("No se pudo conectar. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const toggleListening = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      toast.error("Tu navegador no soporta reconocimiento de voz.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "es-ES";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setIsListening(false);
      sendMessage(transcript);
    };

    recognition.onerror = () => {
      setIsListening(false);
      toast.error("No se pudo capturar tu voz. Intenta de nuevo.");
    };

    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const clearMemory = async () => {
    try {
      await supabase.functions.invoke("chat-with-ailyn", {
        body: { action: "clear", username },
      });
      setMessages([
        { role: "assistant", content: `Hemos comenzado de nuevo, ${username}. Estoy aquí. 🌿` },
      ]);
      toast.success("Memoria limpiada");
    } catch {
      toast.error("Error al limpiar la memoria");
    }
  };

  const saveConversation = () => {
    const text = messages
      .map((m) => `${m.role === "user" ? username : "AILYN"}: ${m.content}`)
      .join("\n\n");
    const blob = new Blob([`Conversación con AILYN 🌿\nFecha: ${new Date().toLocaleDateString("es-ES")}\n\n${text}`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ailyn-conversacion-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Conversación guardada");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <motion.div
      className="fixed inset-0 flex flex-col sanctuary-gradient-animated"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <LeafParticles />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-5 py-4 border-b border-sanctuary-sage/10 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-sanctuary-sage breathing" />
          <span className="font-display text-lg font-medium text-sanctuary-bone tracking-tight">
            AILYN
          </span>
          {isSpeaking && <VoiceWave />}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="sanctuary-ghost" size="sm" onClick={saveConversation} className="gap-1.5 text-xs">
            <Download className="w-3.5 h-3.5" />
          </Button>
          <Button variant="sanctuary-ghost" size="sm" onClick={clearMemory} className="gap-1.5 text-xs">
            <RotateCcw className="w-3.5 h-3.5" />
            🌿 Empezar de nuevo
          </Button>
        </div>
      </div>

      {/* Daily suggestion */}
      <AnimatePresence>
        {showDailySuggestion && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-10 mx-5 mt-3"
          >
            <div className="max-w-2xl mx-auto bg-sanctuary-moss/60 border border-sanctuary-sage/15 rounded-2xl px-4 py-3 backdrop-blur-md flex items-center justify-between">
              <p className="text-sanctuary-bone/80 text-sm font-body">
                ¿Quieres una pequeña reflexión para hoy? 🌱
              </p>
              <div className="flex gap-2">
                <Button
                  variant="sanctuary-ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    dismissDailySuggestion();
                    sendMessage("Dame una pequeña reflexión para hoy");
                  }}
                >
                  Sí
                </Button>
                <Button variant="sanctuary-ghost" size="sm" className="text-xs" onClick={dismissDailySuggestion}>
                  Ahora no
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto px-5 py-6">
        <div className="max-w-2xl mx-auto">
          {messages.map((msg, i) => (
            <ChatMessage key={i} role={msg.role} content={msg.content} index={i} />
          ))}
          {isLoading && <BreathingIndicator />}
        </div>
      </div>

      {/* Quick actions + Input */}
      <div className="relative z-10 px-5 pb-6 pt-2">
        <div className="max-w-2xl mx-auto">
          <QuickActions onSend={sendMessage} disabled={isLoading} />

          <div className="flex items-end gap-3 bg-sanctuary-moss/40 border border-sanctuary-sage/10 rounded-2xl px-4 py-3 backdrop-blur-md transition-all duration-300 focus-within:border-sanctuary-sage/30 focus-within:shadow-[0_0_20px_-8px_rgba(168,201,137,0.2)]">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? "Escuchando..." : "Comparte lo que sientes..."}
              rows={1}
              disabled={isListening}
              className="flex-1 bg-transparent text-sanctuary-bone placeholder:text-sanctuary-muted/40 resize-none focus:outline-none font-body text-[15px] leading-relaxed max-h-32 disabled:opacity-50"
              style={{ minHeight: "24px" }}
            />
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                variant="sanctuary-ghost"
                size="icon"
                onClick={() => setTtsEnabled(!ttsEnabled)}
                className={`h-8 w-8 rounded-full ${ttsEnabled ? "text-sanctuary-sage" : ""}`}
                title={ttsEnabled ? "Desactivar voz" : "Activar voz"}
              >
                {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
              <Button
                variant="sanctuary-ghost"
                size="icon"
                onClick={toggleListening}
                className={`h-8 w-8 rounded-full ${isListening ? "text-sanctuary-sage breathing" : ""}`}
                title="Hablar"
              >
                <Mic className="w-4 h-4" />
              </Button>
              <Button
                variant="sanctuary-ghost"
                size="icon"
                onClick={() => sendMessage()}
                disabled={!input.trim() || isLoading}
                className="h-8 w-8 rounded-full"
              >
                <ArrowUp className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatSanctuary;
