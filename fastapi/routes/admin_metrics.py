from fastapi import APIRouter
from datetime import date
from database import database

admin_router = APIRouter(prefix="/admin", tags=["admin"])

@admin_router.get("/metrics")
async def metrics():
    today = date.today()

    users_q = "SELECT COUNT(*) AS c FROM users"
    rentals_q = "SELECT COUNT(*) AS c FROM public.bookings"
    spending_q = "SELECT COALESCE(SUM(coins_used),0) AS s FROM public.bookings"

    users = await database.fetch_one(users_q)
    rentals = await database.fetch_one(rentals_q)
    spending = await database.fetch_one(spending_q)

    # count available vehicles (not booked at current date)
    available_q = """
        SELECT COUNT(*) AS c
        FROM public.vehicles v
        WHERE NOT EXISTS (
            SELECT 1 FROM public.bookings b
            WHERE b.vehicle_id = v.id
              AND :today BETWEEN b.start_date AND b.end_date
        )
    """
    available = await database.fetch_one(available_q, {"today": today})

    return {
        "total_users": users["c"] if users else 0,
        "total_rentals": rentals["c"] if rentals else 0,
        "total_spending": int(spending["s"] if spending else 0),
        "available_vehicles": available["c"] if available else 0,
    }
