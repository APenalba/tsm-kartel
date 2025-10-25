"""Shared rate limiter instance for the API."""

from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from src.core.config import settings


def _client_ip_from_proxy_headers(request: Request) -> str:
    """Extract client IP honoring proxy headers only if trust_proxy is enabled."""
    if getattr(settings, "trust_proxy", False):
        xff = request.headers.get("x-forwarded-for")
        if xff:
            ip = xff.split(",")[0].strip()
            if ip:
                return ip
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip
    # Fallback: remote address provided by ASGI server
    return get_remote_address(request)


limiter = Limiter(
    key_func=_client_ip_from_proxy_headers,  # respects proxies
    default_limits=[settings.rate_limit_default],
)
