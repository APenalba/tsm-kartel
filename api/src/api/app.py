"""Main FastAPI application module."""

import asyncio
from contextlib import asynccontextmanager
import logging
from typing import AsyncGenerator

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from strawberry.fastapi import GraphQLRouter

from src.api.endpoints.v1.routes import router as v1_router
from src.api.graphql.schema import schema
from src.api.rate_limit import limiter
from src.clients.sftp_client import SFTPError
from src.clients.sftp_manager import start_periodic_downloads, stop_periodic_downloads
from src.core.config import settings
from src.utils.logging import configure_logging

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifespan manager.

    Handles startup and shutdown tasks:
    - Start periodic SFTP downloads (includes first immediate run)
    - Graceful shutdown of background tasks
    """
    logger.info("Starting up application...")

    try:
        # Start periodic SFTP downloads
        logger.info("Starting periodic SFTP downloads...")
        await start_periodic_downloads()

        yield
    finally:
        logger.info("Shutting down application...")

        # Stop periodic SFTP downloads
        try:
            logger.info("Stopping periodic SFTP downloads...")
            await stop_periodic_downloads()
        except (asyncio.TimeoutError, asyncio.CancelledError) as e:
            logger.warning("Timeout or cancellation during shutdown: %s", e)
        except (OSError, RuntimeError) as e:
            logger.error("System error stopping periodic downloads: %s", e)

        logger.info("Application shutdown complete.")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    # Configure logging early
    configure_logging(level=logging.DEBUG if settings.debug else logging.INFO)

    application = FastAPI(
        title="TSM Kartel & Comp. Server GraphQL API",
        description="API GraphQL to get information about TSM Kartel & Comp. server",
        version="1.0.0",
        debug=settings.debug,
        lifespan=lifespan
    )

    # Configure CORS (avoid credentials with wildcard origin)
    allow_credentials = settings.cors_origins != "*"
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=allow_credentials,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["*"],
    )

    # Configure rate limiting
    application.state.limiter = limiter
    application.add_exception_handler(
        RateLimitExceeded, _rate_limit_exceeded_handler)
    application.add_middleware(SlowAPIMiddleware)

    # Mount GraphQL router
    graphql_app = GraphQLRouter(
        schema,
        graphiql=settings.debug
    )
    application.include_router(graphql_app, prefix="/graphql")

    # Mount REST API v1 router
    application.include_router(v1_router)

    # SFTP error handler for REST requests
    @application.exception_handler(SFTPError)
    async def sftp_error_handler(_request: Request, exc: SFTPError):
        return fastapi_json_error(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            str(exc),
            exc.__class__.__name__,
        )

    return application


def fastapi_json_error(status_code: int, message: str, error_type: str) -> JSONResponse:
    """Create a JSON response for an error."""
    return JSONResponse(
        status_code=status_code,
        content={
            "status": "error",
            "message": message,
            "error_type": error_type,
        },
    )


app = create_app()
