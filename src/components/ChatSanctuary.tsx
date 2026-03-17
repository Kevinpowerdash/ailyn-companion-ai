import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowUp, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import ChatMessage from "./ChatMessage";
import BreathingIndicator from "./BreathingIndicator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

interface ChatSanctuaryProps {
  username: string;
  onReset: () => void;
}

const ChatSanctuary = ({ username, onReset }: ChatSanctuaryProps) => {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: `Estoy aquí, ${username}. ¿Qué tienes en mente?` },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Msg = { role: "user", content: text };
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
    } catch (e: any) {
      console.error("Chat error:", e);
      toast.error("No se pudo conectar. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const clearMemory = async () => {
    try {
      await supabase.functions.invoke("chat-with-ailyn", {
        body: { action: "clear", username },
      });
      setMessages([
        { role: "assistant", content: `Hemos comenzado de nuevo, ${username}. Estoy aquí.` },
      ]);
      toast.success("Memoria limpiada");
    } catch {
      toast.error("Error al limpiar la memoria");
    }
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
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-sanctuary-sage/10">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-sanctuary-sage breathing" />
          <span className="font-display text-lg font-medium text-sanctuary-bone tracking-tight">
            AILYN
          </span>
        </div>
        <Button variant="sanctuary-ghost" size="sm" onClick={clearMemory} className="gap-2 text-xs">
          <RotateCcw className="w-3.5 h-3.5" />
          Comenzar de nuevo
        </Button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-6">
        <div className="max-w-2xl mx-auto">
          {messages.map((msg, i) => (
            <ChatMessage key={i} role={msg.role} content={msg.content} />
          ))}
          {isLoading && <BreathingIndicator />}
        </div>
      </div>

      {/* Input */}
      <div className="px-5 pb-8 pt-2">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-end gap-3 bg-sanctuary-moss/40 border border-sanctuary-sage/10 rounded-2xl px-4 py-3 backdrop-blur-md">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Comparte lo que sientes..."
              rows={1}
              className="flex-1 bg-transparent text-sanctuary-bone placeholder:text-sanctuary-muted/40 resize-none focus:outline-none font-body text-[15px] leading-relaxed max-h-32"
              style={{ minHeight: "24px" }}
            />
            <Button
              variant="sanctuary-ghost"
              size="icon"
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="shrink-0 h-8 w-8 rounded-full"
            >
              <ArrowUp className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatSanctuary;
