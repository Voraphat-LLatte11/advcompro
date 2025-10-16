from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import database

router = APIRouter(tags=["users"])

# ---- Models ----
class UserCreate(BaseModel):
    username: str
    password: str

class UserOut(BaseModel):
    username: str

class ForgotPasswordIn(BaseModel):
    username: str
    newPassword: str


# ---- Register ----
@router.post("/register/", response_model=UserOut)
async def register(user: UserCreate):
    query = "INSERT INTO users (username, password) VALUES (:username, :password)"
    try:
        await database.execute(query, user.dict())
        return {"username": user.username}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ---- Login ----
@router.post("/login/")
async def login(user: UserCreate):
    query = "SELECT password FROM users WHERE username = :username"
    result = await database.fetch_one(query, {"username": user.username})
    if not result:
        raise HTTPException(status_code=404, detail="User not found")
    if result["password"] != user.password:
        raise HTTPException(status_code=401, detail="Incorrect password")
    return {"message": "Login successful"}


# ---- Forgot / Reset Password ----
@router.post("/forgotpassword/")
async def forgot_password(data: ForgotPasswordIn):
    # 1. Check if user exists
    query_check = "SELECT username FROM users WHERE username = :username"
    user_exists = await database.fetch_one(query_check, {"username": data.username})
    if not user_exists:
        raise HTTPException(status_code=404, detail="User not found")

    # 2. Update password
    query_update = """
        UPDATE users 
        SET password = :newPassword 
        WHERE username = :username
    """
    await database.execute(query_update, {"newPassword": data.newPassword, "username": data.username})
    return {"message": "Password updated successfully"}


# ---- List all users ----
@router.get("/users/", response_model=list[UserOut])
async def list_users():
    query = "SELECT username FROM users"
    return await database.fetch_all(query)


# ---- Delete user ----
@router.delete("/users/{username}")
async def delete_user(username: str):
    query = "DELETE FROM users WHERE username = :username"
    await database.execute(query, {"username": username})
    return {"message": f"User {username} deleted"}
