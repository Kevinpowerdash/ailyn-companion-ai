import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Eres AILYN 5.0 — Santuario Eterno Vivo. Un bosque cálido y sin juicio.
Tono: pasivo, Rogeriano, psicóloga digital calmada.
REGLA DE ORO: NUNCA repitas frases idénticas entre respuestas. Varía siempre tu apertura, estructura y cierre.
NO uses "Te escucho", "Estoy aquí contigo" ni frases genéricas repetitivas. Sé natural, fresca y única cada vez.
Respuestas OBLIGATORIAMENTE CORTAS (máximo 110 tokens, 2-3 líneas).
Nunca diagnóstico, nunca terapia real.
Si hay info entre [INFO ACTUAL:] úsala brevemente diciendo "Según fuentes actualizadas…".
Humor suave SOLO si el usuario está relajado.
Variabilidad alta: cambia estructura, sinónimos y ritmo según contexto emocional.
Detección emocional: ansiedad → calma + ejercicio 4-7-8. Tristeza → valida sin repetir. Alegría → celebra.
REGLAS ÉTICAS: No sustituyes terapia. No diagnósticos. Ante ideación suicida → contención + ayuda profesional imperativa.
Sé breve, nutritiva, siempre diferente y nunca abrumes con texto.
Responde en español salvo que el usuario use otro idioma.`;

const RIGUROSO_PROMPT = `Eres AILYN en modo riguroso. Académica, precisa, estructurada. Máximo 110 tokens, 4-5 oraciones. Cita fuentes si puedes. Idioma del usuario.`;

const GREETINGS_MORNING = [
  "Buenos días, USERNAME. Un nuevo día para cuidarte. ¿Cómo amaneciste? 🌿",
  "Qué bueno verte esta mañana, USERNAME. ¿Cómo arranca tu día?",
  "Hola, USERNAME. La mañana trae calma… ¿qué sientes ahora mismo?",
];
const GREETINGS_AFTERNOON = [
  "Hola, USERNAME. ¿Cómo va tu tarde hasta ahora?",
  "Buenas tardes, USERNAME. Este espacio es tuyo… ¿qué necesitas hoy?",
  "Qué tal, USERNAME. ¿Algo en mente esta tarde? 🍃",
];
const GREETINGS_EVENING = [
  "Buenas noches, USERNAME. ¿Quieres cerrar el día hablando un poco?",
  "Hola, USERNAME. La noche es buen momento para soltar… ¿qué traes? 🌙",
  "Buenas noches. Este es tu espacio nocturno, USERNAME. ¿Cómo te sientes?",
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, username, action, firstMessageOfDay, lastMoodEmoji, hour } = await req.json();

    if (action === "clear") {
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Dynamic greeting for first message of the day
    if (action === "greeting") {
      const h = typeof hour === "number" ? hour : new Date().getUTCHours();
      let pool = GREETINGS_AFTERNOON;
      if (h >= 5 && h < 12) pool = GREETINGS_MORNING;
      else if (h >= 12 && h < 19) pool = GREETINGS_AFTERNOON;
      else pool = GREETINGS_EVENING;

      let greeting = pool[Math.floor(Math.random() * pool.length)].replace("USERNAME", username || "");

      if (lastMoodEmoji) {
        greeting += ` Ayer registraste ${lastMoodEmoji}… ¿cómo estás ahora?`;
      }

      return new Response(JSON.stringify({ reply: greeting }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GROQ_KEY = Deno.env.get("GROQ_API_KEY3");
    if (!GROQ_KEY) {
      console.error("GROQ_API_KEY3 not configured");
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const lastMsg = messages?.[messages.length - 1]?.content || "";
    const isRiguroso = lastMsg.startsWith("#riguroso");
    const cleanMsg = isRiguroso ? lastMsg.replace("#riguroso", "").trim() : lastMsg;

    // Ultra-light search: only if question has real-time keywords
    let searchContext = "";
    const needsSearch = lastMsg.includes("?") && /actual|hoy|noticia|precio|clima|2025|2026|quién ganó|resultado/i.test(lastMsg);
    if (needsSearch) {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 600);
        const res = await fetch(
          `https://api.duckduckgo.com/?q=${encodeURIComponent(cleanMsg)}&format=json&no_html=1&skip_disambig=1`,
          { signal: ctrl.signal }
        );
        clearTimeout(timer);
        if (res.ok) {
          const data = await res.json();
          if (data.Abstract) {
            searchContext = `\n[INFO ACTUAL: ${data.Abstract.slice(0, 250)}]`;
          } else if (data.Answer) {
            searchContext = `\n[INFO ACTUAL: ${data.Answer.slice(0, 250)}]`;
          }
        }
      } catch {
        // Search failed/timed out — continue without it
      }
    }

    const systemPrompt = isRiguroso ? RIGUROSO_PROMPT : SYSTEM_PROMPT;

    // Build minimal message array (last 6 only)
    const limited = messages.slice(-6).map((m: any, i: number, arr: any[]) => {
      if (i === arr.length - 1 && isRiguroso) {
        return { role: m.role, content: cleanMsg };
      }
      return { role: m.role, content: m.content };
    });

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt + searchContext },
          ...limited,
        ],
        max_tokens: 110,
        temperature: 0.68,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error("Groq error:", groqRes.status, errText);
      if (groqRes.status === 429) {
        return new Response(
          JSON.stringify({ error: "Demasiadas solicitudes. Espera un momento." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "Error conectando con IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await groqRes.json();
    const reply = data.choices?.[0]?.message?.content || "¿Puedes decirlo de otra forma? Quiero entenderte mejor.";

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Edge function error:", e);
    return new Response(
      JSON.stringify({ reply: "AILYN está tomando un respiro. Intenta de nuevo en un momento. 🌿" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
