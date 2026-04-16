from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

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

# Local FE dev server runs on a different origin than the API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(AppError, app_error_handler)
app.add_exception_handler(RequestValidationError, validation_error_handler)

app.include_router(health_router)
app.include_router(documents_router)
