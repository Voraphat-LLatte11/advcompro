# app.py (main)
from fastapi import FastAPI
from routes.users import router
from database import connect_db, disconnect_db
from fastapi.middleware.cors import CORSMiddleware
from routes.vehicles import router as vehicles_router



app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
app.include_router(vehicles_router)

@app.on_event("startup")
async def startup():
    await connect_db()

@app.on_event("shutdown")
async def shutdown():
    await disconnect_db()
