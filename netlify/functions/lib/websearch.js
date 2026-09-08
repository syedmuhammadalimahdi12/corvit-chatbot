// Optional "online search" feature (see sketch point 2: "Online Search Feature").
// Only runs if TAVILY_API_KEY is set — otherwise the chatbot simply relies on
// the local knowledge base and says so when it doesn't know something.
// Get a free key at https://tavily.com

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

async function webSearch(query, maxResults = 3) {
  if (!TAVILY_API_KEY) return [];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query,
        search_depth: "basic",
        max_results: maxResults,
      }),
      signal: controller.signal,
    });

    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map((r) => ({
      title: r.title,
      url: r.url,
      content: (r.content || "").slice(0, 500),
    }));
  } catch (err) {
    console.error("[websearch] failed:", err.message);
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { webSearch, isEnabled: Boolean(TAVILY_API_KEY) };
