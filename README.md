# NyayaMitra

> *An agentic AI system that handles Indian government bureaucracy for the 700M citizens who can't afford a lawyer.*

## What is NyayaMitra?

NyayaMitra is a multi-agent AI system that takes a natural-language description of a citizen's life event — a death in the family, a marriage, a pension rejection — and autonomously:

1. **Identifies** every required government procedure across departments
2. **Generates** a personalized action plan with auto-filled forms
3. **Navigates** the user step-by-step with office locations, timings, and what to say
4. **Escalates** via RTI/grievance channels if any office stalls

### The Problem

Every Indian family loses weeks, months, and ₹thousands navigating government offices they don't understand. The current system: ask a relative, get conflicting advice, visit a government office, get rejected, pay a tout ₹500–₹50,000.

**NyayaMitra replaces tout + lawyer + accountant with one conversation.**

## Architecture

```
                        ┌──────────────────────┐
                        │   ORCHESTRATOR AGENT │
                        │   (LangGraph root)   │
                        └──────────┬───────────┘
                                   │
        ┌──────────────┬───────────┼───────────┬──────────────┐
        ▼              ▼           ▼           ▼              ▼
   INTAKE        PROCEDURE    DOCUMENT    NAVIGATOR    ESCALATION
    AGENT          AGENT        AGENT       AGENT        AGENT
```

6 specialized agents, each with a clear role — coordinated by a LangGraph state machine.

## Built With

![Python](https://img.shields.io/badge/Python-3.11+-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-green?logo=fastapi)
![LangGraph](https://img.shields.io/badge/LangGraph-0.4+-orange)

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-blue?logo=tailwindcss)

## Quick Start

```bash
# Clone
git clone https://github.com/haarez/nyayamitra.git
cd nyayamitra

# Backend
cd backend
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -e ".[dev]"
cp ../.env.example ../.env  # Add your LLM_API_KEY
uvicorn main:app --reload

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

## Roadmap

- [x] Phase 0 — Project scaffolding
- [ ] Phase 1 — Procedure Knowledge Graph (20 TN procedures)
- [ ] Phase 2 — Single-agent vertical slice
- [ ] Phase 3 — Multi-agent orchestration
- [ ] Phase 4 — Document & Navigator agents
- [ ] Phase 5 — Escalation Agent + Memory
- [ ] Phase 6 — Frontend (chat + timeline animation)
- [ ] Phase 7 — Demo polish

## Full Spec

See [`NYAYAMITRA_PROJECT_SPEC.md`](../AGENTIC_AI_BUREAUCRACY_NAVIGATION_SYSTEM.md) for the complete project specification.

## Author

**Haarez** — B.Tech Software Engineering, Chennai Institute of Technology (Batch 2024–2028)

---

*"Today, this process takes a Chennai family 6 months and ₹15,000 in agent fees. With NyayaMitra: 3 weeks and zero rupees."*
