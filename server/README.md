Sunshine City backend

- FastAPI application
- Uses PostgreSQL (asyncpg)

Requirements
- Python 3.11+ (tested with 3.11)
- Docker (for PostgreSQL 14 container)
- virtualenv or venv for Python dependency isolation

Quick start
1. Start PostgreSQL 14 in Docker:
   docker run --name sunshine-db -e POSTGRES_PASSWORD=pass -e POSTGRES_DB=sunshine -p 5432:5432 -d postgres:14

2. Create server/.env file with these values:
   DATABASE_URL=postgresql+asyncpg://postgres:pass@localhost:5432/sunshine
   SECRET_KEY=your-secret-key-here-change-in-production

3. Create virtualenv and install dependencies (from project root):
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r server/requirements.txt

4. Start the FastAPI server (from project root):
   .venv/bin/python -m uvicorn server.main:app --reload --host 0.0.0.0 --port 8000

5. Verify server is running:
   curl http://localhost:8000/
   # Should return: {"status":"ok"}

Alternative: Local PostgreSQL
If you prefer to use a local PostgreSQL installation instead of Docker:
1. Install PostgreSQL 14+ locally and create a database named `sunshine`.
2. Update `DATABASE_URL` in `server/.env` to match your local credentials.
3. Follow steps 3-5 above.

What the server provides
- POST /auth/signup { email, password } -> create user (password hashed with pbkdf2_sha256)
- POST /auth/login { email, password } -> returns access_token (JWT)
- GET /auth/me -> requires `Authorization: Bearer <token>` header -> returns user info
- GET / -> health check (returns {"status": "ok"})

Notes & troubleshooting
- On first startup the app will create DB tables automatically (see `server/main.py`). For production use consider adding Alembic migrations instead.
- If the frontend shows: `Unable to reach auth server (http://localhost:8000)`:
  - Verify the FastAPI server is running on port 8000.
  - Verify `server/.env` exists and `DATABASE_URL` is correct.
  - Check CORS: the app allows `http://localhost:3000` by default for the Next dev server.
- If you get `Email already registered` or `Invalid credentials`, inspect server logs and use the `/auth/login` endpoint with curl to verify token issuance.
- Password length: The server uses pbkdf2_sha256 hashing (not bcrypt), which supports longer passwords. Minimum 8 characters recommended; very long passwords (>500 bytes) are rejected with a clear error.

Quick curl examples
- Health check:
  curl http://localhost:8000/

- Signup:
  curl -X POST http://localhost:8000/auth/signup -H "Content-Type: application/json" -d '{"email":"you@example.com","password":"pass1234"}'

- Login:
  curl -X POST http://localhost:8000/auth/login -H "Content-Type: application/json" -d '{"email":"you@example.com","password":"pass1234"}'

Stopping/cleanup
- Stop the uvicorn server with Ctrl+C
- If you started the Docker container and want to remove it:
  docker stop sunshine-db && docker rm sunshine-db

Security & next steps
- Do not commit your `server/.env` to git (it's listed in `.gitignore`).
- For production, replace the default `SECRET_KEY` and set up proper DB user, password, and migrations.
