from fastapi import FastAPI


app = FastAPI(
    title="HappyVet Pulse API",
    version="0.1.0",
    description="Backend service for veterinary document ingestion and processing.",
)


@app.get("/health", tags=["health"])
async def health_check() -> dict[str, str]:
    """Simple health endpoint used by local/dev orchestration."""
    return {"status": "ok"}
