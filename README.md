PaperTrail-AI — AI Bureaucracy Navigator

> **Agentic AI that navigates Indian government bureaucracy — for the 700 million citizens who can't afford a lawyer.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/)
[![Next.js 14](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688.svg)](https://fastapi.tiangolo.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6.svg)](https://www.typescriptlang.org/)
[![Ollama](https://img.shields.io/badge/LLM-Ollama%20%28optional%29-FF6F00.svg)](https://ollama.ai/)
[![SQLite](https://img.shields.io/badge/DB-SQLite-003B57.svg)](https://www.sqlite.org/)
[![Zero LLM Required](https://img.shields.io/badge/LLM-optional%20%E2%80%94%20works%20without%20it-green.svg)](#)

---

## The Problem

When someone dies in India, their family must navigate **11+ government procedures** across 6 departments — death certificate, legal heir certificate, pension transfer, property mutation, bank KYC updates, and more. Each procedure requires different forms, different offices, different documents, and different legal citations. Most families spend **3–6 months** and pay **₹10,000–₹25,000 to middlemen** just to figure out where to start.

They don't need a lawyer. They need a map.

---

## The Solution

PaperTrail-AI is a **6-agent AI system** that:
- Understands your situation in **Tamil, Hindi, or English** — including voice input
- Automatically identifies **every government procedure** you need, in order, with dependencies
- Generates **pre-filled PDF forms** ready to print, sign, and submit
- Tells you **exactly which office to visit**, what counter, what hours, what to say
- Drafts **RTI escalation letters** citing exact legal provisions if any office delays beyond the statutory deadline
- Tracks **response deadlines** and alerts you when to escalate
- Works **completely offline** once set up — no API keys, no cloud, no cost

**The system runs in full deterministic mode with zero LLM calls.** Ollama (llama3.2) is an optional polish layer. Everything works without it.

---

## Demo

| Chat → Plan | Procedure Detail | Offline Kit |
|---|---|---|
| *Type or speak your situation — get a full procedure plan with timelines and fees* | *3-tab detail: Generate Form · Navigate · Escalate with RTI chain* | *Print-ready HTML kit — works with no internet at government office* |

> 🎬 **[Watch the 90-second demo →](#)** *(link after recording)*

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                   Browser (390px → 1920px)                    │
│  Next.js 14 App Router · Framer Motion · Zustand · D3.js     │
│  Voice input · Command palette · Dark mode · i18n (3 langs)  │
│  10 routes · 40+ components · localStorage persistence       │
└────────────────────────────┬─────────────────────────────────┘
                             │  SSE streaming / REST
┌────────────────────────────▼─────────────────────────────────┐
│                       FastAPI Backend                         │
│                                                               │
│   ┌──────────┐    ┌──────────┐    ┌──────────────────────┐  │
│   │  Intake  │ →  │ Planner  │ →  │  Document Agent      │  │
│   │  Agent   │    │  Agent   │    │  ReportLab PDF gen   │  │
│   │ <1ms det.│    │  KG topo │    │  pre-filled forms    │  │
│   └──────────┘    └────┬─────┘    └──────────────────────┘  │
│                        │                                      │
│   ┌──────────┐    ┌────▼──────┐   ┌──────────────────────┐  │
│   │Escalation│    │Navigation │   │    Orchestrator       │  │
│   │  Agent   │    │  Agent    │   │  asyncio state mach  │  │
│   │RTI drafts│    │Office KG  │   │  SSE · SSR fallback  │  │
│   └──────────┘    └───────────┘   └──────────────────────┘  │
│                                                               │
│   Knowledge Graph: NetworkX · 20 TN procedures · typed edges │
│   Persistence: SQLite (SQLModel) · PT-YYYY-XXXX human IDs    │
│   LLM: Ollama llama3.2 optional · deterministic fallback <1ms│
└──────────────────────────────────────────────────────────────┘
```

---

## Features

### Core AI Pipeline
| Feature | Description |
|---|---|
| 🤖 **6-Agent Pipeline** | Intake → Planner → Document → Navigation → Escalation → Orchestrator |
| 🧠 **Deterministic-First** | Every agent works without LLM — KG traversal + topological sort in <1ms |
| 🌐 **3-Language Support** | Tamil, Hindi, English — voice and text — script auto-detection |
| 📊 **Knowledge Graph** | NetworkX graph of 20 Tamil Nadu procedures with typed dependency edges |
| ⚡ **SSE Streaming** | First byte in <1ms (ack event) — browser sees progress before LLM finishes |
| 🔄 **Graceful Fallback** | LLM timeout (8s) → silent fallback to deterministic — zero crashes |

### Document & Forms
| Feature | Description |
|---|---|
| 📄 **Pre-filled PDFs** | ReportLab forms auto-filled with case data — print and sign |
| 📦 **ZIP Export** | All forms + plan + README in one downloadable kit |
| 🖨️ **Offline HTML Kit** | Self-contained print-ready file — office addresses, checklists, receipt stubs, emergency numbers |
| 📸 **Document Scanner** | Camera → Aadhaar/document OCR via vision model |
| 🔍 **Rejection Pre-Scanner** | Procedure-specific readiness checklist before you go — live score % |

### Navigation & Escalation
| Feature | Description |
|---|---|
| 🗺️ **Office Navigation** | Address, counter, hours, avg wait, best time — Google Maps + Apple Maps links |
| 🧠 **Office Intelligence** | Crowd-sourced tips per office type (corporation, treasury, tahsildar) |
| ⚖️ **RTI Escalation** | Auto-drafted RTI application with exact legal citations |
| 📝 **First Appeal** | Auto-dated First Appeal letter template (30-day trigger) |
| 🏛️ **Second Appeal** | CIC Second Appeal template + online submission link (45-day trigger) |
| 📜 **Legal Precedents** | RTI Act sections and case citations with copy-to-clipboard |

### Deadline & Tracking
| Feature | Description |
|---|---|
| ⏰ **Deadline Countdown** | Color-coded pills: green → yellow → orange → pulsing red when overdue |
| ✅ **Mark as Submitted** | Record submission with optional receipt reference — starts 21-day clock |
| 💾 **Session Persistence** | Zustand + localStorage — case survives refresh, back navigation, tab close |

### Intelligence
| Feature | Description |
|---|---|
| 🎯 **Success Probability** | Per-procedure score (55–95%) with risk bullets and boost bullets |
| 💰 **Cost Comparison** | PaperTrail AI (govt fees only) vs middleman agent — savings displayed |

### UX & Interface
| Feature | Description |
|---|---|
| 🗣️ **Voice Input** | Web Speech API — speak in Tamil/Hindi/English |
| ⌨️ **Command Palette** | Ctrl+K — instant search across pages, procedures, actions |
| 🌙 **Dark Mode** | Light / dark / system — no flash on load |
| 📱 **Mobile-First** | Fully responsive 390px → 1920px |
| 💡 **Step Guide** | Floating guide bar for first-time users |
| 🔊 **Sound Effects** | Web Audio API feedback — mutable |
| 🟢 **System Status** | Live health indicator — green/yellow/red |
| 📡 **Agent Trace** | Expandable reasoning trace showing which agent did what |

### Data & Sharing
| Feature | Description |
|---|---|
| 🗂️ **Multi-Case** | Save and resume multiple simultaneous cases |
| 📈 **Stats Dashboard** | Live metrics: case counts, procedure distribution, language breakdown |
| 🔗 **Share Case** | Copy link or WhatsApp share to track progress with family |
| 👁️ **Shared Case Page** | Public read-only view at `/shared/[caseId]/[token]` |
| 🏆 **Success Stories** | Anonymised real cases with before/after time and cost |
| 📊 **D3 Dependency Graph** | Interactive force-directed procedure graph — drag, hover, zoom |
| 🗣️ **WhatsApp RTI Share** | Pre-formatted message to ask family to post RTI letter |

---

## Quick Start

### Option A — Docker (recommended, 3 commands)

```bash
git clone https://github.com/haarez018/PaperTrail-AI && cd PaperTrail-AI
docker-compose up --build
# Open http://localhost:3000
```

### Option B — Manual (5 commands)

```bash
# 1. Clone
git clone https://github.com/haarez018/PaperTrail-AI && cd PaperTrail-AI

# 2. Backend (Python 3.11+)
cd backend && pip install -e . && uvicorn main:app --reload --port 8000

# 3. Frontend (Node 20+)
cd ../frontend && npm install && npm run dev

# 4. Open http://localhost:3000
```

**No Ollama required.** The system runs in `deterministic_only` mode by default — full functionality, responses under 5ms. To enable LLM polish:

```bash
ollama pull llama3.2        # install Ollama first: https://ollama.ai
# set LLM_MODE=hybrid in .env
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `LLM_MODE` | `deterministic_only` | `hybrid` uses Ollama; `deterministic_only` skips LLM entirely |
| `DEMO_MODE` | `false` | `true` serves pre-cached demo responses (for hackathon demos) |
| `OLLAMA_HOST` | `http://localhost:11434` | Ollama server URL |
| `DATABASE_URL` | `sqlite:///./data/papertrail.db` | SQLite path |
| `FRONTEND_URL` | `http://localhost:3000` | CORS allowed origin |
| `LLM_TIMEOUT_SECONDS` | `8` | Timeout before falling back to deterministic |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend URL for frontend |

---

## Deployment

### Frontend → Vercel

```bash
cd frontend
npx vercel --prod
# Set NEXT_PUBLIC_API_URL=https://your-railway-backend.up.railway.app
```

### Backend → Railway

```bash
# In Railway dashboard:
# 1. New project → Deploy from GitHub → select /backend
# 2. Set env vars: LLM_MODE=deterministic_only, DEMO_MODE=true
# 3. Set start command: uvicorn main:app --host 0.0.0.0 --port $PORT
```

> **Note on LLM in production:** Ollama cannot run on Railway's free tier (no GPU). Set `LLM_MODE=deterministic_only` for the public deployment. All features remain fully functional — the deterministic engine handles everything.

---

## Design Philosophy

**Deterministic-first, LLM-optional.** Every agent works without any language model using keyword extraction, word-boundary regex, and a NetworkX knowledge graph. The KG encodes Tamil Nadu's 20 most common procedures as typed nodes with dependency edges — `build_procedure_plan()` runs a topological sort in under 1ms.

**SSE over polling.** The browser receives the first event in <1ms (an `ack` before any processing starts), then receives streamed updates as each agent completes. No polling loops, no "loading for 30 seconds" UX.

**Human-readable IDs.** Case IDs are `PT-2026-K7MR`, not UUIDs. Citizens should be able to write their case ID on a piece of paper.

**Language is sacred.** The user's selected language follows them across every agent, every response, every PDF. Agents can upgrade (Tamil Unicode detected → confirmed Tamil) but never downgrade.

**Offline-capable.** The Offline HTML Kit generates a self-contained file that works with zero network. Citizens go to government offices in areas with poor connectivity — the app accounts for this.

---

## Project Structure

```
papertrail/
├── backend/
│   ├── main.py                    # FastAPI entrypoint + CORS
│   └── papertrail/
│       ├── agents/                # 6 agents: intake, orchestrator, procedure,
│       │                          #   document, navigation, escalation
│       ├── api/                   # Routes: chat SSE, cases, export, documents,
│       │                          #   feedback, OCR, procedures, stats
│       ├── db/                    # SQLModel models: CaseRecord, FeedbackRecord
│       ├── kg/                    # NetworkX KG + procedures.json (20 TN procs)
│       ├── llm/                   # Ollama client + deterministic fallback
│       ├── schemas/               # Pydantic: CaseFile, ProcedurePlan, etc.
│       └── tools/                 # Kit generator, OCR, KG query tools
├── frontend/
│   ├── app/                       # 10 Next.js routes + loading.tsx skeletons
│   │   ├── chat/                  # Main chat interface
│   │   ├── case/[id]/             # Case dashboard + procedure detail
│   │   ├── cases/                 # Multi-case list
│   │   ├── procedures/            # Knowledge graph explorer
│   │   ├── stories/               # Success stories
│   │   ├── stats/                 # Performance dashboard
│   │   └── shared/[caseId]/[token]/ # Public read-only case view
│   ├── components/                # 40+ components
│   │   ├── ProcedureDetail.tsx    # 3-tab detail panel (all 35 features here)
│   │   ├── ProcedureTimeline.tsx  # D3 + success scores + dependency graph
│   │   ├── RejectionScanner.tsx   # Pre-submission readiness modal
│   │   ├── LegalPrecedents.tsx    # RTI Act citations
│   │   ├── CostComparison.tsx     # Agent vs PaperTrail cost card
│   │   ├── OfflineKitButton.tsx   # Offline HTML kit generator
│   │   ├── DeadlineCountdown.tsx  # Live deadline pill bar
│   │   ├── ShareCaseButton.tsx    # Copy link + WhatsApp share
│   │   └── ui/                    # Design system: Button, Card, Badge, etc.
│   └── lib/
│       ├── store.ts               # Zustand (persist → localStorage)
│       ├── api.ts                 # Typed API client
│       ├── successScore.ts        # Success probability engine
│       └── i18n/                  # Tamil/Hindi/English strings
├── docker-compose.yml             # Full stack: Ollama + backend + frontend
├── .env.example                   # All environment variables documented
└── README.md
```

---

## Roadmap

- [ ] **Karnataka + Maharashtra KG** — extend beyond Tamil Nadu (60% of India)
- [ ] **Telugu and Kannada** — Noto fonts ready, need i18n strings
- [ ] **WhatsApp bot** — Twilio SMS for feature-phone users
- [ ] **Offline PWA** — service worker + IndexedDB for zero-network use
- [ ] **Community accuracy** — open contribution model for procedure data

---

## Author

**Mohammed Haarez**
2nd-year B.Tech · Chennai Institute of Technology · Built solo, 2026

[![GitHub](https://img.shields.io/badge/GitHub-haarez018-181717?logo=github)](https://github.com/haarez018)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Mohammed%20Haarez-0A66C2?logo=linkedin)](https://www.linkedin.com/in/mohammed-haarez-sulaiman-s/)

---

*PaperTrail AI — Clearing the path through Indian bureaucracy. Free forever. Government fees only.*

<!-- Built by Mohammed Haarez Sulaiman S -->
