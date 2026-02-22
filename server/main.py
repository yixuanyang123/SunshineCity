from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
import os
from .auth import router as auth_router
from .database import engine, Base
import asyncio

app = FastAPI(title="Sunshine City API")

# CORS: allow local dev + Vercel deployment (set ALLOWED_ORIGINS in Vercel env)
_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").strip().split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _origins if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class StripApiPathMiddleware(BaseHTTPMiddleware):
    """On Vercel, the app is mounted at /api; strip /api so routes like /auth/login work."""
    async def dispatch(self, request: Request, call_next):
        path = request.scope.get("path", "")
        if path.startswith("/api"):
            request.scope["path"] = path[4:] or "/"
        return await call_next(request)


app.add_middleware(StripApiPathMiddleware)

app.include_router(auth_router)

@app.on_event("startup")
async def startup_event():
    # create DB tables if not exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.get("/")
async def root():
    return {"status": "ok"}
