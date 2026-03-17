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
        <div className="max-w-[80%] border-l-2 border-sanctuary-sage/40 pl-4 py-1">
          <div className="text-sanctuary-bone/90 text-[15px] leading-relaxed font-body prose prose-invert prose-sm prose-p:my-1">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
      ) : (
        <motion.div
          className="max-w-[80%] bg-sanctuary-moss/60 rounded-2xl px-4 py-3 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.3)]"
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
        >
          <p className="text-sanctuary-bone/90 text-[15px] leading-relaxed font-body">
            {content}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ChatMessage;
