import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import ThresholdScreen from "@/components/ThresholdScreen";
import UsernameScreen from "@/components/UsernameScreen";
import DisclaimerScreen from "@/components/DisclaimerScreen";
import ChatSanctuary from "@/components/ChatSanctuary";
import { ThemeProvider } from "@/components/ThemeSwitcher";

type Stage = "threshold" | "username" | "disclaimer" | "chat";

const Index = () => {
  const [stage, setStage] = useState<Stage>("threshold");
  const [username, setUsername] = useState("");

  const handleUsername = (name: string) => {
    setUsername(name);
    setStage("disclaimer");
  };

  const handleReset = () => {
    setStage("threshold");
    setUsername("");
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen">
        <AnimatePresence mode="wait">
          {stage === "threshold" && (
            <ThresholdScreen key="threshold" onEnter={() => setStage("username")} />
          )}
          {stage === "username" && (
            <UsernameScreen key="username" onSubmit={handleUsername} />
          )}
          {stage === "disclaimer" && (
            <DisclaimerScreen key="disclaimer" onAccept={() => setStage("chat")} />
          )}
          {stage === "chat" && (
            <ChatSanctuary key="chat" username={username} onReset={handleReset} />
          )}
        </AnimatePresence>
      </div>
    </ThemeProvider>
  );
};

export default Index;
