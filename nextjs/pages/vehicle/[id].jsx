// pages/[id].jsx
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Card,
  TextField,
  Button,
  Grid,
  Divider,
  CircularProgress,
} from "@mui/material";
import Swal from "sweetalert2";
import useBearStore from "@/store/useBearStore";

const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || `http://${host}:8000`;

// Ensure image paths work from Next.js /public folder
const publicImg = (p, fallback) => {
  if (!p) return fallback;                       // no value -> fallback
  if (/^https?:\/\//i.test(p)) return p;         // absolute URL -> keep
  return p.startsWith("/") ? p : `/${p}`;        // add leading slash if missing
};

export default function VehicleBooking() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useBearStore();

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);

  // booking dates
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // coins
  const [userCoins, setUserCoins] = useState(0);
  const [coinsNeeded, setCoinsNeeded] = useState(0);
  const [remainingCoins, setRemainingCoins] = useState(0);

  const [confirming, setConfirming] = useState(false);

  // --- Fetch vehicle details ---
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/vehicles/${id}`);
        if (!res.ok) throw new Error(`Failed to load vehicle ${id}`);
        const data = await res.json();
        setVehicle(data);

        // Prefill earliest available date
        const start = data?.rent_start_date?.slice(0, 10) || "";
        if (start) {
          setFromDate(start);
          setToDate(start);
        }
      } catch (err) {
        console.error("Vehicle fetch error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // --- Fetch user's coin balance ---
  useEffect(() => {
    if (!user?.username) return;
    refreshBalance(user.username);
  }, [user?.username]);

  const dayRate = useMemo(
    () => (vehicle?.coin_rate_per_day ?? vehicle?.daily_coin_rate ?? 100),
    [vehicle]
  );

  // --- Calculate coins needed when date changes or rate/balance changes ---
  useEffect(() => {
    if (!fromDate) {
      setCoinsNeeded(0);
      setRemainingCoins(userCoins);
      return;
    }

    const start = new Date(fromDate);
    const end = new Date(toDate || fromDate);

    if (isNaN(start) || isNaN(end) || end < start) {
      setCoinsNeeded(0);
      setRemainingCoins(userCoins);
      return;
    }

    const msPerDay = 1000 * 60 * 60 * 24;
    const rawDays = Math.ceil((end - start) / msPerDay) || 0;
    const days = Math.max(1, rawDays + 1 - 1);
    const needed = days * dayRate;

    setCoinsNeeded(needed);
    setRemainingCoins(Math.max(0, userCoins - needed));
  }, [fromDate, toDate, userCoins, dayRate]);

  const refreshBalance = async (username) => {
    try {
      const r = await fetch(`${API_BASE}/coins/balance?username=${encodeURIComponent(username)}`);
      if (!r.ok) return;
      const b = await r.json();
      setUserCoins(b.coin_balance ?? 0);
      setRemainingCoins(Math.max(0, (b.coin_balance ?? 0) - coinsNeeded));
    } catch (_) {}
  };

  // --- Top-up coins manually ---
  const handleTopUp = async () => {
    if (!user?.username) {
      Swal.fire("Not logged in", "Please login first.", "warning");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/coins/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user.username,
          amount: 100,
          reason: "topup",
          reference_type: "manual",
          reference_id: `TOPUP-${Date.now()}`,
          metadata: { source: "booking_page" },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Top-up failed");

      Swal.fire({
        icon: "success",
        title: "Top-up Successful!",
        text: `You added 100 coins. New balance: ${data.coin_balance}`,
        confirmButtonColor: "#ff9702",
      });

      setUserCoins(data.coin_balance ?? 0);
      setRemainingCoins(Math.max(0, (data.coin_balance ?? 0) - coinsNeeded));
      await refreshBalance(user.username);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", err.message, "error");
    }
  };

  // --- Booking process ---
  const handleBooking = async () => {
    if (!user?.username) {
      Swal.fire("Error", "Please log in first", "error");
      return;
    }
    if (!fromDate) {
      Swal.fire("Error", "Please choose a start date.", "error");
      return;
    }
    if (coinsNeeded <= 0) {
      Swal.fire("Error", "Please select valid rental dates.", "error");
      return;
    }
    if (userCoins < coinsNeeded) {
      Swal.fire(
        "Insufficient coins",
        `You need ${coinsNeeded} coins but only have ${userCoins}.`,
        "error"
      );
      return;
    }

    const start_date = fromDate;
    const end_date = toDate || fromDate;

    const minDate = vehicle?.rent_start_date?.slice(0, 10);
    const maxDate = vehicle?.rent_end_date?.slice(0, 10);
    if (minDate && start_date < minDate) {
      Swal.fire("Error", `Start date must be on/after ${minDate}`, "error");
      return;
    }
    if (maxDate && end_date > maxDate) {
      Swal.fire("Error", `End date must be on/before ${maxDate}`, "error");
      return;
    }

    setConfirming(true);
    try {
      const res = await fetch(`${API_BASE}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicle_id: vehicle.id,
          username: user.username,
          start_date,
          end_date,
          coins_used: coinsNeeded,
          coin_rate_per_day: dayRate,
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.detail || `Booking failed (${res.status})`);
      }

      await refreshBalance(user.username);
      sessionStorage.setItem("justBookedVehicleId", String(vehicle.id));

      await Swal.fire("Success", "Booking created successfully!", "success");
      router.push("/mainpage");
    } catch (e) {
      Swal.fire("Error", e.message, "error");
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress sx={{ color: "#ff9702" }} />
      </Box>
    );
  }

  if (!vehicle)
    return (
      <Box sx={{ textAlign: "center", py: 10 }}>
        <Typography variant="h6">Vehicle not found</Typography>
        <Button
          onClick={() => router.push("/mainpage")}
          sx={{
            mt: 2,
            backgroundColor: "#ff9702",
            color: "#000",
            fontWeight: 600,
            "&:hover": { backgroundColor: "#ffa733" },
          }}
        >
          Back to List
        </Button>
      </Box>
    );

  const minDate = vehicle.rent_start_date ? vehicle.rent_start_date.slice(0, 10) : "";
  const maxDate = vehicle.rent_end_date ? vehicle.rent_end_date.slice(0, 10) : "";
  const img = publicImg(
    vehicle?.image_url,
    vehicle?.type_of_car === "Motorcycle" ? "/vehicle2.jpg" : "/vehicle1.jpg"
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#fff",
        py: 6,
        px: { xs: 2, md: 8 },
        backgroundImage: "linear-gradient(to bottom right, #fff 60%, #ff970210)",
      }}
    >
      <Card
        sx={{
          p: { xs: 3, md: 6 },
          borderRadius: 4,
          boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
          maxWidth: 1000,
          mx: "auto",
        }}
      >
        <Grid container spacing={4}>
          {/* Left: Vehicle image */}
          <Grid item xs={12} md={5}>
            <Box
              component="img"
              src={img}
              alt={`${vehicle.brand} ${vehicle.model}`}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src =
                  vehicle?.type_of_car === "Motorcycle" ? "/vehicle2.jpg" : "/vehicle1.jpg";
              }}
              sx={{
                width: "100%",
                borderRadius: 3,
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                objectFit: "cover",
              }}
            />
          </Grid>

          {/* Right: Vehicle details */}
          <Grid item xs={12} md={7}>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: "#000" }}>
              {vehicle.brand} {vehicle.model} {vehicle.year || ""}
            </Typography>
            <Typography variant="subtitle2" sx={{ color: "#666", mb: 2 }}>
              Vehicle ID: {vehicle.id}
              {vehicle.license_plate ? ` • Plate: ${vehicle.license_plate}` : ""}
            </Typography>

            <Divider sx={{ mb: 2 }} />

            <Typography sx={{ mb: 1 }}>
              <b>Fuel Consumption:</b> {vehicle.fuel_consumption || "—"}
            </Typography>
            <Typography sx={{ mb: 1 }}>
              <b>Max Speed:</b> {vehicle.max_speed || "—"}
            </Typography>
            <Typography sx={{ mb: 1 }}>
              <b>Capacity:</b> {vehicle.capacity || "—"}
            </Typography>
            {vehicle.location && (
              <Typography sx={{ mb: 1 }}>
                <b>Location:</b> {vehicle.location}
              </Typography>
            )}
            {vehicle.description && (
              <Typography sx={{ mb: 2, color: "#444" }}>{vehicle.description}</Typography>
            )}

            <Typography sx={{ mt: 1, fontWeight: 700 }}>
              Price: {dayRate} coins / day
            </Typography>
            {minDate && maxDate && (
              <Typography variant="body2" sx={{ color: "#666" }}>
                Available: {minDate} → {maxDate}
              </Typography>
            )}

            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12} sm={6}>
                <Typography>From</Typography>
                <TextField
                  fullWidth
                  type="date"
                  value={fromDate}
                  inputProps={{ min: minDate, max: maxDate }}
                  onChange={(e) => {
                    const v = e.target.value;
                    setFromDate(v);
                    if (toDate && toDate < v) setToDate(v);
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography>To</Typography>
                <TextField
                  fullWidth
                  type="date"
                  value={toDate}
                  inputProps={{ min: fromDate || minDate, max: maxDate }}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        {/* Payment Section */}
        <Box
          sx={{
            mt: 5,
            backgroundColor: "#ff970220",
            borderRadius: 3,
            p: { xs: 3, md: 4 },
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
            Payment Method
          </Typography>
          <Grid container spacing={2}>
            {/* Left buttons */}
            <Grid item xs={12} md={6}>
              <Button fullWidth variant="contained" disabled>
                Pay With Promptpay
              </Button>
              <Button fullWidth variant="contained" disabled sx={{ mt: 2 }}>
                Pay With Credit / Debit Card
              </Button>
              <Button fullWidth variant="contained" disabled sx={{ mt: 2 }}>
                Add Credit / Debit Card
              </Button>
              <Button
                fullWidth
                variant="contained"
                sx={{
                  mt: 2,
                  backgroundColor: "#ff9702",
                  color: "#000",
                  fontWeight: 700,
                  "&:hover": { backgroundColor: "#ffa733" },
                }}
                disabled={confirming}
                onClick={handleBooking}
              >
                {confirming ? "Processing..." : "Pay With Coin"}
              </Button>
              <Typography variant="body2" sx={{ mt: 1, fontStyle: "italic", color: "#555" }}>
                *Other payment methods are unavailable now
              </Typography>
            </Grid>

            {/* Coin Summary */}
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  backgroundColor: "#fff",
                  borderRadius: 3,
                  p: 3,
                  border: "2px solid #ff9702",
                }}
              >
                <Typography sx={{ fontWeight: 600 }}>
                  Coins available: {userCoins}
                </Typography>
                <Typography sx={{ fontWeight: 600 }}>
                  Coins needed: {coinsNeeded}
                </Typography>
                <Typography sx={{ fontWeight: 600, mb: 2 }}>
                  Remaining after rent: {remainingCoins}
                </Typography>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleTopUp}
                  sx={{
                    borderColor: "#ff9702",
                    color: "#ff9702",
                    fontWeight: 700,
                    "&:hover": { backgroundColor: "#fff7ec" },
                  }}
                >
                  💰 Top Up 100 Coins
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Card>
    </Box>
  );
}
