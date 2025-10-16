from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from datetime import date
from database import database
import logging

router = APIRouter(prefix="", tags=["bookings"])
log = logging.getLogger(__name__)

class BookingBody(BaseModel):
    vehicle_id: int
    start_date: date
    end_date: date
    username: Optional[str] = None
    coins_used: int = 0

def _overlap_sql() -> str:
    return """
      SELECT 1
      FROM public.bookings b
      WHERE b.vehicle_id = :vehicle_id
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
    body: Optional[BookingBody] = None,
):
    # allow JSON body or query params
    if body:
        vehicle_id = body.vehicle_id
        start_date = body.start_date
        end_date = body.end_date
        username = body.username
        coins_used = body.coins_used or 0

    if vehicle_id is None or start_date is None or end_date is None:
        raise HTTPException(422, "vehicle_id, start_date, end_date are required (YYYY-MM-DD).")
    if end_date < start_date:
        raise HTTPException(422, "end_date must be on/after start_date.")

    try:
        async with database.transaction():
            # 1) ensure vehicle exists & get its availability
            vrow = await database.fetch_one(
                """
                SELECT id,
                       rent_start_date::date AS rent_start_date,
                       rent_end_date::date   AS rent_end_date
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

            # 2) prevent overlap
            exists = await database.fetch_one(
                _overlap_sql(),
                {"vehicle_id": vehicle_id, "start_date": start_date, "end_date": end_date},
            )
            if exists:
                raise HTTPException(409, "Requested dates overlap an existing booking.")

            # 3) insert booking
            row = await database.fetch_one(
                """
                INSERT INTO public.bookings
                  (vehicle_id, username, start_date, end_date, coins_used)
                VALUES
                  (:vehicle_id, :username, :start_date, :end_date, :coins_used)
                RETURNING id, vehicle_id, username,
                          start_date::text AS start_date,
                          end_date::text   AS end_date,
                          coins_used, created_at
                """,
                {
                    "vehicle_id": vehicle_id,
                    "username": username,
                    "start_date": start_date,
                    "end_date": end_date,
                    "coins_used": coins_used or 0,
                },
            )
            return {"booking": dict(row)}

    except HTTPException:
        raise
    except Exception as e:
        log.exception("create_booking failed")
        raise HTTPException(500, f"create_booking error: {e}")
