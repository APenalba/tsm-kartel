"""REST API endpoints."""

import logging
from typing import Any, Dict

from fastapi import APIRouter, HTTPException, Request, status

from src.api.rate_limit import limiter
from src.clients.sftp_manager import download_player_stats_db
from src.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/refresh-stats")
@limiter.limit(settings.rate_limit_refresh_stats)
async def refresh_stats(request: Request) -> Dict[str, Any]:
    """
    Force the download of the player statistics database via SFTP.

    Rate limited according to settings.rate_limit_refresh_stats.
    """
    try:
        logger.info(
            "refresh-stats requested from %s",
            getattr(getattr(request, "client", None), "host", "unknown"),
        )
        success = await download_player_stats_db()
        if not success:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Failed to refresh player statistics database."
            )

        return {
            "status": "success",
            "message": "Player statistics database refresh initiated."
        }

    except Exception as e:
        # Log internal details but do not leak to clients
        logger.error("refresh-stats failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        ) from e


@router.get("/")
async def root() -> Dict[str, Any]:
    """Root endpoint with API information."""
    return {
        "service": "TSM Kartel & Comp. Server GraphQL API",
        "version": "1.0.0",
        "graphql_endpoint": "/graphql",
        "graphiql_playground": "/graphql" if settings.debug else
        "disabled (enable with DEBUG=true)",
        "status": "online",
        "configured_server": {
            "host": settings.mc_server_host,
            "port": settings.mc_server_port
        }
    }


@router.get("/health")
async def health() -> Dict[str, Any]:
    """Health check endpoint."""
    return {"status": "healthy"}
