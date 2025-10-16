import { useRouter } from "next/router";
import { useEffect, useState } from "react";
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

export default function VehicleBooking() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useBearStore();

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [userCoins, setUserCoins] = useState(0);
  const [coinsNeeded, setCoinsNeeded] = useState(0);
  const [remainingCoins, setRemainingCoins] = useState(0);
  const [confirming, setConfirming] = useState(false);

  // --- Fetch vehicle details ---
  useEffect(() => {
    if (!id) return;
    const fetchVehicle = async () => {
      try {
        const res = await fetch(`http://localhost:8000/vehicles/${id}`);
        const data = await res.json();
        setVehicle(data);
      } catch (err) {
        console.error("Vehicle fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchVehicle();
  }, [id]);

  // --- Fetch user's coin balance ---
  useEffect(() => {
    if (!user?.username) return;
    const fetchBalance = async () => {
      try {
        const res = await fetch(
          `http://localhost:8000/coins/balance?username=${user.username}`
        );
        if (!res.ok) throw new Error("Failed to fetch balance");
        const data = await res.json();
        setUserCoins(data.coin_balance);
        setRemainingCoins(data.coin_balance);
      } catch (err) {
        console.error("Balance fetch error:", err);
      }
    };
    fetchBalance();
  }, [user?.username]);

  // --- Calculate coins needed when date changes ---
  useEffect(() => {
    if (fromDate && toDate) {
      const start = new Date(fromDate);
      const end = new Date(toDate);
      if (end < start) return;

      const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
      const needed = days * 100; // example rate: 100 coins/day
      setCoinsNeeded(needed);
      setRemainingCoins(Math.max(0, userCoins - needed));
    }
  }, [fromDate, toDate, userCoins]);

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

      // ✅ Now update local balance here (inside the same try block)
      setUserCoins(data.coin_balance);
      setRemainingCoins(Math.max(0, data.coin_balance - coinsNeeded));

      // ✅ And sync to authoritative server balance
      await refreshBalance(user.username);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", err.message, "error");
    }
  };


  // --- Booking process ---
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

  const refreshBalance = async (username) => {
    try {
      const r = await fetch(`${API_BASE}/coins/balance?username=${username}`);
      if (!r.ok) return;
      const b = await r.json();
      setUserCoins(b.coin_balance);
      setRemainingCoins(Math.max(0, b.coin_balance - coinsNeeded));
    } catch (_) {}
  };

  const safePost = async (url, body) => {
    // Small helper that returns { ok, status, data } or throws on network errors
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    let data = {};
    try { data = await res.json(); } catch (_) {}
    return { ok: res.ok, status: res.status, data };
  };

  const handleBooking = async () => {
    if (!user?.username) {
      Swal.fire("Not logged in", "Please login first.", "warning");
      return;
    }
    if (!fromDate || !toDate) {
      Swal.fire("Select Dates", "Please choose rental dates first.", "warning");
      return;
    }
    const start = new Date(fromDate), end = new Date(toDate);
    if (end < start) {
      Swal.fire("Invalid dates", "End date must be after start date.", "warning");
      return;
    }
    if (coinsNeeded > userCoins) {
      Swal.fire("Not Enough Coins", "Please top up your balance.", "error");
      return;
    }
    if (confirming) return;
    setConfirming(true);

    const spendBody = {
      username: user.username,
      amount: coinsNeeded,
      reason: "booking",
      reference_type: "vehicle",
      reference_id: `VEH-${id}`,
      metadata: { vehicle_id: id, fromDate, toDate },
    };

    try {
      // 1) Spend coins
      const spend = await safePost(`${API_BASE}/coins/spend`, spendBody);
      if (!spend.ok) {
        throw new Error(spend.data?.detail || `Coin spend failed (HTTP ${spend.status})`);
      }

      // ✅ Optimistically update local balance immediately
      const spentBalance = spend.data?.coin_balance ?? (userCoins - coinsNeeded);
      setUserCoins(spentBalance);
      setRemainingCoins(Math.max(0, spentBalance - coinsNeeded));

      // 2) Create booking (query params; many backends expect that)
      const params = new URLSearchParams({
        vehicle_id: String(id),
        start_date: fromDate,
        end_date: toDate,
      });

      let bookingOk = false, bookingErr = null;
      try {
        const bookRes = await fetch(`${API_BASE}/bookings?${params.toString()}`, { method: "POST" });
        if (!bookRes.ok) {
          const detail = await bookRes.json().then(j => j.detail).catch(() => "");
          bookingErr = new Error(detail || `Booking failed (HTTP ${bookRes.status})`);
        } else {
          bookingOk = true;
        }
      } catch (e) {
        // 🔥 This is where browsers throw "Failed to fetch" (CORS/offline)
        bookingErr = new Error("Booking network error: Failed to fetch");
      }

      if (!bookingOk) {
        // 3) Refund (best-effort), then refresh balance from server
        await safePost(`${API_BASE}/coins/add`, {
          username: user.username,
          amount: coinsNeeded,
          reason: "refund",
          reference_type: "booking",
          reference_id: `REFUND-VEH-${id}-${Date.now()}`,
          metadata: { vehicle_id: id, fromDate, toDate, cause: "booking_failed_or_network" },
        });
        await refreshBalance(user.username);
        throw bookingErr; // surface error to UI
      }

      // 4) Success
      Swal.fire({
        title: "Booking Confirmed!",
        text: `You have booked ${vehicle.brand} ${vehicle.model}.`,
        icon: "success",
        confirmButtonColor: "#ff9702",
      });
      router.push("/mainpage");
    } catch (err) {
      console.error(err);
      Swal.fire("Error", String(err.message || err), "error");
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

  // Min & Max rental limits
  const minDate = vehicle.rent_start_date ? vehicle.rent_start_date.slice(0, 10) : "";
  const maxDate = vehicle.rent_end_date ? vehicle.rent_end_date.slice(0, 10) : "";

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
              src={vehicle.image_url || "/yamaha-fazzio.jpg"}
              alt={vehicle.model}
              sx={{
                width: "100%",
                borderRadius: 3,
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
            />
          </Grid>

          {/* Right: Vehicle details */}
          <Grid item xs={12} md={7}>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: "#000" }}>
              {vehicle.brand} {vehicle.model} {vehicle.year || ""}
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Typography sx={{ mb: 1 }}>
              <b>Fuel Consumption:</b> {vehicle.fuel_consumption || "55–65 km/L"}
            </Typography>
            <Typography sx={{ mb: 1 }}>
              <b>Max Speed:</b> {vehicle.max_speed || "110 km/h"}
            </Typography>
            <Typography sx={{ mb: 1 }}>
              <b>Capacity:</b> {vehicle.capacity || "2 people (including driver)"}
            </Typography>

            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12} sm={6}>
                <Typography>From</Typography>
                <TextField
                  fullWidth
                  type="date"
                  value={fromDate}
                  inputProps={{ min: minDate, max: maxDate }}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography>To</Typography>
                <TextField
                  fullWidth
                  type="date"
                  value={toDate}
                  inputProps={{ min: minDate, max: maxDate }}
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
              <Typography
                variant="body2"
                sx={{ mt: 1, fontStyle: "italic", color: "#555" }}
              >
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
