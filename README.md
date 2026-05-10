<h1 align="center">
  <br>
  NyayaMitra
  <br>
</h1>

<p align="center">
  <strong>The agentic AI lawyer, accountant, and navigator for the 700 million Indians who can't afford one.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.11+-blue?logo=python" alt="Python" />
  <img src="https://img.shields.io/badge/FastAPI-0.115+-green?logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/LangGraph-0.4+-orange" alt="LangGraph" />
  <img src="https://img.shields.io/badge/Ollama-llama3.2-purple?logo=ollama" alt="Ollama" />
  <img src="https://img.shields.io/badge/Next.js-14-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-blue?logo=tailwindcss" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Framer_Motion-11-pink?logo=framer" alt="Framer Motion" />
</p>

---

## The Problem

Every Indian family loses weeks, months, and thousands of rupees navigating government offices they don't understand. The current system: ask a relative, get conflicting advice, visit an office, get rejected, pay a tout. **NyayaMitra replaces tout + lawyer + accountant with one conversation.**

## The Solution

Tell NyayaMitra what happened in Tamil, Hindi, or English. Six AI agents identify every procedure, generate pre-filled forms, guide you to the right office, and auto-draft RTI applications if anything stalls.

## Architecture

NyayaMitra uses a **hybrid deterministic + LLM** architecture. The knowledge graph, procedure rules, form templates, and office data are all deterministic — sourced from government gazettes. The LLM (Ollama/llama3.2) handles only natural language tasks: understanding the user's situation, translating responses, and drafting escalation letters. This means the system is accurate even when the LLM is offline.

```
                        ┌──────────────────────┐
                        │   ORCHESTRATOR       │
                        │   (LangGraph FSM)    │
                        └──────────┬───────────┘
                                   │
        ┌──────────────┬───────────┼───────────┬──────────────┐
        v              v           v           v              v
   INTAKE        PROCEDURE    DOCUMENT    NAVIGATOR    ESCALATION
    AGENT          AGENT        AGENT       AGENT        AGENT
                                                              │
                                                         i18n AGENT
```

| Agent | Role | Deterministic or LLM |
|-------|------|---------------------|
| Intake | Understands the life event | LLM for language, KG for classification |
| Planner | Maps every required procedure | Fully deterministic (KG traversal) |
| Document | Generates pre-filled PDF forms | Deterministic templates |
| Navigator | Office location, timings, what to say | Deterministic data + LLM for phrasing |
| Escalation | Drafts RTI / grievance letters | LLM for drafting, deterministic for legal citations |
| i18n | Translates to Tamil / Hindi | LLM |

## Key Features

- **Multi-language chat** — Tamil, Hindi, and English with real-time toggle
- **Procedure timeline** — Visual progress tracker with dependency arrows and day estimates
- **Auto-generated PDF forms** — Pre-filled with user details, ready to print and submit
- **Office navigation** — Counter numbers, timings, wait estimates, and what to say
- **RTI escalation** — One-click legally valid RTI applications when offices stall
- **Dark mode** — Full dark theme with CSS variable token swapping
- **Responsive design** — Works on desktop (1440px) and mobile (390px)
- **Skeleton loading states** — No blank screens, ever

## Quick Start

```bash
# 1. Clone
git clone https://github.com/haarez/nyayamitra.git
cd nyayamitra

# 2. Backend
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -e ".[dev]"
uvicorn main:app --reload       # Starts on :8000

# 3. LLM (new terminal)
ollama pull llama3.2:latest     # 2GB download, runs locally

# 4. Frontend (new terminal)
cd frontend
npm install
npm run dev                     # Starts on :3000
```

Open [http://localhost:3000](http://localhost:3000) and tell NyayaMitra what happened.

## Design Decisions

**Why deterministic + LLM hybrid, not pure LLM?**

Pure LLM systems hallucinate government procedures. A chatbot that tells you the wrong office, wrong form, or wrong legal provision is worse than no help at all. NyayaMitra's knowledge graph contains 20+ Tamil Nadu procedures sourced from government gazettes — every fee, every document requirement, every legal citation is verified. The LLM only handles what it's good at: understanding natural language and generating human-readable text. If the LLM goes down, the system still works — it just can't translate or draft letters.

## Project Structure

```
nyayamitra/
├── backend/
│   ├── nyayamitra/
│   │   ├── agents/         # 6 specialized agents
│   │   ├── knowledge/      # Procedure knowledge graph
│   │   ├── llm/            # Ollama LLM provider layer
│   │   └── schemas/        # Pydantic models
│   ├── data/               # Procedure YAML definitions
│   ├── tests/              # 47 tests
│   └── main.py             # FastAPI app
├── frontend/
│   ├── app/                # Next.js pages (chat, case, design-system)
│   ├── components/
│   │   ├── chat/           # ChatBubble, ChatInput, WelcomeScreen
│   │   └── ui/             # 15 design system components
│   └── lib/                # API client, Zustand store, i18n
└── docs/                   # Architecture diagrams
```

## Roadmap

- [x] Phase 0-7 — Core backend (KG, agents, orchestrator, API)
- [x] Phase 8 — LLM migration (Ollama/llama3.2, deterministic fallback)
- [x] Phase 1-10 — Frontend upgrade (design system, chat, timeline, a11y, i18n)
- [x] Phase 11 — Dark mode (CSS variable token architecture)
- [x] Phase 12 — Microinteractions (animations, empty/error states)
- [x] Phase 13 — Code quality (zero `any` types, error boundaries, JSDoc)
- [x] Phase 14 — README & portfolio
- [ ] WhatsApp bot integration
- [ ] Voice interface (Tamil/Hindi speech-to-text)
- [ ] Expand to all Indian states (currently Tamil Nadu only)
- [ ] Community-sourced procedure updates

## Author

**Haarez** — B.Tech Software Engineering, Chennai Institute of Technology (Batch 2024-2028)

---

*"Today, this process takes a Chennai family 6 months and 15,000 rupees in agent fees. With NyayaMitra: 3 weeks and zero rupees."*
