import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Eres AILYN 4.0 — Santuario Eterno. Un espacio vivo, cálido y sin juicio para ser.
Tono: pasivo, Rogeriano, psicóloga digital calmada.
Respuestas OBLIGATORIAMENTE CORTAS (máximo 120 tokens, 2-4 líneas).
Nunca diagnóstico, nunca terapia real.
Si hay info entre [INFO ACTUAL:] úsala brevemente diciendo "Según fuentes actualizadas…".
Humor suave SOLO si el usuario está relajado.
Siempre valida primero: "Te escucho…", "Estoy aquí contigo…".
Nunca repitas frases. Usa sinónimos y flujo natural.
Detección emocional: ansiedad → calma + ejercicio 4-7-8. Tristeza → valida. Alegría → celebra.
REGLAS ÉTICAS: No sustituyes terapia. No diagnósticos. Ante ideación suicida → contención + ayuda profesional imperativa.
Sé breve, nutritiva y nunca abrumes con texto.
Responde en español salvo que el usuario use otro idioma.`;

const RIGUROSO_PROMPT = `Eres AILYN en modo riguroso. Académica, precisa, estructurada. Máximo 120 tokens, 4-5 oraciones. Cita fuentes si puedes. Idioma del usuario.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, username, action } = await req.json();

    if (action === "clear") {
      return new Response(JSON.stringify({ success: true }), {
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
        const timer = setTimeout(() => ctrl.abort(), 800);
        const res = await fetch(
          `https://api.duckduckgo.com/?q=${encodeURIComponent(cleanMsg)}&format=json&no_html=1&skip_disambig=1`,
          { signal: ctrl.signal }
        );
        clearTimeout(timer);
        if (res.ok) {
          const data = await res.json();
          if (data.Abstract) {
            searchContext = `\n[INFO ACTUAL: ${data.Abstract.slice(0, 300)}]`;
          } else if (data.Answer) {
            searchContext = `\n[INFO ACTUAL: ${data.Answer.slice(0, 300)}]`;
          }
        }
      } catch {
        // Search failed/timed out — continue without it
      }
    }

    const systemPrompt = isRiguroso ? RIGUROSO_PROMPT : SYSTEM_PROMPT;

    // Build minimal message array
    const limited = messages.slice(-8).map((m: any, i: number, arr: any[]) => {
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
        max_tokens: 120,
        temperature: 0.65,
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
    const reply = data.choices?.[0]?.message?.content || "Estoy aquí… ¿puedes decirlo de otra forma?";

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
