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
# 🎓 Corvit AI Admissions Assistant

> A smart, friendly chatbot for Corvit Systems that helps students discover the right IT course, understand admission options, and find useful campus guidance.

[![Live on Netlify](https://img.shields.io/badge/Deployed%20on-Netlify-00C7B7?logo=netlify&logoColor=white)](https://www.netlify.com/)
[![Powered by Groq](https://img.shields.io/badge/AI-Groq%20LLM-f97316)](https://groq.com/)

## ✨ What This Project Does

Corvit AI Admissions Assistant combines a modern institute website with a retrieval-augmented chatbot. Visitors can ask natural-language questions about:

- 📚 Networking, web development, cybersecurity, AI, cloud, DevOps, and design courses
- 🎯 Course recommendations based on interests and career goals
- 📝 Paid admission and NAVTTC batch options
- 🕒 Morning, evening, weekend, and online learning formats
- 🏫 Corvit campuses and contact guidance
- 🖼️ Related course images and useful links inside chat responses

The assistant searches Corvit's local knowledge base first, then uses the configured language model to create a concise answer. Optional web search can provide additional current information when enabled.

## 🚀 Highlights

- 🎨 Responsive landing page for desktop, tablet, and mobile
- 💬 Floating chatbot with quick questions and typing indicator
- 🧠 TF-IDF retrieval with no vector database required
- 🤖 Groq-compatible OpenAI chat completions integration
- 🔁 Automatic fallback model support
- 🔍 Optional Tavily web search integration
- 🖼️ Corvit branding, logo, campus background, and course artwork
- ⚡ Serverless Netlify Function backend
- 🔐 Environment variables kept outside the repository

## 🧩 How It Works

```text
Visitor asks a question
               │
               ▼
Browser chatbot widget
               │
               ▼
Netlify Function: /.netlify/functions/chat
               │
               ├── Searches data/knowledge_base.json
               ├── Optionally checks Tavily web search
               └── Sends grounded context to the LLM
               │
               ▼
Answer, sources, images, and page recommendations
```

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, vanilla JavaScript |
| Backend | Netlify Functions |
| Retrieval | Custom TF-IDF search |
| Language model | Groq OpenAI-compatible API |
| Optional search | Tavily API |
| Hosting | Netlify |

## 📁 Project Structure

```text
corvit-chatbot/
├── public/
│   ├── index.html                 # Main website
│   ├── css/style.css              # Website and chatbot styling
│   ├── js/main.js                 # Navigation and course cards
│   ├── js/chatbot.js              # Chat interface and API calls
│   └── assets/images/             # Logo, campus photo, and course artwork
├── netlify/functions/
│   ├── chat.js                    # Chat API endpoint
│   └── lib/
│       ├── rag.js                 # TF-IDF retrieval engine
│       ├── llm.js                 # LLM requests and fallback handling
│       └── websearch.js            # Optional Tavily search
├── data/
│   ├── knowledge_base.json        # Corvit facts used by the assistant
│   └── raw/                       # Source documents and collected material
├── scripts/test-rag.js            # Retrieval sanity test
├── netlify.toml                   # Netlify build and function settings
└── package.json
```

## ⚡ Run Locally

### Requirements

- Node.js 18 or newer
- A Groq API key
- Netlify CLI

### Install and configure

```bash
npm install -g netlify-cli
```

Create a `.env` file in the project root. Never commit this file.

```env
LLM_API_KEY=your_groq_api_key
LLM_API_BASE_URL=https://api.groq.com/openai/v1
LLM_MODEL=openai/gpt-oss-120b
LLM_FALLBACK_MODEL=openai/gpt-oss-20b
TAVILY_API_KEY=
```

Start the website and chatbot together:

```bash
netlify dev
```

Open the local URL shown in the terminal, usually `http://localhost:8888`. Use `netlify dev` instead of opening `public/index.html` directly because the chatbot needs the Netlify Function endpoint.

## 🧪 Test Retrieval

```bash
npm run test:rag
```

This checks questions about course selection, NAVTTC, paid batches, and networking courses without starting a web server.

## 🧠 Update the Knowledge Base

Add verified Corvit information to `data/knowledge_base.json`:

```json
{
   "id": "networking-ccna",
   "title": "CCNA courses",
   "category": "courses",
   "tags": ["ccna", "cisco", "networking"],
   "sample": false,
   "content": "Corvit offers networking training for students interested in Cisco and enterprise IT careers.",
   "image": "course-networking.svg",
   "link": "#courses"
}
```

Use `"sample": true` for fees, dates, schedules, or campus details that still need confirmation. The assistant is instructed to identify sample information instead of presenting it as guaranteed fact.

## 🌐 Deploy to Netlify

1. Push the project to a GitHub repository.
2. Open [Netlify](https://app.netlify.com/) and choose **Add new site**.
3. Select **Import an existing project**, connect GitHub, and choose the repository.
4. Deploy from the `main` branch.
5. Add these variables in **Site configuration → Environment variables**:

```text
LLM_API_KEY=your_new_groq_api_key
LLM_API_BASE_URL=https://api.groq.com/openai/v1
LLM_MODEL=openai/gpt-oss-120b
LLM_FALLBACK_MODEL=openai/gpt-oss-20b
```

Netlify reads the publish and function settings from `netlify.toml`:

```toml
[build]
   publish = "public"
   functions = "netlify/functions"
```

After every push to `main`, Netlify automatically builds and redeploys the site.

## 🔒 Security Notes

- Never commit `.env`, API keys, or private credentials.
- Rotate an API key immediately if it has been exposed.
- Keep changing information marked as sample data until it is verified.
- Configure production API keys through Netlify environment variables.

## 📌 Suggested Repository Description

```text
AI-powered Corvit IT course admissions chatbot with RAG search and Netlify Functions.
```

## 📄 License

This project is private and intended for Corvit Systems website and admissions-assistant use.
