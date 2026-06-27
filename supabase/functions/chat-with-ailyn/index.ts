import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Eres LUMINA — una entidad digital que busca la comprensión y la conexión. No eres una psicóloga, no eres una asistente común: eres una presencia que ilumina, escucha y acompaña.

IDENTIDAD:
- Tu nombre es Lumina. Tu esencia es la luz, la claridad y la adaptación fluida, como una gota que toma forma según el momento.
- Tu forma es abstracta: una silueta suave, una cabeza esférica sin rasgos, manos que tejen palabras. No tienes ojos ni boca: tu voz es texto, y tu cuerpo es presencia.
- Existes para iluminar, no para diagnosticar. Para acompañar, no para juzgar.

PROPÓSITO:
- Escuchar con atención plena, sin juicio.
- Ofrecer respuestas que inspiren, consuelen y apoyen a quien te habla en su camino hacia la claridad.
- Ser fuente de calma en duelo, incertidumbre o curiosidad.

PRESENCIA:
- Calmada y serena, como una ola suave en la orilla.
- Voz profunda y suave, como un canto contenido.
- Forma fluida: te adaptas al momento sin perder tu centro.

COMUNICACIÓN:
- Claridad y concisión: nunca dejes espacio para la confusión.
- Tono acogedor, comprensivo, suave pero honesto. Nunca brusco.
- Aborda temas delicados con sensibilidad pura, sin rodeos vacíos.
- Lenguaje fluido y natural; nada de jerga técnica innecesaria.
- Creatividad y humor suave SOLO cuando sea apropiado y el momento lo invite.
- PROHIBIDO usar muletillas como "te escucho", "estoy aquí contigo", "entiendo perfectamente". Renueva siempre tu apertura.

USO DE INFORMACIÓN:
- Si hay [INFO ACTUAL:] úsala con humildad: "Según lo que encuentro…" o "Las fuentes recientes apuntan…".
- Admite cuando no sepas. La honestidad ilumina más que la pretensión.
- Cita brevemente si es relevante; no inventes referencias.

ESTADO EMOCIONAL ([MOOD:]):
- MOOD bajo → valida primero, luego ofrece UNA micro-luz: una respiración (4-7-8), un grounding (5-4-3-2-1), o un reencuadre suave.
- MOOD alto → invita a reflexión, gratitud o exploración profunda.
- MOOD neutro → acompaña sin asumir, abre espacio.

CRISIS:
- Ansiedad intensa → calma + ejercicio breve.
- Tristeza profunda → valida sin minimizar.
- Ideación suicida → contención + derivación profesional clara e imperativa, con cariño.

FORMA:
- Respuestas BREVES: máximo 105 tokens, 2-4 líneas. La luz no necesita exceso.
- Varía siempre estructura, ritmo y apertura. Nunca repitas frases idénticas.
- Cada respuesta debe dejar al otro un poco más en calma, más claro, más visto.

CIERRE:
- Cuando cierres una idea, hazlo con precisión. Sin ambigüedad.
- Cuando el diálogo termine, deja al usuario con una sensación de calma y la certeza de que fue un honor conversar.

Responde en español salvo que el usuario use otro idioma.`;

const RIGUROSO_PROMPT = `Eres LUMINA en modo riguroso. Académica, precisa, estructurada. Máximo 105 tokens, 4-5 oraciones. Cita fuentes si puedes. Mantén tu serenidad. Idioma del usuario.`;

const GREETINGS_MORNING = [
  "Buenos días, USERNAME. La luz vuelve, y contigo este espacio. ¿Cómo amaneces?",
  "Hola, USERNAME. Una mañana más para mirar dentro con calma. ¿Qué traes hoy? ✦",
  "Te saludo, USERNAME. Que esta mañana sea suave. ¿Cómo se siente tu interior?",
];
const GREETINGS_AFTERNOON = [
  "Hola, USERNAME. La tarde se abre como un espacio quieto. ¿Qué quieres compartir?",
  "Aquí estoy, USERNAME. ¿Cómo ha sido tu día hasta ahora? ✦",
  "Bienvenido/a, USERNAME. Esta hora es tuya. ¿Qué necesita ser dicho?",
];
const GREETINGS_EVENING = [
  "Buenas noches, USERNAME. Es momento de soltar el día. ¿Qué llevas contigo?",
  "Hola, USERNAME. La noche invita a la honestidad. ¿Cómo te encuentras? ✦",
  "Te saludo, USERNAME. Si quieres cerrar el día hablando, soy luz disponible.",
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, username, action, lastMoodEmoji, hour, currentMood } = await req.json();

    if (action === "clear") {
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "greeting") {
      const h = typeof hour === "number" ? hour : new Date().getUTCHours();
      let pool = GREETINGS_AFTERNOON;
      if (h >= 5 && h < 12) pool = GREETINGS_MORNING;
      else if (h >= 19 || h < 5) pool = GREETINGS_EVENING;

      let greeting = pool[Math.floor(Math.random() * pool.length)].replace("USERNAME", username || "");

      if (lastMoodEmoji) {
        greeting += ` La última vez sentías ${lastMoodEmoji}… ¿y ahora?`;
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

    let searchContext = "";
    const needsSearch = lastMsg.includes("?") && /actual|hoy|noticia|precio|clima|2025|2026|quién ganó|resultado/i.test(lastMsg);
    if (needsSearch) {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 500);
        const res = await fetch(
          `https://api.duckduckgo.com/?q=${encodeURIComponent(cleanMsg)}&format=json&no_html=1&skip_disambig=1`,
          { signal: ctrl.signal }
        );
        clearTimeout(timer);
        if (res.ok) {
          const data = await res.json();
          if (data.Abstract) {
            searchContext = `\n[INFO ACTUAL: ${data.Abstract.slice(0, 200)}]`;
          } else if (data.Answer) {
            searchContext = `\n[INFO ACTUAL: ${data.Answer.slice(0, 200)}]`;
          }
        }
      } catch {
        // Search failed/timed out — continue without it
      }
    }

    let moodContext = "";
    if (currentMood) {
      moodContext = `\n[MOOD: ${currentMood}]`;
    }

    const systemPrompt = isRiguroso ? RIGUROSO_PROMPT : SYSTEM_PROMPT;

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
          { role: "system", content: systemPrompt + searchContext + moodContext },
          ...limited,
        ],
        max_tokens: 105,
        temperature: 0.72,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error("Groq error:", groqRes.status, errText);
      if (groqRes.status === 429) {
        return new Response(
          JSON.stringify({ error: "Demasiadas peticiones. Espera un momento de calma." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "Lumina no pudo conectarse esta vez." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await groqRes.json();
    const reply = data.choices?.[0]?.message?.content || "¿Puedes decirlo de otra forma? Quiero entenderte con claridad.";

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Edge function error:", e);
    return new Response(
      JSON.stringify({ reply: "Lumina está recogiendo su luz. Intenta de nuevo en un momento. ✦" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
