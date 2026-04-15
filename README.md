# HappyVet Pulse

Lean Human-in-the-Loop IDP foundation for veterinary medical records.

## Run with Docker

```bash
docker compose up --build
```

### Endpoints

- Backend: `http://localhost:8000`
- Health check: `http://localhost:8000/health`
- Frontend: `http://localhost:5173`

### Frontend API base URL

- Frontend upload requests use `BACKEND_API_BASE_URL`.
- For local non-Docker runs, copy `frontend/.env.example` to `frontend/.env` and set:
  - `BACKEND_API_BASE_URL=http://localhost:8000`

### Stop and cleanup

```bash
docker compose down
```
