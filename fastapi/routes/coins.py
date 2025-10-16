# routes/coins.py
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from database import database
import json
import logging

router = APIRouter(prefix="/coins", tags=["coins"])
log = logging.getLogger(__name__)

class BalanceOut(BaseModel):
    username: str
    coin_balance: int

class CoinChangeIn(BaseModel):
    username: str = Field(..., min_length=1)
    amount: int = Field(..., gt=0)
    reason: str = Field(..., min_length=1)
    reference_type: Optional[str] = None
    reference_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

async def _ensure_user(username: str):
    row = await database.fetch_one(
        "SELECT username, coin_balance FROM public.users WHERE username = :u",
        {"u": username},
    )
    if not row:
        raise HTTPException(404, f"User '{username}' not found")
    return dict(row)

@router.get("/balance", response_model=BalanceOut)
async def get_balance(username: str = Query(..., min_length=1)):
    user = await _ensure_user(username)
    return {"username": user["username"], "coin_balance": user["coin_balance"]}

@router.post("/add", response_model=BalanceOut)
async def add_coins(body: CoinChangeIn):
    await _ensure_user(body.username)
    try:
        async with database.transaction():
            after_balance = await database.fetch_val(
                """
                UPDATE public.users
                SET coin_balance = coin_balance + :amount
                WHERE username = :u
                RETURNING coin_balance
                """,
                {"u": body.username, "amount": body.amount},
            )

            meta_param = json.dumps(body.metadata) if body.metadata is not None else None

            await database.execute(
                """
                INSERT INTO public.coin_transactions
                  (username, change_amount, reason, reference_type, reference_id, balance_after, metadata)
                VALUES
                  (:a_u, :b_chg, :c_reason, :d_rtype, :e_rid, :f_after, :g_meta)
                """,
                {
                    "a_u": body.username,
                    "b_chg": body.amount,
                    "c_reason": body.reason,
                    "d_rtype": body.reference_type,
                    "e_rid": body.reference_id,
                    "f_after": after_balance,
                    "g_meta": meta_param,
                },
            )
        return {"username": body.username, "coin_balance": after_balance}
    except Exception as e:
        log.exception("coins/add failed")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/spend", response_model=BalanceOut)
async def spend_coins(body: CoinChangeIn):
    """
    Deduct coins from a user (if they have enough) and append a ledger row.
    - Uses alphabetical placeholder names to keep parameter order aligned
      with column order (databases/asyncpg quirk).
    - Serializes metadata to JSON text for safety.
    """
    await _ensure_user(body.username)

    try:
        async with database.transaction():
            # 1) Try to deduct; if balance is insufficient, this returns NULL
            after_balance = await database.fetch_val(
                """
                UPDATE public.users
                SET coin_balance = coin_balance - :amount
                WHERE username = :u AND coin_balance >= :amount
                RETURNING coin_balance
                """,
                {"u": body.username, "amount": body.amount},
            )
            if after_balance is None:
                raise HTTPException(status_code=400, detail="Insufficient coins")

            # 2) Insert ledger row (placeholder names a_..g_ match column order)
            meta_param = json.dumps(body.metadata) if body.metadata is not None else None

            await database.execute(
                """
                INSERT INTO public.coin_transactions
                  (username, change_amount, reason, reference_type, reference_id, balance_after, metadata)
                VALUES
                  (:a_u, :b_chg, :c_reason, :d_rtype, :e_rid, :f_after, :g_meta)
                """,
                {
                    "a_u": body.username,
                    "b_chg": -body.amount,        # negative for spend
                    "c_reason": body.reason,
                    "d_rtype": body.reference_type,
                    "e_rid": body.reference_id,
                    "f_after": after_balance,
                    "g_meta": meta_param,
                },
            )

        return {"username": body.username, "coin_balance": after_balance}

    except HTTPException:
        raise
    except Exception as e:
        log.exception("coins/spend failed")
        raise HTTPException(status_code=500, detail=str(e))
