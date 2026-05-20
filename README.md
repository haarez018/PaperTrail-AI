# PaperTrail AI

> **Agentic AI that navigates Indian government bureaucracy — for the 700 million citizens who can't afford a lawyer.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/)
[![Next.js 14](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688.svg)](https://fastapi.tiangolo.com/)
[![Ollama](https://img.shields.io/badge/LLM-Ollama-FF6F00.svg)](https://ollama.ai/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6.svg)](https://www.typescriptlang.org/)
[![SQLite](https://img.shields.io/badge/DB-SQLite-003B57.svg)](https://www.sqlite.org/)

---

## The Problem

When someone dies in India, their family must navigate **11+ government procedures** across 6 departments — death certificate, legal heir certificate, pension transfer, property mutation, bank KYC, and more. Each requires different forms, different offices, and different documents. Most families spend **3–6 months** and pay **₹10,000–₹25,000** to middlemen just to figure out where to start.

---

## The Solution

PaperTrail AI is a **6-agent AI system** that understands your situation in Tamil, Hindi, or English, then automatically identifies every government procedure you need, generates pre-filled PDF forms, tells you exactly which office to visit and what to say, and drafts RTI escalation letters if any official delays beyond the legal deadline. It works offline, costs nothing, and runs entirely on your machine.

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                   Browser (390px → 1920px)            │
│  Next.js 14 App Router · Framer Motion · Zustand     │
│  D3 force graph · Voice input · Command palette       │
│  10 routes · dark mode · Tamil/Hindi/English i18n    │
└────────────────────────┬─────────────────────────────┘
                         │  Server-Sent Events (SSE)
┌────────────────────────▼─────────────────────────────┐
│                   FastAPI Backend                     │
│                                                       │
│  ┌──────────┐   ┌──────────┐   ┌───────────────┐    │
│  │  Intake  │ → │ Planner  │ → │   Document    │    │
│  │  Agent   │   │  Agent   │   │    Agent      │    │
│  │ <1ms det.│   │ KG query │   │  ReportLab PDF│    │
│  └──────────┘   └──────────┘   └───────────────┘    │
│                      │                                │
│  ┌──────────┐   ┌────▼─────┐   ┌───────────────┐    │
│  │Escalation│   │Navigation│   │  Orchestrator │    │
│  │  Agent   │   │  Agent   │   │  (state mach) │    │
│  │RTI drafts│   │ Offices  │   │  asyncio SSE  │    │
│  └──────────┘   └──────────┘   └───────────────┘    │
│                                                       │
│  Knowledge Graph: NetworkX · 20 TN procedures        │
│  Persistence: SQLite (SQLModel) · PT-YYYY-XXXX IDs   │
│  LLM: Ollama llama3.2 (optional) · det. fallback     │
└──────────────────────────────────────────────────────┘
```

---

## Features

| Feature | Description |
|---|---|
| 🤖 **6 AI Agents** | Intake → Planner → Document → Navigation → Escalation → Orchestrator |
| 🗣️ **Voice Input** | Speak Tamil, Hindi, or English — Web Speech API with locale detection |
| 📸 **Document Scanner** | Point camera at Aadhaar/documents → auto-extracted via vision model |
| 📊 **D3 Dependency Graph** | Interactive force-directed dependency graph — drag, hover, click |
| ⌨️ **Command Palette** | Ctrl+K — power search across all pages, procedures, and actions |
| 💡 **Step Guide** | Floating bar that guides first-time users through each phase |
| 📄 **Pre-filled PDFs** | Forms auto-filled with your case data — print and sign |
| 📦 **Document Kit** | All forms + checklist + office schedule exported as one PDF |
| ⚡ **RTI Escalation** | Auto-drafted Right to Information application with exact law citations |
| ⏰ **Deadline Tracker** | Statutory deadlines with overdue alerts |
| 🌙 **Dark Mode** | Light / dark / system — no flash on load |
| 🗂️ **Multi-Case** | Save and resume multiple cases simultaneously |
| 📈 **Stats Dashboard** | Live metrics: case counts, procedure distribution, language breakdown |
| 🏆 **Success Stories** | Anonymised real cases with before/after time and cost metrics |
| 🔊 **Sound Effects** | Web Audio API whoosh/ding feedback — mutable |
| 🟢 **System Status** | Live health indicator — green/yellow/red based on backend mode |

### Screenshots

| Chat Interface | Procedure Timeline | Mobile (390px) |
|---|---|---|
| _(screenshot)_ | _(screenshot)_ | _(screenshot)_ |

---

## Tech Stack

**Frontend**
- Next.js 14 (App Router) + TypeScript — SSR, lazy imports, `loading.tsx` skeletons
- Tailwind CSS + CVA — custom `xs/sm/md` breakpoints, CSS custom properties design tokens
- Framer Motion — page transitions, slide animations, `AnimatePresence`
- D3.js — force-directed procedure dependency graph (lazy-loaded)
- Zustand — global state (messages, plan, caseId, language, traces)

**Backend**
- FastAPI + Python 3.11 — async, SSE streaming via `sse-starlette`
- SQLModel + SQLite — case persistence with `PT-YYYY-XXXX` human-readable IDs
- NetworkX — knowledge graph traversal + topological sort
- ReportLab — PDF generation (forms, kits, chat exports)
- Ollama (`llama3.2:latest`) — optional LLM polish; system fully functional without it

---

## Quick Start

```bash
# 1. Clone and enter project
git clone https://github.com/haarez/papertrail-ai && cd papertrail-ai

# 2. Install and start backend  (Python 3.11+ required)
cd backend && pip install -e . && python -m uvicorn main:app --reload --port 8000

# 3. Pull the local LLM (optional — skip for instant deterministic mode)
ollama pull llama3.2

# 4. Install and start frontend  (Node 20+ required)
cd ../frontend && npm install && npm run dev

# 5. Open http://localhost:3000 and type your situation
```

> **No Ollama?** The system runs in `deterministic_only` mode by default — responses in under 5ms with no LLM. Set `LLM_MODE=hybrid` in `.env` to enable Ollama polish.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `LLM_MODE` | `deterministic_only` | `hybrid` uses Ollama; `deterministic_only` skips LLM (instant, reliable) |
| `DEMO_MODE` | `false` | `true` serves pre-cached demo responses (stage-reliable for judges) |
| `OLLAMA_HOST` | `http://localhost:11434` | Ollama server URL |
| `DATABASE_URL` | `sqlite:///./data/nyayamitra.db` | SQLite path |
| `FRONTEND_URL` | `http://localhost:3000` | CORS allowed origin |
| `LLM_TIMEOUT_SECONDS` | `8` | Per-request LLM timeout before deterministic fallback |

---

## Design Decisions

PaperTrail AI is built **deterministic-first**: every agent works without any LLM, using keyword extraction, word-boundary regex, and a NetworkX knowledge graph. The KG encodes Tamil Nadu's 20 most common procedures as nodes with typed dependency edges — `build_procedure_plan()` runs a topological sort in under 1ms. Ollama is an optional polish layer that improves natural-language responses when available, but the system degrades gracefully to keyword-only mode the moment the LLM times out (8s hard cap, 1 retry). SSE streaming means the browser sees the first byte in under 1ms — a single `ack` event fires before any processing begins. Language selection is a sacred UI preference: the `_UI_LANG_MAP` in `routes_chat.py` sets the language on the `CaseFile` before any agent runs, and agents can only *upgrade* to a detected script (Tamil Unicode seen → Tamil confirmed), never downgrade. Human-readable case IDs (`PT-2026-K7MR`) replace UUIDs so users can write them on paper.

---

## Roadmap

- [ ] **Karnataka + Maharashtra KG** — expand beyond Tamil Nadu to cover 60% of India's population
- [ ] **Telugu and Kannada language support** — Noto fonts already in layout, need i18n strings
- [ ] **WhatsApp bot** — Twilio integration so feature-phone users get the same guidance via SMS
- [ ] **Offline PWA** — service worker + IndexedDB so the app works with zero network
- [ ] **Community procedure database** — open contribution model for procedure accuracy across states

---

## Project Structure

```
papertrail-ai/
├── backend/
│   └── nyayamitra/
│       ├── agents/       # 6 agents: intake, orchestrator, procedure, document, navigation, escalation
│       ├── api/          # FastAPI routes: chat SSE, cases, export, feedback, documents, OCR
│       ├── db/           # SQLModel: CaseRecord, FeedbackRecord
│       ├── kg/           # NetworkX KG + procedures.json (20 Tamil Nadu procedures)
│       ├── llm/          # LLM abstraction: OllamaClient + deterministic fallback
│       ├── schemas/      # Pydantic: CaseFile, ProcedurePlan, CaseContext
│       └── tools/        # Kit generator, vision/OCR, KG query tools
├── frontend/
│   ├── app/             # 10 Next.js routes + loading.tsx skeletons
│   ├── components/      # 40+ components: chat, timeline, detail, modals, ui
│   └── lib/             # store, api, sounds, i18n, guideSteps, suggestions, hooks
├── .env                 # All config (LLM_MODE=deterministic_only by default)
├── docker-compose.yml
└── README.md
```

---

## Author

**Mohammed Haarez**
2nd-year B.Tech · Chennai Institute of Technology · Built solo for hackathon 2026

[GitHub](https://github.com/haarez) · [LinkedIn](https://linkedin.com/in/haarez)

---

*PaperTrail AI — Clearing the path through Indian bureaucracy. Free forever. Government fees only.*
