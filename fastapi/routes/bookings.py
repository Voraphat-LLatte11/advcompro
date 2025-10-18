from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from database import database
import logging

router = APIRouter(prefix="", tags=["bookings"])
log = logging.getLogger(__name__)

class BookingBody(BaseModel):
    vehicle_id: int
    start_date: date
    end_date: date
    username: str
    coins_used: int = 0
    # NEW: allow the same user to overlap (useful for testing)
    allow_same_user_overlap: bool = False

def _overlap_sql(allow_same_user_overlap: bool) -> str:
    """
    Exclusive overlap (back-to-back allowed):
      Overlap iff NOT (new_end < start OR new_start > end)

    If allow_same_user_overlap = True, we IGNORE rows by the same username.
    """
    same_user_clause = "" if allow_same_user_overlap else "AND b.username IS DISTINCT FROM :username"
    return f"""
      SELECT 1
      FROM public.bookings b
      WHERE b.vehicle_id = :vehicle_id
        {same_user_clause}
        AND NOT (:end_date < b.start_date OR :start_date > b.end_date)
      LIMIT 1
    """

@router.post("/bookings")
async def create_booking(
    vehicle_id: Optional[int] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    username: Optional[str] = Query(None),
    coins_used: Optional[int] = Query(0),
    # NEW: query toggle mirrors body field
    allow_same_user_overlap: Optional[bool] = Query(False),
    body: Optional[BookingBody] = None,
):
    # allow JSON body
    if body:
        vehicle_id = body.vehicle_id
        start_date = body.start_date
        end_date = body.end_date
        username = body.username
        coins_used = body.coins_used or 0
        allow_same_user_overlap = body.allow_same_user_overlap

    # basic validation
    if vehicle_id is None or start_date is None or end_date is None:
        raise HTTPException(422, "vehicle_id, start_date, end_date are required (YYYY-MM-DD).")
    if end_date < start_date:
        raise HTTPException(422, "end_date must be on/after start_date.")
    if not username:
        raise HTTPException(422, "username is required.")
    if coins_used is None or coins_used < 0:
        raise HTTPException(422, "coins_used must be >= 0.")

    try:
        async with database.transaction():
            # user exists?
            urow = await database.fetch_one(
                "SELECT username, coin_balance FROM public.users WHERE username = :u",
                {"u": username},
            )
            if not urow:
                raise HTTPException(404, f"User '{username}' not found")

            # vehicle exists & availability
            vrow = await database.fetch_one(
                """
                SELECT id, rent_start_date::date AS rent_start_date, rent_end_date::date AS rent_end_date
                FROM public.vehicles
                WHERE id = :id
                """,
                {"id": vehicle_id},
            )
            if not vrow:
                raise HTTPException(404, f"Vehicle {vehicle_id} not found.")

            v_from = vrow["rent_start_date"]
            v_to   = vrow["rent_end_date"]
            if v_from and start_date < v_from:
                raise HTTPException(400, f"start_date is before vehicle availability ({v_from}).")
            if v_to and end_date > v_to:
                raise HTTPException(400, f"end_date is after vehicle availability ({v_to}).")

            # prevent overlap (exclusive logic, optional same-user ignore)
            exists = await database.fetch_one(
                _overlap_sql(allow_same_user_overlap=bool(allow_same_user_overlap)),
                {
                    "vehicle_id": vehicle_id,
                    "start_date": start_date,
                    "end_date": end_date,
                    "username": username,  # needed for IS DISTINCT FROM
                },
            )
            if exists:
                raise HTTPException(409, "Requested dates overlap an existing booking.")

            # 1) insert booking
            booking = await database.fetch_one(
                """
                INSERT INTO public.bookings
                  (vehicle_id, username, start_date, end_date, coins_used)
                VALUES
                  (:a_vid, :b_user, :c_start, :d_end, :e_coins)
                RETURNING id, vehicle_id, username,
                          start_date::text AS start_date,
                          end_date::text   AS end_date,
                          coins_used, created_at
                """,
                {
                    "a_vid": vehicle_id,
                    "b_user": username,
                    "c_start": start_date,
                    "d_end": end_date,
                    "e_coins": coins_used or 0,
                },
            )
            booking_id = booking["id"]

            # 2) deduct coins + ledger (if needed)
            if coins_used and coins_used > 0:
                new_balance = await database.fetch_val(
                    """
                    UPDATE public.users
                    SET coin_balance = coin_balance - :a_amt
                    WHERE username = :b_user AND coin_balance >= :a_amt
                    RETURNING coin_balance
                    """,
                    {"a_amt": coins_used, "b_user": username},
                )
                if new_balance is None:
                    raise HTTPException(400, "Insufficient coins")

                await database.execute(
                    """
                    INSERT INTO public.coin_transactions
                      (username, change_amount, reason, reference_type, reference_id, balance_after, metadata)
                    VALUES
                      (:a_user, :b_chg, :c_reason, :d_rtype, :e_rid, :f_after, :g_meta)
                    """,
                    {
                        "a_user": username,
                        "b_chg": -coins_used,
                        "c_reason": "rental",
                        "d_rtype": "booking",
                        "e_rid": str(booking_id),
                        "f_after": new_balance,
                        "g_meta": None,
                    },
                )

            return {"booking": dict(booking)}

    except HTTPException:
        raise
    except Exception as e:
        log.exception("create_booking failed")
        raise HTTPException(500, f"create_booking error: {e}")

@router.get("/bookings/mine")
async def get_my_bookings(username: str):
    """
    Return all bookings for the given user,
    including joined vehicle details.
    """
    rows = await database.fetch_all(
        """
        SELECT 
            b.id,
            b.vehicle_id,
            v.brand,
            v.model,
            v.image_url,
            b.start_date::text AS start_date,
            b.end_date::text AS end_date,
            CASE 
                WHEN CURRENT_DATE BETWEEN b.start_date AND b.end_date THEN 'ongoing'
                WHEN CURRENT_DATE < b.start_date THEN 'upcoming'
                ELSE 'completed'
            END AS status
        FROM public.bookings b
        JOIN public.vehicles v ON v.id = b.vehicle_id
        WHERE b.username = :username
        ORDER BY b.start_date DESC
        """,
        {"username": username},
    )

    # Return empty list if no rows found
    return [dict(r) for r in rows]
