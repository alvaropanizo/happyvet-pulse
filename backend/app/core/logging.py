import logging


LOG_FORMAT = "%(asctime)s | %(levelname)s | %(name)s | %(message)s"


def configure_logging() -> None:
    """Configure global logging once for the backend service."""
    logging.basicConfig(level=logging.INFO, format=LOG_FORMAT)


def get_logger(name: str) -> logging.Logger:
    """Return a namespaced logger for application modules."""
    return logging.getLogger(name)
