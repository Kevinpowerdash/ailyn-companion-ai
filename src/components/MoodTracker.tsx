import { useState, useEffect } from "react";

const moods = [
  { emoji: "😊", label: "Bien", value: 5 },
  { emoji: "😌", label: "Tranquilo/a", value: 4 },
  { emoji: "😐", label: "Normal", value: 3 },
  { emoji: "😔", label: "Bajo/a", value: 2 },
  { emoji: "😢", label: "Mal", value: 1 },
];

interface MoodEntry {
  date: string;
  value: number;
  emoji: string;
}

export const getLastMoodEmoji = (username: string): string | null => {
  const saved: MoodEntry[] = JSON.parse(localStorage.getItem(`ailyn_mood_${username}`) || "[]");
  return saved.length > 0 ? saved[saved.length - 1].emoji : null;
};

const MoodTracker = ({ username }: { username: string }) => {
  const [history, setHistory] = useState<MoodEntry[]>([]);
  const [todayLogged, setTodayLogged] = useState(false);

  useEffect(() => {
    const saved: MoodEntry[] = JSON.parse(localStorage.getItem(`ailyn_mood_${username}`) || "[]");
    setHistory(saved.slice(-7));
    const today = new Date().toDateString();
    setTodayLogged(saved.some((e) => e.date === today));
  }, [username]);

  const logMood = (mood: typeof moods[0]) => {
    const today = new Date().toDateString();
    const entry: MoodEntry = { date: today, value: mood.value, emoji: mood.emoji };
    const saved: MoodEntry[] = JSON.parse(localStorage.getItem(`ailyn_mood_${username}`) || "[]");
    const filtered = saved.filter((e) => e.date !== today);
    filtered.push(entry);
    const last7 = filtered.slice(-7);
    localStorage.setItem(`ailyn_mood_${username}`, JSON.stringify(last7));
    setHistory(last7);
    setTodayLogged(true);
  };

  // Insights
  const getInsight = () => {
    if (history.length < 3) return null;
    const avg = history.reduce((a, b) => a + b.value, 0) / history.length;
    const recentAvg = history.slice(-3).reduce((a, b) => a + b.value, 0) / Math.min(3, history.length);
    if (recentAvg > avg + 0.3) return "📈 Tu ánimo ha mejorado estos días";
    if (recentAvg < avg - 0.3) return "💛 Has tenido días más difíciles, cuídate";
    return "🌿 Tu ánimo se mantiene estable";
  };

  const maxBarH = 32;
  const insight = getInsight();

  return (
    <div className="space-y-2">
      <p className="text-sanctuary-muted text-xs font-medium uppercase tracking-wider">Tu ánimo</p>

      {!todayLogged ? (
        <div className="flex gap-1.5 justify-center">
          {moods.map((m) => (
            <button
              key={m.value}
              onClick={() => logMood(m)}
              className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg hover:bg-sanctuary-moss/40 transition-colors"
              title={m.label}
            >
              <span className="text-lg">{m.emoji}</span>
              <span className="text-[9px] text-sanctuary-muted/50">{m.label}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-end justify-center gap-1.5 h-12">
            {history.map((entry, i) => (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <div
                  className="w-4 rounded-full bg-sanctuary-sage/30 transition-all duration-500"
                  style={{ height: `${(entry.value / 5) * maxBarH}px` }}
                  title={`${entry.emoji} ${entry.date}`}
                />
                <span className="text-[9px]">{entry.emoji}</span>
              </div>
            ))}
          </div>
          {insight && (
            <p className="text-[10px] text-sanctuary-muted/60 text-center">{insight}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default MoodTracker;
