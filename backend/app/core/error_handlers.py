from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.core.exceptions import AppError


def _build_error_response(code: str, message: str, status_code: int) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"error": {"code": code, "message": message}},
    )


async def app_error_handler(_: Request, exc: AppError) -> JSONResponse:
    return _build_error_response(code=exc.code, message=exc.message, status_code=exc.status_code)


async def validation_error_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    return _build_error_response(
        code="VALIDATION_ERROR",
        message=str(exc.errors()),
        status_code=422,
    )
