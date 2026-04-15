# HappyVet Pulse - Agent Guide

This document gives shared context for autonomous agents working on the project.
Use it as the default reference for development decisions.

## Product Goal

Build a lean Human-in-the-Loop Intelligent Document Processing (IDP) system for veterinary records:

1. Ingest unstructured files (PDF, Word, image formats)
2. Extract raw text (parsing + OCR fallback)
3. Structure content into a normalized schema
4. Present extracted data in an editable UI for clinical review

## Repository Structure

```text
/happyvet-pulse
  /backend
    /app
      __init__.py
      main.py
    /tests
      test_health.py
    pytest.ini
    Dockerfile
    requirements.txt
  /frontend
    index.html
    vite.config.js
    package-lock.json
    /src
      App.jsx
      main.jsx
      App.test.jsx
      /test
        setup.js
    Dockerfile
    package.json
  docker-compose.yml
  .gitignore
  README.md
```

## Agent Responsibilities

- **Backend agent (FastAPI/Python)** owns:
  - Upload APIs and file lifecycle
  - Document text extraction pipeline (parser-first, OCR-second)
  - Data structuring and schema validation
  - API contracts consumed by frontend
  - Test coverage for extraction and transformation logic

- **Frontend agent (React)** owns:
  - Upload flow and document preview UX
  - Structured-data visualization
  - Human correction/editing experience
  - API integration hooks and UI state handling
  - Core UI behavior tests (as test framework is added)

## Core Principles for Next Iterations

- Start simple and modular; avoid early over-engineering.
- Keep extraction providers replaceable (strategy pattern or adapter boundary).
- Treat uncertain extraction output as first-class (confidence fields, nullable values, review flags).
- Keep strict schema contracts between BE and FE (versioned and documented).
- Prioritize deterministic behavior, observability, and error transparency.

## Suggested Backend Direction

- Keep API route handlers thin; move logic into service modules.
- Normalize extracted output into typed Pydantic schemas.
- Preserve raw artifacts (original file metadata + raw extraction text) for traceability.
- Separate concerns:
  - `api/` request/response + routing
  - `core/` settings, constants, shared utilities
  - `models/` persistence models when DB is introduced
  - `schemas/` API and domain validation contracts

## Suggested Frontend Direction

- Isolate API calls in dedicated hooks/modules from presentational components.
- Keep editable structured data state explicit and serializable.
- Design UI around review workflow:
  - Source document visibility
  - Extracted fields and confidence/context
  - Clear approve/correct interactions

## Initial Data Contract (Conceptual)

Agents should align around a minimal document extraction payload shape early:

- `document_id`
- `source_type`
- `language`
- `raw_text`
- `sections` (optional grouped content)
- `entities` (key-value extractions with confidence and provenance)
- `status` (`uploaded`, `processed`, `needs_review`, `approved`)
- `timestamps`

Exact schema can evolve, but changes should be coordinated across both agents.

## Collaboration Rules

- Keep commits focused by concern (backend vs frontend vs infra/docs).
- Document API/interface changes in `README.md`.
- Add tests with each new behavior where feasible.
- Prefer environment-driven configuration over hardcoded values.
- Surface assumptions and open questions explicitly in PR descriptions.

## Definition of Good Progress

- Working end-to-end vertical slice as early as possible.
- Clear interfaces that allow swapping extraction methods later.
- Review UI that supports manual correction without blocking iteration.
- Code that is readable, testable, and easy for new contributors to extend.

## Milestone 1 Baseline (Current State)

- Backend includes a FastAPI app with `GET /health`.
- Frontend includes a minimal Vite + React shell screen.
- `docker-compose.yml` runs both services locally.
- Basic automated tests are in place for BE and FE.

### Local Service Endpoints

- Backend API: `http://localhost:8000`
- Backend health: `http://localhost:8000/health`
- Frontend app: `http://localhost:5173`

### Local Test Commands

- Backend:
  - `cd backend`
  - `python3 -m venv .venv`
  - `. .venv/bin/activate`
  - `pip install -r requirements.txt`
  - `pytest -q`
- Frontend:
  - `cd frontend`
  - `npm install`
  - `npm run test`

### CI / Pipeline Status

- There is currently no GitHub Actions workflow in the repository.
- Tests do **not** run automatically on push yet.
- To enable pipeline execution on push/PR, add a workflow under `.github/workflows/` that runs:
  - backend tests (`pytest`)
  - frontend tests (`npm run test`)

### Conventions for Upcoming Iterations

- **API namespace**: introduce endpoints under `/api/v1/*` as features are added.
- **Extraction pipeline**: start parser-first, then OCR fallback, and record method used.
- **Structured output**: every extracted field should support value + confidence + source span/provenance when possible.
- **Human review flow**: design for "extract -> review -> correct -> approve".
- **Backward compatibility**: coordinate schema changes between FE and BE in the same iteration.
