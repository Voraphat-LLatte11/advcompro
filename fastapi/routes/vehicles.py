from fastapi import APIRouter, Query, HTTPException, status
from typing import Optional, List, Dict
from database import database
from pydantic import BaseModel
from datetime import date, datetime

router = APIRouter(prefix="", tags=["vehicles"])

class VehicleCreate(BaseModel):
    type_of_car: str
    brand: str
    model: str
    rent_start_date: Optional[date] = None
    rent_end_date: Optional[date] = None
    # keep only what we use
    capacity: Optional[str] = None         # '5' or '2'
    coin_rate_per_day: Optional[int] = None
    image_url: Optional[str] = None

class VehicleOut(BaseModel):
    id: int
    type_of_car: str
    brand: str
    model: str
    rent_start_date: Optional[str] = None
    rent_end_date: Optional[str] = None
    fuel_consumption: Optional[str] = None
    max_speed: Optional[str] = None
    capacity: Optional[str] = None
    coin_rate_per_day: Optional[int] = None
    image_url: Optional[str] = None

@router.post("/vehicles", response_model=VehicleOut)
async def create_vehicle(v: VehicleCreate):
    import datetime
    data = v.dict()

    for key in ("rent_start_date", "rent_end_date"):
        val = data.get(key)
        if isinstance(val, str) and val:
            try:
                data[key] = datetime.date.fromisoformat(val)
            except Exception:
                data[key] = None

    # Fallbacks if caller didn’t send capacity/rate
    if not data.get("capacity"):
        data["capacity"] = "5" if data.get("type_of_car") == "Car" else "2"
    if data.get("coin_rate_per_day") in (None, 0):
        data["coin_rate_per_day"] = 300 if data.get("type_of_car") == "Car" else 120

    q = """
        INSERT INTO public.vehicles
          (type_of_car, brand, model, rent_start_date, rent_end_date,
           capacity, coin_rate_per_day, image_url)
        VALUES
          (:type_of_car, :brand, :model, :rent_start_date, :rent_end_date,
           :capacity, :coin_rate_per_day, :image_url)
        RETURNING id, type_of_car, brand, model,
          TO_CHAR(rent_start_date,'YYYY-MM-DD') AS rent_start_date,
          TO_CHAR(rent_end_date,'YYYY-MM-DD')   AS rent_end_date,
          capacity, coin_rate_per_day, image_url
    """
    try:
        row = await database.fetch_one(q, data)
        return dict(row)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/vehicles/{vehicle_id}", response_model=VehicleOut)
async def get_vehicle(vehicle_id: int):
    q = """
      SELECT id, type_of_car, brand, model,
             TO_CHAR(rent_start_date,'YYYY-MM-DD') AS rent_start_date,
             TO_CHAR(rent_end_date,'YYYY-MM-DD')   AS rent_end_date,
             capacity, coin_rate_per_day, image_url,
             fuel_consumption, max_speed
      FROM public.vehicles
      WHERE id = :id
    """
    row = await database.fetch_one(q, {"id": vehicle_id})
    if not row:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return dict(row)

@router.get("/vehicles", response_model=List[Dict])
async def list_vehicles(
    type_of_car: Optional[str] = None,
    brand: Optional[str] = None,
    model: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    exclude_booked: bool = True,
    viewer_username: Optional[str] = None,
):
    def parse_date(s: Optional[str]) -> Optional[date]:
        try:
            return datetime.strptime(s, "%Y-%m-%d").date() if s else None
        except Exception:
            return None

    v_from = parse_date(from_date)
    v_to   = parse_date(to_date)

    conditions: list[str] = []
    params: Dict[str, object] = {}

    if type_of_car:
        conditions.append("v.type_of_car = :type_of_car")
        params["type_of_car"] = type_of_car
    if brand:
        conditions.append("v.brand = :brand")
        params["brand"] = brand
    if model:
        conditions.append("v.model = :model")
        params["model"] = model

    if v_from and v_to:
        conditions.append("NOT (v.rent_end_date < :v_from OR v.rent_start_date > :v_to)")
        params["v_from"], params["v_to"] = v_from, v_to
    elif v_from:
        conditions.append("v.rent_end_date >= :v_from")
        params["v_from"] = v_from
    elif v_to:
        conditions.append("v.rent_start_date <= :v_to")
        params["v_to"] = v_to

    where_sql = ("WHERE " + " AND ".join(conditions)) if conditions else ""

    q = f"""
      SELECT v.id, v.type_of_car, v.brand, v.model,
             TO_CHAR(v.rent_start_date,'YYYY-MM-DD') AS rent_start_date,
             TO_CHAR(v.rent_end_date,'YYYY-MM-DD')   AS rent_end_date,
             v.capacity, v.coin_rate_per_day, v.image_url
      FROM public.vehicles v
      {where_sql}
      ORDER BY v.type_of_car, v.brand, v.model, v.rent_start_date NULLS LAST
      LIMIT 500
    """

    rows = await database.fetch_all(q, params)
    return [dict(r) for r in rows]
