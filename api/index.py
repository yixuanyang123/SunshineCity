# Vercel serverless entry: /api and /api/
# All /api/* routes are handled by corresponding api/*.py files; each exports the same FastAPI app.
from server.main import app
