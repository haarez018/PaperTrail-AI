# NyayaMitra — नयामित्र — நீதிமித்ரா

> **Agentic AI that navigates Indian government bureaucracy so citizens don't have to.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/)
[![Next.js 14](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-green.svg)](https://fastapi.tiangolo.com/)
[![Ollama](https://img.shields.io/badge/LLM-Ollama-orange.svg)](https://ollama.ai/)

---

## The Problem

When someone dies in India, their family must navigate **11+ government procedures** across 6 departments — death certificate, legal heir certificate, pension transfer, property mutation, bank KYC updates, and more. Each requires different forms, different offices, different documents. Most families lose **3–6 months** and pay **₹10,000–₹25,000** to middlemen just to figure it out.

**700 million Indians face this. Almost none can afford a lawyer.**

---

## The Solution

NyayaMitra is a **multi-agent AI system** that:

1. **Understands** your situation in Tamil, Hindi, or English
2. **Identifies** every government procedure you need — automatically sorted by dependency order
3. **Generates** pre-filled PDF forms ready to print and submit
4. **Navigates** — tells you exactly which office, which counter, what to carry
5. **Escalates** — if any office delays beyond the legal limit, drafts a pre-filled RTI application citing the exact law section

**Works offline. Zero API cost. No data leaves your machine.**

---

## Demo

```
"My grandfather passed away last week in Chennai.
 He had a government pension and one house."
```

↓ 90 seconds later ↓

```
✓ 11 procedures identified
✓ Topological order computed (Death Certificate → Legal Heir → Pension Transfer → ...)
✓ All forms pre-filled
✓ Office locations mapped
✓ Statutory deadlines set
✓ RTI draft ready if needed
```

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   Frontend                       │
│   Next.js 14 · Framer Motion · D3.js · Zustand  │
│   10 routes · Voice Input · Command Palette      │
└────────────────────┬────────────────────────────┘
                     │ SSE stream
┌────────────────────▼────────────────────────────┐
│                  FastAPI Backend                  │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │  Intake  │→ │ Planner  │→ │   Document   │  │
│  │  Agent   │  │  Agent   │  │    Agent     │  │
│  └──────────┘  └──────────┘  └──────────────┘  │
│                      │                           │
│  ┌──────────┐  ┌─────▼────┐  ┌──────────────┐  │
│  │Escalation│  │Navigation│  │   i18n Agent │  │
│  │  Agent   │  │  Agent   │  │  (ta/hi/en)  │  │
│  └──────────┘  └──────────┘  └──────────────┘  │
│                                                  │
│  Knowledge Graph (NetworkX · 20 procedures · TN) │
│  SQLite (SQLModel) · ReportLab · Ollama LLM      │
└─────────────────────────────────────────────────┘
```

**Key design decisions:**
- **Deterministic-first**: All agents work without LLM calls — the KG handles logic, Ollama only polishes language. No LLM = still fully functional.
- **SSE streaming**: Agents stream responses as they work, so the UI updates in real time — no spinner waiting for a monolithic response.
- **Local LLM**: Ollama runs `llama3.2:latest` locally. Zero API cost, zero data sent to any cloud.

---

## Features

| Feature | Description |
|---------|-------------|
| 🗣️ **Voice Input** | Speak in Tamil, Hindi, or English — Web Speech API with locale detection |
| 📸 **Document Scanner** | Point camera at Aadhaar/documents → fields auto-extracted via vision model |
| 📊 **D3 Dependency Graph** | Interactive force-directed graph of procedure dependencies — drag, hover, click |
| ⌨️ **Command Palette** | Ctrl+K power search across all pages, procedures, and actions |
| 💡 **Smart Suggestions** | Context-aware chips after each agent response — next steps, not just answers |
| 📖 **Contextual Glossary** | Hover any bureaucratic term (RTI, Tahsildar, Patta...) to see plain-English + Tamil definition |
| 🌙 **Dark Mode** | Full dark/light/system theme with CSS custom properties — no flash on load |
| 📄 **PDF Viewer** | Preview generated forms in-app before downloading |
| 📦 **Document Kit** | One-click export of all forms + checklist + office schedule as a single PDF |
| ⚡ **RTI Generation** | Auto-drafted Right to Information application with exact legal citations |
| ⏰ **Deadline Tracker** | Statutory deadlines with overdue alerts and browser notifications |
| 🏆 **Success Stories** | Anonymised real cases with before/after time and cost metrics |
| 📈 **Stats Dashboard** | Live metrics: case counts, procedure distribution, language breakdown |
| 🗂️ **Multi-Case** | Save and resume multiple cases simultaneously |
| 🔗 **WhatsApp Share** | Share your procedure plan with family via Web Share API |
| 🎓 **Onboarding** | 5-step tutorial on first visit; never shown again |
| ⌨️ **Keyboard Shortcuts** | Ctrl+K palette, Ctrl+/ shortcuts, Ctrl+D dark mode, Ctrl+E language cycle |

---

## Tech Stack

**Frontend**
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + CVA (class-variance-authority)
- Framer Motion (animations + page transitions)
- D3.js (procedure dependency graph — lazy loaded)
- Zustand (global state)

**Backend**
- FastAPI + Python 3.11
- SQLModel + SQLite (case + feedback persistence)
- NetworkX (knowledge graph traversal)
- ReportLab (PDF generation)
- Ollama (local LLM: llama3.2:latest + llava for vision)

**Design System**
- "Government meets Humanity" — saffron + navy + ivory palette
- DM Serif Display (headings) + Source Sans 3 (body)
- Noto Sans Tamil + Noto Sans Devanagari (multilingual)

---

## Quick Start

**Prerequisites:** Python 3.11+, Node.js 20+, [Ollama](https://ollama.ai/) installed

```bash
# 1. Clone
git clone https://github.com/haarez/nyayamitra
cd nyayamitra

# 2. Backend
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # Mac/Linux
pip install -e .
uvicorn nyayamitra.main:app --reload

# 3. Pull LLM (optional — works in deterministic mode without it)
ollama pull llama3.2

# 4. Frontend (new terminal)
cd ../frontend
npm install
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)**.

### Docker (one command)
```bash
docker-compose up --build
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LLM_MODE` | `hybrid` | `hybrid` uses Ollama; `deterministic_only` skips LLM entirely |
| `DEMO_MODE` | `false` | `true` serves pre-cached demo responses (stage-reliable) |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama server URL |
| `DATABASE_URL` | `sqlite:///./data/nyayamitra.db` | SQLite path |

---

## Project Structure

```
nyayamitra/
├── backend/
│   ├── nyayamitra/
│   │   ├── agents/          # 6 AI agents (intake, planner, document, navigation, escalation, i18n)
│   │   ├── api/             # FastAPI routes (chat SSE, cases, procedures, feedback, export, OCR)
│   │   ├── db/              # SQLModel models (CaseRecord, FeedbackRecord)
│   │   ├── kg/              # Knowledge graph (NetworkX + 20 Tamil Nadu procedures)
│   │   ├── llm/             # LLM abstraction (OllamaProvider + DeterministicProvider)
│   │   ├── schemas/         # Pydantic models (CaseFile, ProcedurePlan)
│   │   └── tools/           # Kit generator, vision/OCR tools, KG query tools
│   └── tests/               # 75+ pytest tests
├── frontend/
│   ├── app/                 # 10 Next.js routes (/, /chat, /case/[id], /cases, /procedures, /stats, /stories, /design-system)
│   ├── components/          # 40+ React components
│   └── lib/                 # Store, API client, glossary, suggestions, commands, shortcuts
├── docker-compose.yml
└── LICENSE
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chat` | SSE stream — send message, receive agent events |
| `GET` | `/api/case/{id}` | Get case state |
| `GET` | `/api/cases` | List all saved cases |
| `POST` | `/api/case/{id}/export-kit` | Generate PDF document kit (base64) |
| `GET` | `/api/navigation/{id}` | Office navigation details for a case |
| `GET` | `/api/escalation/{id}` | RTI escalation letter for a case |
| `GET` | `/api/procedures` | All 20 KG procedures |
| `GET` | `/api/stats` | Aggregated usage metrics |
| `POST` | `/api/feedback` | Submit rating (1/-1) with optional comment |
| `GET` | `/api/feedback/summary` | Satisfaction metrics by procedure |
| `POST` | `/api/ocr` | Extract fields from document image (base64) |

---

## Running Tests

```bash
cd backend
pytest                                        # all 75+ tests
pytest tests/test_kg.py -v                   # knowledge graph unit tests
pytest tests/test_api_endpoints.py -v        # API integration tests
pytest tests/test_llm_client.py -v           # LLM abstraction tests
```

---

## Roadmap

- [ ] Karnataka + Maharashtra procedure knowledge graphs
- [ ] Telugu and Kannada language support
- [ ] WhatsApp bot integration (Twilio)
- [ ] SMS fallback for feature phones
- [ ] Offline PWA mode
- [ ] Community-contributed procedure database

---

## Contributing

See [CONTRIBUTING.md](.github/CONTRIBUTING.md). The highest-leverage contribution is adding more procedures to `backend/nyayamitra/kg/procedures.json`.

---

## Author

**Mohammed Haarez** — 2nd year B.Tech, Chennai Institute of Technology

Built solo for a hackathon in 2026.

[GitHub](https://github.com/haarez) · [LinkedIn](https://linkedin.com/in/haarez)

---

*NyayaMitra means "Friend of Justice" in Sanskrit.*  
*नयामित्र · நீதிமித்ரா*
