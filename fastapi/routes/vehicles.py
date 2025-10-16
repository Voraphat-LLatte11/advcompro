# routes/vehicles.py
from fastapi import APIRouter, Query, HTTPException, status
from typing import Optional, List, Dict
from database import database
from pydantic import BaseModel
from datetime import date

router = APIRouter(prefix="", tags=["vehicles"])

class VehicleCreate(BaseModel):
    type_of_car: str
    brand: str
    model: str
    rent_start_date: Optional[date] = None
    rent_end_date: Optional[date] = None
class VehicleOut(BaseModel):
    id: int
    type_of_car: str
    brand: str
    model: str
    rent_start_date: Optional[str] = None
    rent_end_date: Optional[str] = None

@router.post("/vehicles", response_model=VehicleOut)
async def create_vehicle(v: VehicleCreate):
    # remove ::date casts — PostgreSQL will accept real Python date objects
    query = """
        INSERT INTO public.vehicles (type_of_car, brand, model, rent_start_date, rent_end_date)
        VALUES (:type_of_car, :brand, :model, :rent_start_date, :rent_end_date)
        RETURNING id, type_of_car, brand, model,
          TO_CHAR(rent_start_date,'YYYY-MM-DD') AS rent_start_date,
          TO_CHAR(rent_end_date,'YYYY-MM-DD')   AS rent_end_date
    """

    # convert possible string inputs to Python date
    import datetime

    data = v.dict()
    for key in ("rent_start_date", "rent_end_date"):
        val = data.get(key)
        if isinstance(val, str) and val:
            try:
                data[key] = datetime.date.fromisoformat(val)
            except Exception:
                data[key] = None

    try:
        row = await database.fetch_one(query, data)
        return dict(row)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# If you don’t already have this detail route:
@router.get("/vehicles/{vehicle_id}", response_model=VehicleOut)
async def get_vehicle(vehicle_id: int):
    q = """
      SELECT id, type_of_car, brand, model,
             TO_CHAR(rent_start_date,'YYYY-MM-DD') rent_start_date,
             TO_CHAR(rent_end_date,'YYYY-MM-DD')   rent_end_date
      FROM public.vehicles WHERE id = :id
    """
    row = await database.fetch_one(q, {"id": vehicle_id})
    if not row:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return dict(row)

@router.get("/vehicle-types", response_model=List[str])
async def vehicle_types():
    q = "SELECT DISTINCT type_of_car FROM public.vehicles ORDER BY type_of_car"
    rows = await database.fetch_all(q)
    return [r["type_of_car"] for r in rows]

@router.get("/vehicle-brands", response_model=List[str])
async def vehicle_brands(type_of_car: str = Query(...)):
    q = """
      SELECT DISTINCT brand
      FROM public.vehicles
      WHERE type_of_car = :type_of_car
      ORDER BY brand
    """
    rows = await database.fetch_all(q, {"type_of_car": type_of_car})
    return [r["brand"] for r in rows]

@router.get("/vehicle-models", response_model=List[str])
async def vehicle_models(type_of_car: str = Query(...), brand: str = Query(...)):
    q = """
      SELECT DISTINCT model
      FROM public.vehicles
      WHERE type_of_car = :type_of_car AND brand = :brand
      ORDER BY model
    """
    rows = await database.fetch_all(q, {"type_of_car": type_of_car, "brand": brand})
    return [r["model"] for r in rows]

# Existing list with filters (exact match + optional date window)
@router.get("/vehicles", response_model=List[Dict])
async def list_vehicles(
    type_of_car: Optional[str] = None,
    brand: Optional[str] = None,
    model: Optional[str] = None,
    from_date: Optional[str] = None,  # yyyy-mm-dd
    to_date: Optional[str] = None,
):
    where, params = [], {}
    if type_of_car:
        where.append("type_of_car = :type_of_car"); params["type_of_car"] = type_of_car
    if brand:
        where.append("brand = :brand"); params["brand"] = brand
    if model:
        where.append("model = :model"); params["model"] = model

    # inside range if both provided; otherwise single-sided filter
    # routes/vehicles.py -> list_vehicles()

    if from_date and to_date:
        where.append(
            "rent_start_date >= NULLIF(:from_date,'')::date "
            "AND rent_end_date <= NULLIF(:to_date,'')::date"
        )
        params["from_date"] = from_date
        params["to_date"] = to_date
    elif from_date:
        where.append("rent_start_date >= NULLIF(:from_date,'')::date")
        params["from_date"] = from_date
    elif to_date:
        where.append("rent_end_date <= NULLIF(:to_date,'')::date")
        params["to_date"] = to_date


    where_sql = "WHERE " + " AND ".join(where) if where else ""
    q = f"""
      SELECT id, type_of_car, brand, model,
             TO_CHAR(rent_start_date,'YYYY-MM-DD') AS rent_start_date,
             TO_CHAR(rent_end_date,'YYYY-MM-DD')   AS rent_end_date
      FROM public.vehicles
      {where_sql}
      ORDER BY type_of_car, brand, model, rent_start_date NULLS LAST
      LIMIT 500
    """
    rows = await database.fetch_all(q, params)
    return [dict(r) for r in rows]

@router.delete("/vehicles/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vehicle(vehicle_id: int):
    q = "DELETE FROM public.vehicles WHERE id = :id"
    result = await database.execute(q, {"id": vehicle_id})
    # `database.execute` returns the last row id or similar; we can't know affected rows here reliably.
    # If you want to ensure existence, do a pre-check:
    # row = await database.fetch_one("SELECT 1 FROM public.vehicles WHERE id=:id", {"id": vehicle_id})
    # if not row: raise HTTPException(status_code=404, detail="Vehicle not found")
    return  # 204 No Content
