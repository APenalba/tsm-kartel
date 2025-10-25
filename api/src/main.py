"""Uvicorn entrypoint for running the unified FastAPI app."""

if __name__ == "__main__":
    import uvicorn
    from src.core.config import settings

    uvicorn.run(
        "src.api.app:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug,
    )
