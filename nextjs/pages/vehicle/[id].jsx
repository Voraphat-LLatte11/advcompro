// pages/vehicle/[id].jsx
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  Divider,
  CircularProgress,
} from "@mui/material";

export default function VehicleDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchVehicle = async () => {
      try {
        const res = await fetch(`http://localhost:8000/vehicles/${id}`);
        const data = await res.json();
        setVehicle(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchVehicle();
  }, [id]);

  if (loading)
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          bgcolor: "#fff",
        }}
      >
        <CircularProgress sx={{ color: "#ff9702" }} />
      </Box>
    );

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
        alignItems: "center",
        px: 2,
        py: 8,
      }}
    >
      {/* Glass Card */}
      <Card
        elevation={10}
        sx={{
          position: "relative",
          zIndex: 2,
          backgroundColor: "rgba(255,255,255,0.88)",
          backdropFilter: "blur(8px)",
          borderRadius: 4,
          p: { xs: 3, md: 5 },
          boxShadow: "0 8px 25px rgba(0,0,0,0.3)",
          width: { xs: "90%", md: "70%", lg: "50%" },
          maxWidth: 700,
        }}
      >
        <Typography
          align="center"
          sx={{
            fontWeight: 900,
            fontSize: { xs: "2.4rem", md: "3rem" },
            letterSpacing: 2,
            mb: 3,
            color: "#000",
          }}
        >
          {vehicle.brand} {vehicle.model}
        </Typography>

        <Divider sx={{ mb: 3 }} />

        <Typography sx={{ mb: 1 }}>
          <b>Type:</b> {vehicle.type_of_car}
        </Typography>
        <Typography sx={{ mb: 1 }}>
          <b>Brand:</b> {vehicle.brand}
        </Typography>
        <Typography sx={{ mb: 1 }}>
          <b>Model:</b> {vehicle.model}
        </Typography>
        <Typography sx={{ mb: 1 }}>
          <b>Rent Start:</b> {vehicle.rent_start_date || "N/A"}
        </Typography>
        <Typography sx={{ mb: 3 }}>
          <b>Rent End:</b> {vehicle.rent_end_date || "N/A"}
        </Typography>

        <Divider sx={{ mb: 3 }} />

        <Box sx={{ textAlign: "center" }}>
          <Button
            onClick={() => router.push("/mainpage")}
            variant="contained"
            sx={{
              backgroundColor: "#ff9702",
              color: "#000",
              fontWeight: 700,
              borderRadius: 2,
              px: 4,
              py: 1.2,
              "&:hover": {
                backgroundColor: "#ffa733",
                boxShadow: "0 4px 12px rgba(255,151,2,0.5)",
              },
            }}
          >
            ← Back to Vehicle List
          </Button>
        </Box>
      </Card>
    </Box>
  );
}
