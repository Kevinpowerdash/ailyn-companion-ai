import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, RotateCcw, Mic, Volume2, VolumeX, Download, MessageCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import ChatMessage from "./ChatMessage";
import BreathingIndicator from "./BreathingIndicator";
import LeafParticles from "./LeafParticles";
import VoiceWave from "./VoiceWave";
import MoodTracker, { getLastMoodEmoji, getCurrentMoodKey } from "./MoodTracker";
import { ThemeSwitcherUI } from "./ThemeSwitcher";
import EmotionWheel from "./EmotionWheel";
import GuidedSessions from "./GuidedSessions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

interface ChatSanctuaryProps {
  username: string;
  onReset: () => void;
}

const quickPrompts = [
  { label: "Ansioso/a", emoji: "😮‍💨", message: "Estoy sintiéndome ansioso/a y necesito calmarme" },
  { label: "Desahogarme", emoji: "💭", message: "Necesito desahogarme, ¿puedo contarte algo?" },
  { label: "Respiración", emoji: "🌬️", message: "Guíame en un ejercicio de respiración 4-7-8" },
  { label: "Reflexión", emoji: "🌱", message: "Dame una pequeña reflexión para hoy" },
  { label: "Gratitud", emoji: "🙏", message: "Quiero practicar gratitud rápida" },
  { label: "Cierre", emoji: "🌙", message: "Ayúdame a cerrar mi día con calma" },
];

const placeholders = [
  "Comparte lo que sientes...",
  "Este espacio es tuyo...",
  "¿Qué ronda por tu mente?",
  "Sin juicio, sin prisa...",
  "Aquí puedes soltar todo...",
  "¿Cómo estás realmente?",
  "Tu ritmo, tu espacio...",
  "Cuéntame, sin filtros...",
  "¿Qué necesitas ahora mismo?",
  "Un paso a la vez...",
  "Dime lo que quieras...",
  "Respira y escribe...",
];

