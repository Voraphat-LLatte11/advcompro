from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from database import database

router = APIRouter(tags=["users"])

# ---- Models ----
class UserCreate(BaseModel):
    username: str
    password: str
    # allow client to pass description at register (optional)
    description: Optional[str] = ""

class UserOut(BaseModel):
    username: str

class UserProfile(BaseModel):
    username: str
    email: Optional[str] = None  # keep if you’ll add email later; otherwise harmless
    description: str = ""

class UserUpdate(BaseModel):
    description: Optional[str] = ""

class ForgotPasswordIn(BaseModel):
    username: str
    newPassword: str


# ---- Register ----
@router.post("/register/", response_model=UserOut)
async def register(user: UserCreate):
    # description is optional; default to empty string
    query = """
        INSERT INTO public.users (username, password, description)
        VALUES (:username, :password, COALESCE(:description, ''))
    """
    try:
        await database.execute(query, {
            "username": user.username,
            "password": user.password,           # NOTE: plaintext; consider hashing later
            "description": user.description or ""
        })
        return {"username": user.username}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ---- Login ----
@router.post("/login/")
async def login(user: UserCreate):
    query = "SELECT password FROM public.users WHERE username = :username"
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
    query_check = "SELECT username FROM public.users WHERE username = :username"
    user_exists = await database.fetch_one(query_check, {"username": data.username})
    if not user_exists:
        raise HTTPException(status_code=404, detail="User not found")

    # 2. Update password
    query_update = """
        UPDATE public.users 
        SET password = :newPassword 
        WHERE username = :username
    """
    await database.execute(query_update, {"newPassword": data.newPassword, "username": data.username})
    return {"message": "Password updated successfully"}


# ---- List all users (minimal) ----
@router.get("/users/", response_model=List[UserOut])
async def list_users():
    query = "SELECT username FROM public.users ORDER BY username"
    rows = await database.fetch_all(query)
    return [{"username": r["username"]} for r in rows]


# ---- Get one user (with description) ----
@router.get("/users/{username}", response_model=UserProfile)
async def get_user(username: str):
    row = await database.fetch_one(
        """
        SELECT username, NULL::text AS email, COALESCE(description,'') AS description
        FROM public.users
        WHERE username = :u
        """,
        {"u": username},
    )
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return dict(row)


# ---- Update user (currently only description) ----
@router.patch("/users/{username}", response_model=UserProfile)
async def patch_user(username: str, payload: UserUpdate):
    # Ensure exists
    exists = await database.fetch_one(
        "SELECT 1 FROM public.users WHERE username = :u",
        {"u": username},
    )
    if not exists:
        raise HTTPException(status_code=404, detail="User not found")

    desc = (payload.description or "").strip()
    row = await database.fetch_one(
        """
        UPDATE public.users
        SET description = :d
        WHERE username = :u
        RETURNING username, NULL::text AS email, COALESCE(description,'') AS description
        """,
        {"u": username, "d": desc},
    )
    return dict(row)


# ---- Delete user ----
@router.delete("/users/{username}")
async def delete_user(username: str):
    query = "DELETE FROM public.users WHERE username = :username"
    await database.execute(query, {"username": username})
    return {"message": f"User {username} deleted"}
