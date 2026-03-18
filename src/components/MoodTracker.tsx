import { useState, useEffect } from "react";

const moods = [
  { emoji: "😊", label: "Bien", value: 5, key: "bien" },
  { emoji: "🙂", label: "Tranquilo/a", value: 4, key: "tranquila" },
  { emoji: "😐", label: "Normal", value: 3, key: "normal" },
  { emoji: "😕", label: "Bajo/a", value: 2, key: "bajola" },
  { emoji: "😢", label: "Mal", value: 1, key: "mal" },
];

interface MoodEntry {
  date: string;
  value: number;
  emoji: string;
  key: string;
  timestamp: number;
}

export const getLastMoodEmoji = (username: string): string | null => {
  const saved: MoodEntry[] = JSON.parse(localStorage.getItem(`ailyn_mood_${username}`) || "[]");
  return saved.length > 0 ? saved[saved.length - 1].emoji : null;
};

export const getCurrentMoodKey = (username: string): string | null => {
  const saved: MoodEntry[] = JSON.parse(localStorage.getItem(`ailyn_mood_${username}`) || "[]");
  if (saved.length === 0) return null;
  const today = new Date().toDateString();
  const todayEntry = saved.find((e) => e.date === today);
  return todayEntry?.key || saved[saved.length - 1]?.key || null;
};

export const getMoodTrend = (username: string): string => {
  const saved: MoodEntry[] = JSON.parse(localStorage.getItem(`ailyn_mood_${username}`) || "[]");
  if (saved.length < 3) return "neutral";
  const recent = saved.slice(-3);
  const avg = recent.reduce((a, b) => a + b.value, 0) / recent.length;
  if (avg >= 4) return "positive";
  if (avg <= 2) return "negative";
  return "neutral";
};

interface MoodTrackerProps {
  username: string;
  onMoodChange?: (moodKey: string) => void;
}

const MoodTracker = ({ username, onMoodChange }: MoodTrackerProps) => {
  const [history, setHistory] = useState<MoodEntry[]>([]);
  const [todayLogged, setTodayLogged] = useState(false);

  useEffect(() => {
    const saved: MoodEntry[] = JSON.parse(localStorage.getItem(`ailyn_mood_${username}`) || "[]");
    setHistory(saved.slice(-30));
    const today = new Date().toDateString();
    setTodayLogged(saved.some((e) => e.date === today));
  }, [username]);

  const logMood = (mood: typeof moods[0]) => {
    const today = new Date().toDateString();
    const entry: MoodEntry = {
      date: today,
      value: mood.value,
      emoji: mood.emoji,
      key: mood.key,
      timestamp: Date.now(),
    };
    const saved: MoodEntry[] = JSON.parse(localStorage.getItem(`ailyn_mood_${username}`) || "[]");
    const filtered = saved.filter((e) => e.date !== today);
    filtered.push(entry);
    const last30 = filtered.slice(-30);
    localStorage.setItem(`ailyn_mood_${username}`, JSON.stringify(last30));
    setHistory(last30);
    setTodayLogged(true);
    onMoodChange?.(mood.key);
  };

  const getInsight = () => {
    if (history.length < 3) return null;
    const allAvg = history.reduce((a, b) => a + b.value, 0) / history.length;
    const recent = history.slice(-3);
    const recentAvg = recent.reduce((a, b) => a + b.value, 0) / recent.length;
    const diff = recentAvg - allAvg;
    const pct = Math.abs(Math.round((diff / allAvg) * 100));

    // Consecutive low days
    const lastEntries = history.slice(-3);
    const consecutiveLow = lastEntries.every((e) => e.value <= 2);

    if (consecutiveLow) return "💛 Llevas días difíciles. ¿Quieres probar una técnica de anclaje?";
    if (diff > 0.3) return `📈 Tu ánimo mejoró +${pct}% estos días 🌱`;
    if (diff < -0.3) return `🫂 Has tenido días más bajos. Cuídate extra 💛`;
    return "🌿 Tu ánimo se mantiene estable";
  };

  // Most frequent mood this week
  const getMostFrequent = () => {
    const weekEntries = history.slice(-7);
    if (weekEntries.length < 2) return null;
    const counts: Record<string, number> = {};
    weekEntries.forEach((e) => {
      counts[e.emoji] = (counts[e.emoji] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0];
  };

  const maxBarH = 36;
  const insight = getInsight();
  const frequent = getMostFrequent();

  return (
    <div className="space-y-3">
      <p className="text-[var(--sanctuary-muted)] text-xs font-medium uppercase tracking-wider">Tu ánimo</p>

      {!todayLogged ? (
        <div className="flex gap-1.5 justify-center">
          {moods.map((m) => (
            <button
              key={m.value}
              onClick={() => logMood(m)}
              className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg transition-all duration-300 hover:scale-110"
              style={{ background: "transparent" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--sanctuary-moss)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              title={m.label}
            >
              <span className="text-lg">{m.emoji}</span>
              <span className="text-[9px]" style={{ color: "var(--sanctuary-muted)", opacity: 0.6 }}>{m.label}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-end justify-center gap-1 h-14">
            {history.slice(-7).map((entry, i) => (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <div
                  className="w-3.5 rounded-full transition-all duration-500"
                  style={{
                    height: `${(entry.value / 5) * maxBarH}px`,
                    background: `var(--sanctuary-sage)`,
                    opacity: 0.3 + (i / 7) * 0.5,
                  }}
                  title={`${entry.emoji} ${entry.date}`}
                />
                <span className="text-[9px]">{entry.emoji}</span>
              </div>
            ))}
          </div>
          {frequent && (
            <p className="text-[10px] text-center" style={{ color: "var(--sanctuary-muted)", opacity: 0.5 }}>
              Más frecuente esta semana: {frequent}
            </p>
          )}
          {insight && (
            <p className="text-[10px] text-center" style={{ color: "var(--sanctuary-muted)", opacity: 0.7 }}>
              {insight}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default MoodTracker;