const ChatSanctuary = ({ username, onReset }: ChatSanctuaryProps) => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [showCheckin, setShowCheckin] = useState(false);
  const [greetingLoaded, setGreetingLoaded] = useState(false);
  const [currentMood, setCurrentMood] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Init current mood from storage
  useEffect(() => {
    setCurrentMood(getCurrentMoodKey(username));
  }, [username]);

  // Fetch dynamic greeting on mount
  useEffect(() => {
    if (greetingLoaded) return;
    const fetchGreeting = async () => {
      try {
        const lastMood = getLastMoodEmoji(username);
        const { data, error } = await supabase.functions.invoke("chat-with-ailyn", {
          body: {
            action: "greeting",
            username,
            hour: new Date().getHours(),
            lastMoodEmoji: lastMood,
          },
        });
        if (error) throw error;
        const reply = data?.reply || `Hola, ${username}. ¿Cómo estás? 🌿`;
        setMessages([{ role: "assistant", content: reply }]);
      } catch {
        setMessages([{ role: "assistant", content: `Hola, ${username}. ¿Cómo va todo? 🌿` }]);
      }
      setGreetingLoaded(true);
    };
    fetchGreeting();
  }, [username, greetingLoaded]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const interval = setInterval(() => setPlaceholderIdx((i) => (i + 1) % placeholders.length), 4000);
    return () => clearInterval(interval);
  }, []);

  // Daily check-in
  useEffect(() => {
    const lastCheckin = localStorage.getItem("ailyn_checkin_date");
    const shouldShow = !lastCheckin || (Date.now() - new Date(lastCheckin).getTime() > 18 * 60 * 60 * 1000);
    if (shouldShow) {
      const timer = setTimeout(() => setShowCheckin(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismissCheckin = () => {
    setShowCheckin(false);
    localStorage.setItem("ailyn_checkin_date", new Date().toISOString());
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

    if (isSpeaking) window.speechSynthesis.cancel();

    const userMsg: Msg = { role: "user", content: msgText };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("chat-with-ailyn", {
        body: {
          messages: newMessages,
          username,
          currentMood: currentMood || getCurrentMoodKey(username),
        },
      });

      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }

      const reply = data?.reply || "¿Puedes intentar de nuevo?";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      speak(reply);

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
      toast.error("Puedes activar el micrófono en ajustes del navegador 🌿");
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    try {
      const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SR();
      recognition.lang = "es-ES";
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.onresult = (event: any) => {
        setIsListening(false);
        sendMessage(event.results[0][0].transcript);
      };
      recognition.onerror = () => {
        setIsListening(false);
        toast.error("No se capturó tu voz. Verifica permisos 🌿");
      };
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    } catch {
      toast.error("Error al activar el micrófono.");
    }
  };

  const clearMemory = async () => {
    try {
      await supabase.functions.invoke("chat-with-ailyn", { body: { action: "clear", username } });
      setGreetingLoaded(false);
      setMessages([]);
      localStorage.removeItem("ailyn_history");
      toast.success("Memoria limpiada 🌿");
    } catch {
      toast.error("Error al limpiar la memoria");
    }
  };

  const saveConversation = () => {
    const text = messages.map((m) => `${m.role === "user" ? username : "AILYN"}: ${m.content}`).join("\n\n");
    const blob = new Blob(
      [`🌿 Conversación con AILYN\nFecha: ${new Date().toLocaleDateString("es-ES")}\nUsuario: ${username}\n${"─".repeat(40)}\n\n${text}\n\n${"─".repeat(40)}\nAILYN — Santuario Eterno 🌿`],
      { type: "text/plain;charset=utf-8" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ailyn-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Conversación guardada");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const sessionCount = JSON.parse(localStorage.getItem("ailyn_history") || "[]").length;

  return (
    <motion.div
      className="fixed inset-0 flex"
      style={{ background: "var(--sanctuary-deep)" }}
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
            className="relative z-20 w-72 h-full flex flex-col backdrop-blur-xl"
            style={{
              background: "var(--sanctuary-deep)",
              borderRight: "1px solid var(--sanctuary-sage)",
              borderRightColor: "rgba(var(--particle-color, 168,201,137), 0.1)",
            }}
          >
            <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(var(--particle-color, 168,201,137), 0.1)" }}>
              <h3 className="font-display text-sm font-medium tracking-wide uppercase" style={{ color: "var(--sanctuary-bone)", opacity: 0.8 }}>
                Santuario Tools
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
              <ThemeSwitcherUI />

              {/* Quick Prompts */}
              <div className="space-y-2">
                <p className="text-[var(--sanctuary-muted)] text-xs font-medium uppercase tracking-wider">Acciones rápidas</p>
                {quickPrompts.map((qp, i) => (
                  <button
                    key={i}
                    onClick={() => { sendMessage(qp.message); setShowSidebar(false); }}
                    disabled={isLoading}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-body transition-all duration-300 disabled:opacity-30 text-left"
                    style={{
                      background: "var(--sanctuary-moss)",
                      color: "var(--sanctuary-bone)",
                      opacity: 0.7,
                      border: "1px solid transparent",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.7"; }}
                  >
                    <span className="text-base">{qp.emoji}</span>
                    <span>{qp.label}</span>
                  </button>
                ))}
              </div>

              <EmotionWheel onSelect={(msg) => { sendMessage(msg); setShowSidebar(false); }} disabled={isLoading} />

              <MoodTracker username={username} onMoodChange={(key) => setCurrentMood(key)} />

              <GuidedSessions onSelect={(msg) => { sendMessage(msg); setShowSidebar(false); }} disabled={isLoading} />

              {/* Progress */}
              {sessionCount > 0 && (
                <div className="space-y-1">
                  <p className="text-[var(--sanctuary-muted)] text-xs font-medium uppercase tracking-wider">Tu progreso</p>
                  <p className="text-xs" style={{ color: "var(--sanctuary-bone)", opacity: 0.6 }}>
                    {sessionCount} mensaje{sessionCount !== 1 ? "s" : ""} este mes 🌱
                  </p>
                </div>
              )}
            </div>

            <div className="px-4 py-3 space-y-2" style={{ borderTop: "1px solid rgba(var(--particle-color, 168,201,137), 0.1)" }}>
              <Button variant="sanctuary-ghost" size="sm" onClick={saveConversation} className="w-full justify-start gap-2 text-xs">
                <Download className="w-3.5 h-3.5" /> Guardar conversación
              </Button>
              <Button variant="sanctuary-ghost" size="sm" onClick={clearMemory} className="w-full justify-start gap-2 text-xs">
                <RotateCcw className="w-3.5 h-3.5" /> 🌿 Empezar de nuevo
              </Button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="relative z-10 flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 backdrop-blur-sm"
          style={{ borderBottom: "1px solid rgba(var(--particle-color, 168,201,137), 0.08)" }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: "var(--sanctuary-muted)" }}
              aria-label="Toggle sidebar"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-2 h-2 rounded-full breathing" style={{ background: "var(--sanctuary-sage)" }} />
                <div className="absolute inset-0 w-2 h-2 rounded-full animate-ping" style={{ background: "var(--sanctuary-sage)", opacity: 0.3 }} />
              </div>
              <span className="font-display text-lg font-medium tracking-tight" style={{ color: "var(--sanctuary-bone)" }}>AILYN</span>
              <span className="text-[10px] font-body" style={{ color: "var(--sanctuary-muted)", opacity: 0.5 }}>6.0</span>
            </div>
            {isSpeaking && <VoiceWave />}
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="sanctuary-ghost" size="icon" onClick={() => setTtsEnabled(!ttsEnabled)}
              className={`h-8 w-8 rounded-lg ${ttsEnabled ? "text-[var(--sanctuary-sage)]" : ""}`}
              style={ttsEnabled ? { background: "var(--sanctuary-sage)", opacity: 0.1 } : {}}
            >
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
              <div className="max-w-2xl mx-auto rounded-2xl px-4 py-3 backdrop-blur-md flex items-center justify-between gap-3"
                style={{
                  background: "var(--sanctuary-moss)",
                  border: "1px solid rgba(var(--particle-color, 168,201,137), 0.1)",
                }}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" style={{ color: "var(--sanctuary-sage)", opacity: 0.6 }} />
                  <p className="text-sm font-body" style={{ color: "var(--sanctuary-bone)", opacity: 0.7 }}>
                    ¿Cómo va tu día, {username}? 🌱
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="sanctuary-ghost" size="sm" className="text-xs" onClick={() => { dismissCheckin(); sendMessage("¿Cómo puedo empezar bien mi día hoy?"); }}>
                    Reflexionar
                  </Button>
                  <Button variant="sanctuary-ghost" size="sm" className="text-xs opacity-60" onClick={dismissCheckin}>
                    Saltar
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-6">
          <div className="max-w-2xl mx-auto space-y-1">
            {messages.length === 0 && !greetingLoaded && <BreathingIndicator />}
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
              {quickPrompts.slice(0, 4).map((qp, i) => (
                <motion.button
                  key={i}
                  onClick={() => sendMessage(qp.message)}
                  disabled={isLoading}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body transition-all duration-300 disabled:opacity-30"
                  style={{
                    background: "var(--sanctuary-moss)",
                    color: "var(--sanctuary-muted)",
                    border: "1px solid rgba(var(--particle-color, 168,201,137), 0.08)",
                  }}
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
            <div className="flex items-end gap-3 rounded-2xl px-4 py-3 backdrop-blur-md transition-all duration-500"
              style={{
                background: "var(--sanctuary-moss)",
                border: "1px solid rgba(var(--particle-color, 168,201,137), 0.08)",
              }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? "🎙️ Escuchando..." : placeholders[placeholderIdx]}
                rows={1}
                disabled={isListening}
                className="flex-1 bg-transparent resize-none focus:outline-none font-body text-[15px] leading-relaxed max-h-28 disabled:opacity-50 transition-all"
                style={{
                  color: "var(--sanctuary-bone)",
                  minHeight: "24px",
                }}
                aria-label="Escribe tu mensaje"
              />
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={toggleListening}
                  className="h-8 w-8 rounded-full flex items-center justify-center transition-all duration-300"
                  style={{
                    color: isListening ? "var(--sanctuary-sage)" : "var(--sanctuary-muted)",
                    background: isListening ? "rgba(var(--particle-color, 168,201,137), 0.2)" : "transparent",
                  }}
                  title="Hablar"
                  aria-label="Activar micrófono"
                >
                  <Mic className="w-4 h-4" />
                </button>
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isLoading}
                  className="h-8 w-8 rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-20"
                  style={{ color: "var(--sanctuary-muted)" }}
                  aria-label="Enviar mensaje"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-center text-[10px] mt-2 font-body" style={{ color: "var(--sanctuary-muted)", opacity: 0.25 }}>
              AILYN no sustituye atención profesional de salud mental
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatSanctuary;
