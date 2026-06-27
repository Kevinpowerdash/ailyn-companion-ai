import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  index?: number;
}

const ChatMessage = ({ role, content, index = 0 }: ChatMessageProps) => {
  const isAilyn = role === "assistant";

  return (
    <motion.div
      className={`flex ${isAilyn ? "justify-start" : "justify-end"} mb-5`}
      initial={{ opacity: 0, y: 16, x: isAilyn ? -10 : 10 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.05,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {isAilyn ? (
        <div className="max-w-[80%] pl-4 py-1"
          style={{ borderLeft: "2px solid var(--sanctuary-sage)", borderLeftColor: "rgba(var(--particle-color, 168,201,137), 0.4)" }}
        >
          <div className="text-[15px] leading-relaxed font-body prose prose-invert prose-sm prose-p:my-1"
            style={{ color: "var(--sanctuary-bone)", opacity: 0.9 }}
          >
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
      ) : (
        <motion.div
          className="max-w-[80%] rounded-2xl px-4 py-3"
          style={{
            background: "rgba(var(--particle-color, 232,210,160), 0.25)",
            border: "1px solid rgba(var(--particle-color, 232,210,160), 0.35)",
            boxShadow: "0 6px 18px -8px rgba(0,0,0,0.12)",
          }}
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
        >
          <p className="text-[15px] leading-relaxed font-body" style={{ color: "var(--sanctuary-bone)", opacity: 0.95 }}>
            {content}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ChatMessage;
