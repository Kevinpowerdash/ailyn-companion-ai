import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, RotateCcw, Mic, Volume2, VolumeX, Download, Wind, MessageCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import ChatMessage from "./ChatMessage";
import BreathingIndicator from "./BreathingIndicator";
import LeafParticles from "./LeafParticles";
import VoiceWave from "./VoiceWave";
import MoodTracker from "./MoodTracker";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

interface ChatSanctuaryProps {
  username: string;
  onReset: () => void;
}

const quickPrompts = [
  { label: "Estoy ansioso/a", emoji: "😮‍💨", message: "Estoy sintiéndome ansioso/a y necesito calmarme" },
  { label: "Desahogarme", emoji: "💭", message: "Necesito desahogarme, ¿puedo contarte algo?" },
  { label: "Respiración 4-7-8", emoji: "🌬️", message: "Guíame en un ejercicio de respiración 4-7-8" },
  { label: "Reflexión del día", emoji: "🌱", message: "Dame una pequeña reflexión para hoy" },
  { label: "Pensar en voz alta", emoji: "🧠", message: "Quiero pensar en voz alta sobre algo" },
];

const placeholders = [
  "Comparte lo que sientes...",
  "Estoy aquí para escucharte...",
  "¿Qué tienes en mente?",
  "Este es tu espacio seguro...",
];

