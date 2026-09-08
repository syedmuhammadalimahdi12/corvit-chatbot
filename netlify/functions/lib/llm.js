// Calls an OpenAI-compatible chat completions endpoint.
// Works as-is with Groq (default), and with any other OpenAI-compatible
// provider (OpenRouter, Together AI, Fireworks, etc.) by changing the
// env vars below — no code changes needed.

const BASE_URL = (process.env.LLM_API_BASE_URL || "https://api.groq.com/openai/v1").replace(/\/+$/, "");
const API_KEY = process.env.LLM_API_KEY;
const PRIMARY_MODEL = process.env.LLM_MODEL || "openai/gpt-oss-120b";
const FALLBACK_MODEL = process.env.LLM_FALLBACK_MODEL || "openai/gpt-oss-20b";
const REQUEST_TIMEOUT_MS = 20000;

async function callOnce(messages, model) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.4,
        max_tokens: 600,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`LLM request failed (${res.status}): ${errText.slice(0, 300)}`);
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error("Empty response from model");
    return text.trim();
  } finally {
    clearTimeout(timeout);
  }
}

// Key feature: automatic fallback model.
// If the primary model errors, times out, or is rate-limited, we
// transparently retry on a smaller/backup model before giving up.
async function callLLM(messages) {
  if (!API_KEY) {
    return {
      reply:
        "The chatbot isn't fully set up yet — the site owner needs to add an LLM_API_KEY environment variable. See README.md.",
      modelUsed: "none",
    };
  }

  try {
    const reply = await callOnce(messages, PRIMARY_MODEL);
    return { reply, modelUsed: PRIMARY_MODEL };
  } catch (primaryErr) {
    console.error("[llm] primary model failed:", primaryErr.message);
    try {
      const reply = await callOnce(messages, FALLBACK_MODEL);
      return { reply, modelUsed: `${FALLBACK_MODEL} (fallback)` };
    } catch (fallbackErr) {
      console.error("[llm] fallback model failed:", fallbackErr.message);
      return {
        reply:
          "Sorry — I'm having trouble reaching the AI service right now. Please try again in a moment.",
        modelUsed: "error",
      };
    }
  }
}

module.exports = { callLLM, PRIMARY_MODEL, FALLBACK_MODEL };
