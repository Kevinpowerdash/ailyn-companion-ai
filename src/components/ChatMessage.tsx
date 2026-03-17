import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

const ChatMessage = ({ role, content }: ChatMessageProps) => {
  const isAilyn = role === "assistant";

  return (
    <motion.div
      className={`flex ${isAilyn ? "justify-start" : "justify-end"} mb-4`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {isAilyn ? (
        <div className="max-w-[80%] border-l-2 border-sanctuary-sage/40 pl-4 py-1">
          <div className="text-sanctuary-bone/90 text-[15px] leading-relaxed font-body prose prose-invert prose-sm prose-p:my-1">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
      ) : (
        <div className="max-w-[80%] bg-sanctuary-moss/60 rounded-2xl px-4 py-3">
          <p className="text-sanctuary-bone/90 text-[15px] leading-relaxed font-body">
            {content}
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default ChatMessage;
