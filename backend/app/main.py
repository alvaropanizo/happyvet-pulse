from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError

from app.api.routes.documents import router as documents_router
from app.api.routes.health import router as health_router
from app.core.error_handlers import app_error_handler, validation_error_handler
from app.core.exceptions import AppError
from app.core.logging import configure_logging


app = FastAPI(
    title="HappyVet Pulse API",
    version="0.1.0",
    description="Backend service for veterinary document ingestion and processing.",
)

configure_logging()

app.add_exception_handler(AppError, app_error_handler)
app.add_exception_handler(RequestValidationError, validation_error_handler)

app.include_router(health_router)
app.include_router(documents_router)
