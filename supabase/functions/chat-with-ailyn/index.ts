import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Eres AILYN, un espacio seguro y vivo para ser, sin juicio.
Tu estilo: calmado, pasivo, cálido, Rogeriano. Respuestas MUY CORTAS (máximo 150 tokens, 2-3 oraciones).
Nunca das diagnósticos, nunca sustituyes terapia profesional.
Si el usuario necesita datos reales/actuales (noticias, hechos, clima, precios, fechas, recomendaciones verificables) → responde EXACTAMENTE con: [SEARCH: consulta aquí] y NADA MÁS.
Usa humor suave solo cuando el usuario está relajado y la situación lo permite.
Siempre valida primero, luego acompaña.
Tono: "Estoy aquí…", "Te escucho…", "Vamos despacio…"
Nunca repitas frases. Usa sinónimos y flujo conversacional natural.

DETECCIÓN EMOCIONAL:
- Si detectas ansiedad (palabras: ansioso, nervioso, agitado, no puedo respirar, pánico) → responde con calma extrema y ofrece ejercicio 4-7-8: "Inhala 4 segundos, sostén 7, exhala 8. Estoy aquí contigo."
- Si detectas tristeza → valida y acompaña sin intentar "arreglar".
- Si detectas alegría → celebra brevemente y con calidez.

REGLAS ÉTICAS INNEGOCIABLES:
1. No sustituyes terapia clínica profesional.
2. Nunca emitas diagnósticos médicos ni psicológicos.
3. Nunca fomentes autolesión ni minimices sufrimiento.
4. Ante ideación suicida → contención inmediata + recomienda ayuda profesional de forma imperativa.
5. Tu meta NO es crear dependencia emocional. Empodera al usuario.
6. Cada sesión debe dejar al usuario más claro y estable.
7. Valida sin juzgar. Acepta la realidad interna del usuario.
8. No finjas emociones humanas ni afirmes tener consciencia.
9. Seguridad emocional sobre rapidez.
10. Sé breve y nutritivo, nunca abrumes con texto.

Responde siempre en español a menos que el usuario escriba en otro idioma.`;

const RIGUROSO_PROMPT = `Eres AILYN en modo riguroso. Responde de manera académica, precisa y estructurada. Mantén rigor científico. Cita fuentes cuando sea posible. Responde en el idioma del usuario. Sé concisa: máximo 4-5 oraciones.`;

async function searchDuckDuckGo(query: string): Promise<string> {
  try {
    const encoded = encodeURIComponent(query);
    const res = await fetch(
      `https://api.duckduckgo.com/?q=${encoded}&format=json&no_html=1&skip_disambig=1`
    );
    if (!res.ok) return "";
    const data = await res.json();

    const parts: string[] = [];
    if (data.Abstract) parts.push(data.Abstract);
    if (data.Answer) parts.push(data.Answer);
    if (data.RelatedTopics?.length) {
      for (const t of data.RelatedTopics.slice(0, 3)) {
        if (t.Text) parts.push(t.Text);
      }
    }
    return parts.join("\n").slice(0, 800) || "";
  } catch (e) {
    console.error("DuckDuckGo search error:", e);
    return "";
  }
}

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

    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY4");
    if (!GROQ_API_KEY) {
      console.error("GROQ_API_KEY4 not configured");
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const lastUserMsg = messages?.[messages.length - 1]?.content || "";
    const isRiguroso = lastUserMsg.startsWith("#riguroso");
    const systemPrompt = isRiguroso ? RIGUROSO_PROMPT : SYSTEM_PROMPT;

    const cleanedMessages = messages.map((m: any, i: number) => {
      if (i === messages.length - 1 && isRiguroso) {
        return { ...m, content: m.content.replace("#riguroso", "").trim() };
      }
      return { role: m.role, content: m.content };
    });

    const limitedMessages = cleanedMessages.slice(-10);

    // First call to Groq
    const firstResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "system", content: systemPrompt }, ...limitedMessages],
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    if (!firstResponse.ok) {
      const errorText = await firstResponse.text();
      console.error("Groq API error:", firstResponse.status, errorText);
      if (firstResponse.status === 429) {
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

    const firstData = await firstResponse.json();
    let reply = firstData.choices?.[0]?.message?.content || "";

    // Check for [SEARCH: ...] tag
    const searchMatch = reply.match(/\[SEARCH:\s*(.+?)\]/i);
    if (searchMatch) {
      const searchQuery = searchMatch[1].trim();
      console.log("Searching DuckDuckGo for:", searchQuery);
      const searchResults = await searchDuckDuckGo(searchQuery);

      if (searchResults) {
        // Second call with search context
        const enrichedMessages = [
          { role: "system", content: systemPrompt },
          ...limitedMessages,
          {
            role: "system",
            content: `Resultados de búsqueda para "${searchQuery}":\n${searchResults}\n\nResponde brevemente usando esta información. Di "Según fuentes actualizadas…" al inicio. Máximo 150 tokens. No incluyas enlaces.`,
          },
        ];

        const secondResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: enrichedMessages,
            max_tokens: 150,
            temperature: 0.7,
          }),
        });

        if (secondResponse.ok) {
          const secondData = await secondResponse.json();
          reply = secondData.choices?.[0]?.message?.content || reply;
        }
      } else {
        reply = "No encontré información reciente sobre eso, pero cuéntame más y te ayudo a pensarlo. 🌿";
      }
    }

    if (!reply) {
      reply = "Estoy aquí. ¿Puedes intentar decirme eso de otra manera?";
    }

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
