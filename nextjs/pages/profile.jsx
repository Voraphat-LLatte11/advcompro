// pages/profile.jsx
import { useEffect, useState } from "react";
import {
  Box,
  Card,
  Grid,
  Typography,
  TextField,
  Divider,
  Skeleton,
  Button,
} from "@mui/material";
import Swal from "sweetalert2";
import useBearStore from "@/store/useBearStore";
import { useRouter } from "next/router";

// dynamic base
const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || `http://${host}:8000`;

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useBearStore();

  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  // ---- load description ----
  useEffect(() => {
    if (!user?.username) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/users/${encodeURIComponent(user.username)}`);
        if (!res.ok) return;
        const u = await res.json();
        setDescription(u?.description ?? "");
      } catch {}
    })();
  }, [user?.username]);

  // ---- fetch all bookings ----
  useEffect(() => {
    if (!user?.username) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${API_BASE}/bookings/mine?username=${encodeURIComponent(user.username)}`
        );
        const data = await res.json();
        if (!cancelled) setBookings(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [user?.username]);

  // ---- save description ----
  const saveDescription = async () => {
    if (!user?.username) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/users/${encodeURIComponent(user.username)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Failed to save description");

      // (optional) sync to store
      try {
        const curr = useBearStore.getState().user || {};
        useBearStore.setState({ user: { ...curr, description: data.description } });
        localStorage.setItem("bear-store", JSON.stringify(useBearStore.getState()));
      } catch {}

      Swal.fire({ icon: "success", title: "Saved", timer: 900, showConfirmButton: false });
    } catch (e) {
      Swal.fire({ icon: "error", title: "Save failed", text: e.message });
    } finally {
      setSaving(false);
    }
  };

  // ---- logout & delete ----
  const doLocalLogout = () => {
    try {
      useBearStore.getState().logout?.();
      useBearStore.setState({ isAuthed: false, user: null });
      localStorage.removeItem("bear-store");
    } catch {}
    router.push("/").then(() => window.location.reload());
  };

  const onLogout = async () => {
    const ok = await Swal.fire({
      icon: "question",
      title: "Log out?",
      text: "You’ll be signed out.",
      showCancelButton: true,
      confirmButtonText: "Log out",
      confirmButtonColor: "#ff9702",
    });
    if (ok.isConfirmed) doLocalLogout();
  };

  const onDeleteAccount = async () => {
    const step1 = await Swal.fire({
      icon: "warning",
      title: "Delete account?",
      html: "This action cannot be undone.",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#d32f2f",
    });
    if (!step1.isConfirmed) return;
    try {
      await fetch(`${API_BASE}/users/${encodeURIComponent(user.username)}`, {
        method: "DELETE",
      });
      await Swal.fire({
        icon: "success",
        title: "Account removed",
        timer: 1200,
        showConfirmButton: false,
      });
      doLocalLogout();
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "Failed to delete",
        text: e.message || "Unknown error",
      });
    }
  };

  if (!user?.username) {
    return (
      <Box sx={{ p: 6, textAlign: "center" }}>
        <Typography variant="h6">Please log in to see your profile.</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        position: "relative",
        backgroundImage: `
          linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.35)),
          url("/background.jpg")
        `,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        display: "flex",
        flexDirection: "column",
        gap: 3,
        alignItems: "center",
        py: 6,
        px: 2,
      }}
    >
      <Card
        sx={{
          maxWidth: 1100,
          width: { xs: "95%", md: "85%" },
          mx: "auto",
          p: { xs: 3, md: 5 },
          borderRadius: 4,
          boxShadow: "0 10px 25px rgba(0,0,0,0.18)",
          backgroundColor: "rgba(255,255,255,0.86)",
          backdropFilter: "blur(6px)",
        }}
      >
        <Grid container spacing={3}>
          {/* avatar */}
          <Grid item xs={12} md={4} sx={{ display: "flex", justifyContent: "center" }}>
            <Box
              sx={{
                width: 220,
                height: 220,
                borderRadius: "50%",
                bgcolor: "#fff",
                border: "6px solid #ff9702",
                backgroundImage: 'url("/avatar-placeholder.png")',
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          </Grid>

          {/* info */}
          <Grid item xs={12} md={8}>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 2, color: "#000" }}>
              Profile Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Username" value={user.username} disabled />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  placeholder="Write about yourself..."
                  multiline
                  minRows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
                  <Button
                    variant="contained"
                    onClick={saveDescription}
                    disabled={saving}
                    sx={{
                      backgroundColor: "#ff9702",
                      color: "#000",
                      fontWeight: 800,
                      "&:hover": { backgroundColor: "#ffa733" },
                    }}
                  >
                    {saving ? "Saving..." : "Save Description"}
                  </Button>
                </Box>
              </Grid>

              <Grid item xs={12} sx={{ display: "flex", gap: 1.5, mt: 1 }}>
                <Button
                  variant="contained"
                  onClick={onLogout}
                  sx={{
                    backgroundColor: "#ff9702",
                    color: "#000",
                    fontWeight: 800,
                    "&:hover": { backgroundColor: "#ffa733" },
                  }}
                >
                  LOG OUT
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={onDeleteAccount}
                  sx={{ fontWeight: 800, borderColor: "#d32f2f", color: "#d32f2f" }}
                >
                  DELETE ACCOUNT
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        {/* ---- ALL BOOKINGS ---- */}
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: "#000" }}>
          All Bookings:
        </Typography>
        {loading ? (
          <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 3 }} />
        ) : bookings.length === 0 ? (
          <Typography sx={{ color: "#444", ml: 1 }}>No bookings yet.</Typography>
        ) : (
          <Box sx={{ display: "grid", gap: 2 }}>
            {bookings.map((b) => (
              <RentalCard key={b.id} booking={b} />
            ))}
          </Box>
        )}
      </Card>
    </Box>
  );
}

// card for each booking
function RentalCard({ booking }) {
  const img = booking.image_url || "/yamaha-fazzio.jpg";
  const statusLabel =
    booking.status === "ongoing"
      ? "Ongoing"
      : booking.status === "completed"
      ? "Completed"
      : "Upcoming";

  return (
    <Card
      sx={{
        p: 2.5,
        borderRadius: 3,
        display: "flex",
        gap: 2,
        alignItems: "center",
        backgroundColor: "#fff",
      }}
    >
      <Box
        component="img"
        src={img}
        alt={`${booking.brand} ${booking.model}`}
        sx={{ width: 180, borderRadius: 2 }}
      />
      <Box sx={{ flex: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          {booking.brand} {booking.model}
        </Typography>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption">Rent From:</Typography>
            <TextField fullWidth size="small" value={booking.start_date} disabled />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption">Rent To:</Typography>
            <TextField fullWidth size="small" value={booking.end_date} disabled />
          </Grid>
        </Grid>
        <TextField
          sx={{ mt: 1.5, maxWidth: 220 }}
          size="small"
          label="Status"
          value={statusLabel}
          disabled
        />
      </Box>
    </Card>
  );
}
