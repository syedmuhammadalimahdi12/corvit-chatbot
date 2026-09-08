# Corvit Chatbot — RAG-powered admissions assistant

A landing page for an IT training institute (modeled on your whiteboard plan) with a
retrieval-augmented chatbot that helps students pick a course, and answers questions
about admission, timetables, NAVTTC vs. paid batches, and campuses.

```
Static site (HTML/CSS/JS + Tailwind-style hand-rolled CSS)
        │
        ▼
Netlify Function  ──►  TF-IDF retrieval over data/knowledge_base.json  ──►  gpt-oss-120b (Groq)
   (chat.js)                     │                                              │
                                  ▼                                     falls back to a
                         optional live web search                      smaller model if
                         (Tavily, if configured)                       the primary fails
```

## Folder structure

```
corvit-chatbot/
├── public/                     ← the static site Netlify serves ("main file → index.html")
│   ├── index.html
│   ├── css/style.css
│   ├── js/main.js              ← landing page interactions (course grid, nav)
│   ├── js/chatbot.js           ← chat widget: talks to the Netlify Function
│   └── assets/images/          ← SVG course icons + favicon
├── netlify/functions/
│   ├── chat.js                 ← main endpoint: retrieval + LLM call + fallback
│   └── lib/
│       ├── rag.js              ← TF-IDF retrieval engine (no external embedding API)
│       ├── llm.js              ← calls gpt-oss-120b, auto-falls back on failure
│       └── websearch.js        ← optional live web search (Tavily)
├── data/
│   ├── knowledge_base.json     ← the chatbot's dataset ("Step 1" from your plan)
│   └── raw/                    ← drop your collected PDFs/PNGs/screenshots here
├── scripts/test-rag.js         ← quick local test, no server needed
├── netlify.toml
├── package.json
└── .env.example
```

## 1. The dataset (your plan's Step 1)

`data/knowledge_base.json` is a **starter dataset** — real Corvit facts (its networking
heritage, course categories, NAVTTC's general structure) mixed with clearly-labeled
`"sample": true` entries for anything that changes often or varies by campus (fees,
exact timetable, branch addresses, contact numbers). The chatbot is instructed to tell
users when it's citing sample data.

To make it accurate for your institute:
1. Put the PDFs/screenshots you collect (fee sheets, timetables, course outlines) in `data/raw/`.
2. Turn each into one or more entries in `data/knowledge_base.json` using this shape:

```json
{
  "id": "unique-id",
  "title": "Short title",
  "category": "courses | admission | timetable | contact | ...",
  "tags": ["keywords", "a", "student", "might", "type"],
  "sample": false,
  "content": "The actual fact, written as plain sentences.",
  "image": "course-networking.svg",   // optional, must exist in public/assets/images
  "link": "#courses"                  // optional, anchor on the landing page
}
```

No rebuild step is needed — the function reads this JSON file directly, and retrieval
(a small TF-IDF search, not a vector database) runs over it at request time.

## 2. Run it locally

You need [Node.js 18+](https://nodejs.org) and the Netlify CLI (this project uses
Netlify Functions for the backend, so you can't just double-click `index.html` —
the chat needs the function running too).

```bash
npm install -g netlify-cli
cd corvit-chatbot
cp .env.example .env      # then fill in LLM_API_KEY (see step 3)
netlify dev
```

This serves the site **and** the function together, usually at `http://localhost:8888`.

To sanity-check retrieval without starting a server at all:
```bash
npm run test:rag
```

## 3. Get an API key for gpt-oss-120b

The default provider is **Groq**, which hosts `openai/gpt-oss-120b` for free with
generous rate limits:
1. Go to https://console.groq.com/keys and create a key.
2. Put it in `.env` as `LLM_API_KEY=...`.

Want to use a different OpenAI-compatible provider instead (OpenRouter, Together AI,
Fireworks, etc.)? Just change `LLM_API_BASE_URL` and `LLM_MODEL` in `.env` — no code
changes needed, since `netlify/functions/lib/llm.js` talks to any standard
`/chat/completions` endpoint.

## 4. Deploy to Netlify

**Option A — CLI:**
```bash
netlify deploy --prod
```

**Option B — GitHub + Netlify dashboard (recommended for a portfolio project):**
1. Push this folder to a new GitHub repo:
   ```bash
   git init
   git add .
   git commit -m "Corvit RAG chatbot"
   git branch -M main
   git remote add origin https://github.com/<you>/corvit-chatbot.git
   git push -u origin main
   ```
2. On [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing
   project** → pick the repo. Netlify will read `netlify.toml` automatically
   (publish = `public`, functions = `netlify/functions`).
3. In **Site settings → Environment variables**, add `LLM_API_KEY` (and
   `TAVILY_API_KEY` if you want live web search). Never commit `.env` to GitHub —
   it's already in `.gitignore`.
4. Deploy. Your chatbot endpoint will be live at
   `https://<your-site>.netlify.app/.netlify/functions/chat`.

This gives you the GitHub link and the Netlify link from your "what I need" list. For
the zip file, everything in this folder is it — zip it as-is once you've filled in your
real dataset.

## How the key features work

| Feature (from your plan) | Where it lives |
|---|---|
| Fallback model | `netlify/functions/lib/llm.js` — retries on `LLM_FALLBACK_MODEL` if the primary model errors, times out, or is rate-limited |
| Chat also recommends images | `chat.js` returns an `images[]` array built from matched knowledge-base entries' `image` field; rendered as thumbnails under the reply in `chatbot.js` |
| Professional UI | `public/css/style.css` — custom dark hero with an animated network diagram, light content sections, a floating chat widget with typing indicator |
| Website-like recommendation | `chat.js` returns a `recommendations[]` array of in-page links (`#courses`, `#admission`, …) built from matched entries' `link` field |
| Online search feature | `netlify/functions/lib/websearch.js` — optional, only runs when the local knowledge base has no confident match and `TAVILY_API_KEY` is set |
| Guide students to the best course | `course-recommendation-guide` entry in the knowledge base, written specifically to help the model reason about fit |

## Notes & next steps

- Retrieval is TF-IDF (classic keyword-weighted search), not vector embeddings — it
  needs no extra API key and is plenty accurate for a knowledge base this size. If you
  grow the dataset past a few hundred entries, consider swapping `lib/rag.js` for a
  real vector store.
- The current `data/knowledge_base.json` deliberately marks anything time-sensitive as
  sample data so the bot never states a stale fee or deadline as certain. Replace those
  entries as you collect real data (your Step 1).
- Everything here runs on Netlify's free tier plus Groq's free tier — no paid
  infrastructure required to get started.
