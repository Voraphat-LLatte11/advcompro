from typing import Union
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from database import *
from routes.users import router


app = FastAPI()

app.include_router(router, prefix="/api")

@app.on_event("startup")
async def startup():
    await connect_db()

@app.on_event("shutdown")
async def shutdown():
    await disconnect_db()
