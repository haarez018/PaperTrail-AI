# PaperTrail AI Backend

Multi-agent AI system for navigating Indian government bureaucracy.

## Quick Start

### Prerequisites
- Python 3.11+
- [Ollama](https://ollama.com/) with `llama3.2` model

### Setup

```bash
# 1. Install Ollama and pull the model
ollama pull llama3.2

# 2. Create virtual environment
cd backend
python -m venv .venv
.venv/Scripts/activate   # Windows
# source .venv/bin/activate  # Linux/Mac

# 3. Install dependencies
pip install -e ".[dev]"

# 4. Configure environment
cp ../.env.example ../.env
# Edit .env if needed (defaults work for local development)

# 5. Verify Ollama connection
python ../scripts/verify_ollama.py

# 6. Run the server
uvicorn main:app --reload
```

### Running Tests

```bash
pytest tests/ -v
```

## Architecture

### LLM Modes

Set `LLM_MODE` in `.env`:

| Mode | Behavior |
|------|----------|
| `hybrid` (default) | LLM for intake conversation + free-text fields, deterministic for everything else |
| `deterministic_only` | Zero LLM calls, pure keyword extraction + KG logic |

### Agent Overview

| Agent | LLM? | Purpose |
|-------|------|---------|
| **Intake** | Yes (hybrid) | Natural language understanding for Tamil/Hindi/English input |
| **Procedure** | No | Topological sort from Knowledge Graph — deterministic |
| **Document** | Partial | KG fields deterministic, LLM polishes free-text only |
| **Navigator** | No | Office lookup from offices.json — deterministic |
| **Escalation** | Partial | Templates + legal citations deterministic, LLM polishes grievance paragraph |
| **Memory** | Yes (hybrid) | LLM summarization for better vector similarity |
| **Orchestrator** | No | State machine routing — deterministic |

### Fallback Behavior

If Ollama is unreachable and `LLM_FALLBACK_TO_DETERMINISTIC=true` (default):
- System silently falls back to deterministic keyword extraction
- All features continue to work, just without natural language understanding
- Zero crashes, zero user-visible errors

### Environment Variables

See `../.env.example` for all configuration options.

Key settings:
- `LLM_PROVIDER`: `ollama` (default) or `deterministic`
- `OLLAMA_MODEL`: `llama3.2:latest` (default)
- `LLM_TEMPERATURE_INTAKE`: `0.4` (warmer for conversation)
- `LLM_TEMPERATURE_DOCUMENT`: `0.2` (precise for legal text)
- `DEMO_MODE`: `true` for stage-reliable cached responses
