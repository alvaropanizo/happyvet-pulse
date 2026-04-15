from fastapi import APIRouter


router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check() -> dict[str, str]:
    """Simple health endpoint used by local/dev orchestration."""
    return {"status": "ok"}
