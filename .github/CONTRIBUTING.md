# Contributing to NyayaMitra

Thank you for wanting to help make bureaucracy less painful for 700M people.

## Before You Start

Read the [README](../README.md) and the system architecture in `backend/nyayamitra/`. Understand the multi-agent pattern before proposing changes.

## What We Need Most

1. **More procedures** — Tamil Nadu has 200+ government procedures. We've mapped 20. Adding more to `backend/nyayamitra/kg/procedures.json` is the highest-leverage contribution.
2. **Other states** — The architecture is state-agnostic. Karnataka, Maharashtra, Andhra Pradesh need the same treatment.
3. **Language translations** — UI strings need ta/hi/te translations in `frontend/lib/i18n/`.
4. **Bug reports** — Real citizens using this will hit edge cases we haven't seen. Please report them.

## How to Contribute

### Setup
```bash
git clone https://github.com/haarez/nyayamitra
cd nyayamitra

# Backend
cd backend && python -m venv .venv && .venv/Scripts/activate
pip install -e ".[dev]"
pytest  # must pass

# Frontend
cd ../frontend && npm install
npm run build  # must pass
```

### Adding a Procedure

Edit `backend/nyayamitra/kg/procedures.json`. Each procedure needs:

```json
{
  "procedure_id": "tn_example",
  "name_en": "Example Certificate",
  "name_ta": "எடுத்துக்காட்டு சான்றிதழ்",
  "issuing_authority": "Example Department",
  "jurisdiction": "tn",
  "applicable_for": ["death"],
  "estimated_days_min": 7,
  "estimated_days_max": 30,
  "fee_inr": 50,
  "depends_on": ["tn_death_certificate"],
  "required_documents": ["Aadhaar", "Death Certificate"],
  "office_location_type": "taluk_office",
  "legal_basis": "Section X of Act Y",
  "online_available": false
}
```

Run `pytest backend/tests/test_kg.py` after adding — if dependency references are wrong, the test will catch it.

### Pull Request Checklist

- [ ] `pytest` passes (all tests green)
- [ ] `npm run build` passes (zero errors, zero TypeScript errors)
- [ ] No `console.log` in frontend, no bare `print()` in backend
- [ ] New procedures have both `name_en` and `name_ta`
- [ ] Commit message follows: `feat:`, `fix:`, `chore:`, `docs:` prefix

## Code Style

- **Python**: ruff + black (configured in `pyproject.toml`)
- **TypeScript**: ESLint + Prettier (configured in `.eslintrc`)
- **Components**: client components only when necessary (`"use client"` directive)
- **State**: Zustand store in `frontend/lib/store.ts` — no prop drilling

## Questions?

Open an issue. Label it `question`.
