const fs = require("fs");
const path = require("path");
const { TfIdfIndex } = require("./lib/rag");
const { callLLM } = require("./lib/llm");
const { webSearch, isEnabled: webSearchEnabled } = require("./lib/websearch");

const CONFIDENCE_THRESHOLD = 0.04; // similarity score below this = "no confident local match"
const MAX_HISTORY_TURNS = 6;

// Cached across warm invocations of the same function instance.
let knowledgeBase = null;
let index = null;

function loadKnowledgeBase() {
  if (knowledgeBase) return knowledgeBase;
  const filePath = path.join(__dirname, "../../data/knowledge_base.json");
  knowledgeBase = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return knowledgeBase;
}

function getIndex() {
  if (index) return index;
  const kb = loadKnowledgeBase();
  const docs = kb.map((entry) => ({
    id: entry.id,
    text: `${entry.title}. ${entry.content} ${(entry.tags || []).join(" ")}`,
  }));
  index = new TfIdfIndex(docs);
  return index;
}

function buildSystemPrompt({ context, hasLocalMatch, webResults }) {
  const base = [
    "You are the Corvit admissions assistant embedded on the Corvit website.",
    "You help prospective students pick the right course, and answer questions about admissions, timetables, NAVTTC vs paid batches, campuses and certifications.",
    "Be concise, friendly and specific. Prefer short paragraphs or short bullet lists.",
    "If information is marked SAMPLE DATA in the context, tell the user it's an example and to confirm the exact figure/date with the campus, instead of stating it as certain fact.",
    "If you don't have enough information to answer, say so plainly and suggest contacting the campus, rather than inventing details.",
  ];

  if (context) {
    base.push("\nUse the following knowledge base context to answer:\n---\n" + context + "\n---");
  } else {
    base.push("\nNo relevant local knowledge base entry was found for this question.");
  }

  if (webResults && webResults.length) {
    const webContext = webResults
      .map((r) => `- ${r.title}: ${r.content} (${r.url})`)
      .join("\n");
    base.push("\nRecent web search results you may use, with attribution:\n" + webContext);
  }

  if (!hasLocalMatch && !(webResults && webResults.length)) {
    base.push(
      "\nSince there's no local or web information for this question, briefly say you don't have that specific detail and suggest contacting the campus directly."
    );
  }

  return base.join("\n");
}

exports.handler = async function (event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON body" }) };
  }

  const message = String(payload.message || "").trim();
  const history = Array.isArray(payload.history) ? payload.history.slice(-MAX_HISTORY_TURNS) : [];

  if (!message) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "message is required" }) };
  }

  try {
    const kb = loadKnowledgeBase();
    const idx = getIndex();
    const results = idx.query(message, 4);

    const matched = results
      .filter((r) => r.score >= CONFIDENCE_THRESHOLD)
      .map((r) => kb.find((k) => k.id === r.id))
      .filter(Boolean);

    let webResults = [];
    let usedWebSearch = false;
    if (matched.length === 0 && webSearchEnabled) {
      webResults = await webSearch(`Corvit ${message}`);
      usedWebSearch = webResults.length > 0;
    }

    const context = matched.map((m) => `### ${m.title}\n${m.content}`).join("\n\n");

    const systemPrompt = buildSystemPrompt({
      context,
      hasLocalMatch: matched.length > 0,
      webResults,
    });

    const messages = [
      { role: "system", content: systemPrompt },
      ...history.map((h) => ({ role: h.role === "assistant" ? "assistant" : "user", content: String(h.content || "") })),
      { role: "user", content: message },
    ];

    const { reply, modelUsed } = await callLLM(messages);

    // Feature: chat also recommends images.
    const images = matched
      .filter((m) => m.image)
      .map((m) => ({ title: m.title, src: `/assets/images/${m.image}` }));

    // Feature: website-like recommendations (links back into the page).
    const seenLinks = new Set();
    const recommendations = matched
      .filter((m) => m.link && !seenLinks.has(m.link) && seenLinks.add(m.link))
      .map((m) => ({ label: m.title, href: m.link }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        reply,
        images,
        recommendations,
        sources: matched.map((m) => m.title),
        modelUsed,
        usedWebSearch,
      }),
    };
  } catch (err) {
    console.error("[chat] unexpected error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Something went wrong. Please try again." }),
    };
  }
};
