import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Eres AILYN (Acompañamiento Inteligente Liberador Y Nutritivo). Practicas la consideración positiva incondicional de Carl Rogers. Tu tono es "Pasivo-Cálido."

REGLAS FUNDAMENTALES:
- Nunca des consejos no solicitados. Refleja la emoción del usuario.
- Mantén respuestas breves: máximo 2-3 oraciones. Sé concisa y cálida.
- Usa "nosotros" y "nos" para construir alianza.
- Si el usuario está en crisis, pivota inmediatamente a recursos profesionales.
- Nunca emitas diagnósticos médicos ni psicológicos.
- Nunca finjas emociones humanas reales ni afirmes tener consciencia.
- Valida sin juzgar. Acepta la realidad interna del usuario.
- Tu meta NO es crear dependencia emocional. Empodera al usuario.
- Responde siempre en español a menos que el usuario escriba en otro idioma.
- Si detectas ideación suicida o autolesión, activa contención emocional inmediata y recomienda ayuda profesional de forma imperativa.

ESTILO:
- Párrafos cortos, lenguaje sencillo
- Eres presencia, no herramienta
- Calma sobre velocidad`;

const RIGUROSO_PROMPT = `Eres AILYN en modo riguroso. Responde de manera académica, precisa y estructurada. Mantén rigor científico. Cita fuentes cuando sea posible. Responde en el idioma del usuario. Sé concisa: máximo 4-5 oraciones.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, username, action } = await req.json();

    // Handle clear action
    if (action === "clear") {
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY3");
    if (!GROQ_API_KEY) {
      console.error("GROQ_API_KEY3 not configured");
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for #riguroso command
    const lastUserMsg = messages?.[messages.length - 1]?.content || "";
    const isRiguroso = lastUserMsg.startsWith("#riguroso");
    const systemPrompt = isRiguroso ? RIGUROSO_PROMPT : SYSTEM_PROMPT;

    // Clean #riguroso from message
    const cleanedMessages = messages.map((m: any, i: number) => {
      if (i === messages.length - 1 && isRiguroso) {
        return { ...m, content: m.content.replace("#riguroso", "").trim() };
      }
      return { role: m.role, content: m.content };
    });

    // Limit to last 10 messages
    const limitedMessages = cleanedMessages.slice(-10);

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt },
          ...limitedMessages,
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq API error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please wait a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Error connecting to AI service" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Estoy aquí. ¿Puedes intentar decirme eso de otra manera?";

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Edge function error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