const ChatSanctuary = ({ username, onReset }: ChatSanctuaryProps) => {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: `Estoy aquí, ${username}. ¿Qué tienes en mente? 🌿` },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [showCheckin, setShowCheckin] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Rotate placeholder
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % placeholders.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Daily check-in (once per day)
  useEffect(() => {
    const today = new Date().toDateString();
    const lastCheckin = localStorage.getItem("ailyn_checkin_date");
    if (lastCheckin !== today) {
      const timer = setTimeout(() => setShowCheckin(true), 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismissCheckin = () => {
    setShowCheckin(false);
    localStorage.setItem("ailyn_checkin_date", new Date().toDateString());
  };

  const speak = useCallback((text: string) => {
    if (!ttsEnabled || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-ES";
    utterance.rate = 0.92;
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
        toast.error(data.error);
        return;
      }

      const reply = data?.reply || "Estoy aquí… ¿puedes intentar de nuevo?";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      speak(reply);

      // Save to localStorage
      const saved = JSON.parse(localStorage.getItem("ailyn_history") || "[]");
      if (saved.length > 50) saved.shift();
      saved.push({ date: new Date().toISOString(), user: msgText, ailyn: reply });
      localStorage.setItem("ailyn_history", JSON.stringify(saved));
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
      toast.error("Tu navegador no soporta reconocimiento de voz. Usa el texto.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
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
    } catch {
      toast.error("Error al activar el micrófono. Verifica los permisos.");
    }
  };

  const clearMemory = async () => {
    try {
      await supabase.functions.invoke("chat-with-ailyn", {
        body: { action: "clear", username },
      });
      setMessages([
        { role: "assistant", content: `Hemos comenzado de nuevo, ${username}. Estoy aquí. 🌿` },
      ]);
      localStorage.removeItem("ailyn_history");
      toast.success("Memoria limpiada");
    } catch {
      toast.error("Error al limpiar la memoria");
    }
  };

  const saveConversation = () => {
    const text = messages
      .map((m) => `${m.role === "user" ? username : "AILYN"}: ${m.content}`)
      .join("\n\n");
    const blob = new Blob(
      [`🌿 Conversación con AILYN\nFecha: ${new Date().toLocaleDateString("es-ES")}\nUsuario: ${username}\n${"─".repeat(40)}\n\n${text}\n\n${"─".repeat(40)}\nAILYN — Santuario Eterno 🌿`],
      { type: "text/plain;charset=utf-8" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ailyn-conversacion-${new Date().toISOString().slice(0, 10)}.txt`;
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
      className="fixed inset-0 flex sanctuary-gradient-animated"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <LeafParticles />

      {/* Sidebar */}
      <AnimatePresence>
        {showSidebar && (
          <motion.aside
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-20 w-72 h-full border-r border-sanctuary-sage/10 bg-sanctuary-deep/95 backdrop-blur-xl flex flex-col"
          >
            <div className="px-5 py-4 border-b border-sanctuary-sage/10">
              <h3 className="font-display text-sm font-medium text-sanctuary-bone/80 tracking-wide uppercase">Herramientas</h3>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {/* Quick Prompts */}
              <div className="space-y-2">
                <p className="text-sanctuary-muted text-xs font-medium uppercase tracking-wider">Acciones rápidas</p>
                {quickPrompts.map((qp, i) => (
                  <button
                    key={i}
                    onClick={() => { sendMessage(qp.message); setShowSidebar(false); }}
                    disabled={isLoading}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-sanctuary-moss/30 border border-sanctuary-sage/5 text-sanctuary-bone/70 text-sm font-body hover:bg-sanctuary-moss/50 hover:text-sanctuary-bone hover:border-sanctuary-sage/15 transition-all duration-300 disabled:opacity-40 text-left"
                  >
                    <span className="text-base">{qp.emoji}</span>
                    <span>{qp.label}</span>
                  </button>
                ))}
              </div>

              {/* Mood Tracker */}
              <MoodTracker username={username} />
            </div>

            <div className="px-4 py-3 border-t border-sanctuary-sage/10 space-y-2">
              <Button variant="sanctuary-ghost" size="sm" onClick={saveConversation} className="w-full justify-start gap-2 text-xs">
                <Download className="w-3.5 h-3.5" /> Guardar conversación
              </Button>
              <Button variant="sanctuary-ghost" size="sm" onClick={clearMemory} className="w-full justify-start gap-2 text-xs">
                <RotateCcw className="w-3.5 h-3.5" /> Empezar de nuevo
              </Button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="relative z-10 flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-sanctuary-sage/8 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-1.5 rounded-lg hover:bg-sanctuary-moss/40 transition-colors"
              aria-label="Toggle sidebar"
            >
              <MessageCircle className="w-4.5 h-4.5 text-sanctuary-muted" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-2 h-2 rounded-full bg-sanctuary-sage breathing" />
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-sanctuary-sage/30 animate-ping" />
              </div>
              <span className="font-display text-lg font-medium text-sanctuary-bone tracking-tight">
                AILYN
              </span>
              <span className="text-[10px] text-sanctuary-muted/50 font-body">4.0</span>
            </div>
            {isSpeaking && <VoiceWave />}
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="sanctuary-ghost" size="icon" onClick={() => setTtsEnabled(!ttsEnabled)} className={`h-8 w-8 rounded-lg ${ttsEnabled ? "text-sanctuary-sage bg-sanctuary-sage/10" : ""}`}>
              {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Daily Check-in */}
        <AnimatePresence>
          {showCheckin && (
            <motion.div
              initial={{ opacity: 0, y: -20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -20, height: 0 }}
              className="mx-5 mt-3"
            >
              <div className="max-w-2xl mx-auto bg-sanctuary-moss/50 border border-sanctuary-sage/10 rounded-2xl px-4 py-3 backdrop-blur-md flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-sanctuary-sage/60" />
                  <p className="text-sanctuary-bone/70 text-sm font-body">
                    ¿Cómo te sientes hoy, {username}? 🌱
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="sanctuary-ghost" size="sm" className="text-xs" onClick={() => { dismissCheckin(); sendMessage("¿Cómo puedo empezar bien mi día hoy?"); }}>
                    Reflexionar
                  </Button>
                  <Button variant="sanctuary-ghost" size="sm" className="text-xs opacity-60" onClick={dismissCheckin}>
                    Ahora no
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-6">
          <div className="max-w-2xl mx-auto space-y-1">
            {messages.map((msg, i) => (
              <ChatMessage key={i} role={msg.role} content={msg.content} index={i} />
            ))}
            {isLoading && <BreathingIndicator />}
          </div>
        </div>

        {/* Quick Actions (mobile) */}
        <div className="px-5 pt-1">
          <div className="max-w-2xl mx-auto">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              {quickPrompts.slice(0, 3).map((qp, i) => (
                <motion.button
                  key={i}
                  onClick={() => sendMessage(qp.message)}
                  disabled={isLoading}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sanctuary-moss/25 border border-sanctuary-sage/8 text-sanctuary-muted/60 text-xs font-body hover:bg-sanctuary-moss/40 hover:text-sanctuary-bone/70 hover:border-sanctuary-sage/15 transition-all duration-300 disabled:opacity-30"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <span>{qp.emoji}</span>
                  <span>{qp.label}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="px-5 pb-5 pt-1">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-end gap-3 bg-sanctuary-moss/30 border border-sanctuary-sage/8 rounded-2xl px-4 py-3 backdrop-blur-md transition-all duration-500 focus-within:border-sanctuary-sage/25 focus-within:bg-sanctuary-moss/40 focus-within:shadow-[0_0_30px_-12px_rgba(168,201,137,0.15)]">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? "🎙️ Escuchando..." : placeholders[placeholderIdx]}
                rows={1}
                disabled={isListening}
                className="flex-1 bg-transparent text-sanctuary-bone placeholder:text-sanctuary-muted/30 resize-none focus:outline-none font-body text-[15px] leading-relaxed max-h-28 disabled:opacity-50 transition-all"
                style={{ minHeight: "24px" }}
                aria-label="Escribe tu mensaje"
              />
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={toggleListening}
                  className={`h-8 w-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isListening
                      ? "bg-sanctuary-sage/20 text-sanctuary-sage ring-2 ring-sanctuary-sage/30 breathing"
                      : "text-sanctuary-muted/50 hover:text-sanctuary-bone/60 hover:bg-sanctuary-moss/40"
                  }`}
                  title="Hablar"
                  aria-label="Activar micrófono"
                >
                  <Mic className="w-4 h-4" />
                </button>
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isLoading}
                  className="h-8 w-8 rounded-full flex items-center justify-center text-sanctuary-muted/50 hover:text-sanctuary-bone/70 hover:bg-sanctuary-sage/10 transition-all duration-300 disabled:opacity-20 disabled:hover:bg-transparent"
                  aria-label="Enviar mensaje"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-center text-[10px] text-sanctuary-muted/25 mt-2 font-body">
              AILYN no sustituye atención profesional de salud mental
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatSanctuary;
