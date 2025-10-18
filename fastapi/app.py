from fastapi import FastAPI, Request
from routes.users import router as users_router
from routes.vehicles import router as vehicles_router
from routes.bookings import router as bookings_router
from routes.coins import router as coins_router
from routes.admin_metrics import admin_router
from database import connect_db, disconnect_db, database
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # dev-friendly: allow all
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users_router)
app.include_router(vehicles_router)
app.include_router(bookings_router)
app.include_router(coins_router)
app.include_router(admin_router)

@app.on_event("startup")
async def startup():
    await connect_db()

@app.on_event("shutdown")
async def shutdown():
    await disconnect_db()

@app.middleware("http")
async def ensure_db_connection(request: Request, call_next):
    if not database.is_connected:
        try:
            await connect_db()
        except Exception:
            from fastapi.responses import JSONResponse
            return JSONResponse({"detail": "Database unavailable"}, status_code=503)
    return await call_next(request)

@app.get("/health")
async def health():
    ok = database.is_connected
    return {"ok": ok}
