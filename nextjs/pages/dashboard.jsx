// pages/dashboard.jsx
import { useEffect, useState } from "react";
import {
  Box,
  Card,
  Grid,
  Typography,
  Button,
  Skeleton,
} from "@mui/material";

const host =
  typeof window !== "undefined" ? window.location.hostname : "localhost";
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || `http://${host}:8000`;

export default function OverallDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/metrics`);
      const data = await res.json();
      setMetrics(data);
    } catch (e) {
      console.error("metrics error:", e);
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const Tile = ({ title, value }) => (
    <Card
      sx={{
        p: 3,
        borderRadius: 3,
        background: "#ff9702",
        color: "#000",
        minHeight: 190,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
      }}
    >
      <Typography sx={{ fontWeight: 800, fontSize: 18 }}>{title}</Typography>
      <Box sx={{ textAlign: "right" }}>
        {loading ? (
          <Skeleton variant="text" width={120} height={56} />
        ) : (
          <Typography sx={{ fontWeight: 900, fontSize: 44, lineHeight: 1 }}>
            {value ?? 0}
          </Typography>
        )}
      </Box>
    </Card>
  );

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
        justifyContent: "center",
        alignItems: "flex-start",
        py: 6,
        px: 2,
      }}
    >
      <Card
        sx={{
          width: "100%",
          maxWidth: 1100,
          p: { xs: 3, md: 5 },
          borderRadius: 4,
          backgroundColor: "rgba(255,255,255,0.86)",
          backdropFilter: "blur(6px)",
          boxShadow: "0 12px 28px rgba(0,0,0,0.22)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 3,
          }}
        >
          <Typography sx={{ fontSize: 36, fontWeight: 900, color: "#000" }}>
            Overall Dashboard
          </Typography>
          <Button
            onClick={load}
            variant="contained"
            sx={{
              backgroundColor: "#ff9702",
              color: "#000",
              fontWeight: 800,
              "&:hover": { backgroundColor: "#ffa733" },
            }}
          >
            Refresh
          </Button>
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Tile title="Total Users:" value={metrics?.total_users} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Tile title="Total Rentals:" value={metrics?.total_rentals} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Tile
              title="Total Spending (Coins Used):"
              value={
                loading
                  ? null
                  : (metrics?.total_spending ?? 0).toLocaleString()
              }
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Tile
              title="Available Vehicles:"
              value={metrics?.available_vehicles}
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, textAlign: "right", color: "#333" }}>
          {loading ? "Loading…" : `Updated: ${new Date().toLocaleString()}`}
        </Box>
      </Card>
    </Box>
  );
}
