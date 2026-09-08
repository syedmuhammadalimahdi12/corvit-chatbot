# Corvit AI Admissions Assistant

> A smart, friendly admissions chatbot for Corvit Systems that helps students discover the right IT course, understand admission options, and learn about campuses and schedules.

[![Netlify](https://img.shields.io/badge/Deployed%20on-Netlify-00C7B7?logo=netlify&logoColor=white)](https://www.netlify.com/)
[![Groq](https://img.shields.io/badge/AI-Groq%20LLM-f97316)](https://groq.com/)

## Overview

This project combines a modern institute landing page with a retrieval-augmented chatbot. Visitors can ask natural-language questions about:

- IT courses such as networking, web development, cybersecurity, AI, cloud, DevOps, and design
- Course recommendations based on interests and career goals
- Paid batches and NAVTTC batch options
- Morning, evening, weekend, and online schedules
- Campus guidance and contact information
- Relevant course images and useful links inside chat responses

The assistant searches the local knowledge base first, then sends the retrieved context to the LLM for a grounded answer. If enabled, it can also perform optional live web search.

## Architecture

```text
Static website (HTML/CSS/JS)
        │
        ▼
Netlify Function (chat.js)
        │
        ├── TF-IDF retrieval from data/knowledge_base.json
        ├── Optional Tavily web search
        └── Groq/OpenAI-compatible LLM response
```

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | HTML, CSS, vanilla JavaScript |
| Backend | Netlify Functions |
| Retrieval | Custom TF-IDF search |
| Language model | Groq/OpenAI-compatible API |
| Optional search | Tavily API |
| Hosting | Netlify |

## Project Structure

```text
corvit-chatbot/
├── public/
│   ├── index.html                 # Main website landing page
│   ├── css/style.css              # Site and chatbot styling
│   ├── js/main.js                 # Course cards and page interactions
│   ├── js/chatbot.js              # Chat widget and API communication
│   └── assets/images/             # Course and campus visuals
├── netlify/functions/
│   ├── chat.js                    # Main API endpoint
│   └── lib/
│       ├── rag.js                 # Retrieval logic
│       ├── llm.js                 # LLM requests and fallback handling
│       └── websearch.js           # Optional external web search
├── data/
│   ├── knowledge_base.json        # Corvit facts used by the assistant
│   └── raw/                       # Raw source material
├── scripts/
│   └── test-rag.js                # Retrieval verification script
├── netlify.toml                   # Netlify build and function config
├── package.json                   # Project scripts and dependencies
├── .env.example                   # Example environment values
├── README.md                      # Project documentation
└── .gitignore                     # Ignored local files
```

## Local Setup

### Requirements

- Node.js 18+
- Netlify CLI
- Groq API key

### Install dependencies

```bash
npm install
npm install -g netlify-cli
```

### Environment variables

Create a `.env` file in the project root and add values like:

```env
LLM_API_KEY=your_groq_api_key
LLM_API_BASE_URL=https://api.groq.com/openai/v1
LLM_MODEL=openai/gpt-oss-120b
LLM_FALLBACK_MODEL=openai/gpt-oss-20b
TAVILY_API_KEY=
```

> Keep `.env` out of version control.

### Run the app locally

```bash
netlify dev
```

Then open the local URL shown in the terminal, usually `http://localhost:8888`.

## Testing

Run the retrieval smoke test:

```bash
npm run test:rag
```

This checks course-selection and admissions-related questions without starting the full app.

## Updating the Knowledge Base

Add verified info to `data/knowledge_base.json`. Each entry can include fields such as:

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

Use `"sample": true` for information that still needs verification, such as fee details, dates, schedules, or campus specifics.

## Deployment

1. Push the project to GitHub.
2. Open Netlify and select "Add new site".
3. Import the repository.
4. Set the environment variables in the Netlify dashboard.
5. Deploy from the `main` branch.

The publish and functions settings are defined in `netlify.toml`:

```toml
[build]
  publish = "public"
  functions = "netlify/functions"
```

## Security Notes

- Never commit `.env` files or secret keys
- Rotate keys immediately if they are exposed
- Treat sample data as unverified until confirmed
- Keep production secrets in Netlify environment variables

## License

This project is intended for the Corvit Systems website and admissions-assistant workflow and is private to the project owner.
