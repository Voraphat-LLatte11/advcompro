import { useState } from "react";
import {
  Box, Paper, Grid, Typography, TextField, MenuItem,
  Button, Stack, Link as MUILink
} from "@mui/material";
import NextLink from "next/link";
import Swal from "sweetalert2";
import { useRouter } from "next/router";

const OPTIONS = {
  Car: {
    Toyota: ["Yaris", "Vios", "Corolla"],
    Honda: ["City", "Civic", "Jazz"],
    Mazda: ["2", "3", "CX-3"],
  },
  Motorcycle: {
    Yamaha: ["Fazzio", "Aerox", "Grand Filano"],
    Honda: ["Click", "PCX", "Wave"],
    Vespa: ["Primavera", "Sprint"],
  },
};

export default function VehicleAdd() {
  const router = useRouter();

  const [type, setType] = useState("Car");
  const [brand, setBrand] = useState("Toyota");
  const [model, setModel] = useState(OPTIONS.Car.Toyota[0]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);

  const brands = Object.keys(OPTIONS[type]);
  const models = OPTIONS[type][brand] || [];

  const onChangeType = (v) => {
    setType(v);
    const firstBrand = Object.keys(OPTIONS[v])[0];
    setBrand(firstBrand);
    setModel(OPTIONS[v][firstBrand][0]);
  };

  const onChangeBrand = (v) => {
    setBrand(v);
    setModel((OPTIONS[type][v] || [])[0] || "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!startDate || !endDate) {
      Swal.fire({ icon: "error", title: "Missing dates", text: "Please select start and end date." });
      return;
    }
    if (endDate < startDate) {
      Swal.fire({ icon: "error", title: "Date range invalid", text: "End date must be after start date." });
      return;
    }

    try {
      setLoading(true);
      const payload = {
        type_of_car: type,
        brand,
        model,
        rent_start_date: startDate,   // YYYY-MM-DD from <input type="date">
        rent_end_date: endDate,
      };

      const res = await fetch("http://localhost:8000/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to add vehicle");

      await Swal.fire({
        icon: "success",
        title: "Vehicle added",
        timer: 1500,
        showConfirmButton: false,
      });
      router.push(`/mainpage?type=${encodeURIComponent(type)}&brand=${encodeURIComponent(brand)}&model=${encodeURIComponent(model)}&from=${startDate || ""}&to=${endDate || ""}`);
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: "100vh", bgcolor: "#2f2f2f",
      display: "flex", alignItems: "center", justifyContent: "center",
      p: { xs: 2, md: 4 },
    }}>
      <Paper elevation={6} sx={{
        width: "100%", maxWidth: 1000, borderRadius: 3, overflow: "hidden",
        p: { xs: 1.5, md: 2.5 },
      }}>
        <Grid container>
          {/* LEFT ORANGE PANEL (same style as login) */}
          <Grid item xs={12} md={5}>
            <Box sx={{
              bgcolor: "#ff9702", borderRadius: 3, height: { xs: 220, md: "100%" },
              display: "flex", flexDirection: "column", justifyContent: "space-between",
              p: { xs: 3, md: 4 }, m: { xs: 0, md: 1 },
            }}>
              <Box>
                <Typography sx={{ fontSize: { xs: 22, md: 28 }, fontWeight: 700, color: "#111" }}>
                  Add Vehicle
                </Typography>
                <Typography sx={{ fontSize: { xs: 28, md: 34 }, fontWeight: 800, color: "#111", lineHeight: 1.1 }}>
                  BidKomKom
                </Typography>
              </Box>
              <Box component="img" src="/car.png" alt="car"
                sx={{ width: "100%", height: { xs: 110, md: 180 }, objectFit: "contain" }}
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            </Box>
          </Grid>

          {/* RIGHT FORM */}
          <Grid item xs={12} md={7} sx={{ display: "flex", alignItems: "center" }}>
            <Box component="form" onSubmit={handleSubmit}
              sx={{ width: "100%", px: { xs: 2.5, md: 6 }, py: { xs: 3, md: 6 } }}>
              <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontSize: 32, fontWeight: 800, letterSpacing: 2 }}>
                  NEW VEHICLE
                </Typography>
                <Box sx={{ width: 48, height: 6, bgcolor: "#ff9702", mt: 0.5 }} />
              </Box>

              <Stack spacing={2}>
                <TextField select label="Car Type" value={type} onChange={(e) => onChangeType(e.target.value)} fullWidth>
                  {Object.keys(OPTIONS).map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>

                <TextField select label="Brand" value={brand} onChange={(e) => onChangeBrand(e.target.value)} fullWidth>
                  {brands.map((b) => <MenuItem key={b} value={b}>{b}</MenuItem>)}
                </TextField>

                <TextField select label="Model" value={model} onChange={(e) => setModel(e.target.value)} fullWidth>
                  {models.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                </TextField>

                <TextField label="Rent Start Date" type="date" InputLabelProps={{ shrink: true }}
                  value={startDate} onChange={(e) => setStartDate(e.target.value)} fullWidth />
                <TextField label="Rent End Date" type="date" InputLabelProps={{ shrink: true }}
                  value={endDate} onChange={(e) => setEndDate(e.target.value)} fullWidth />

                <Stack direction="row" spacing={1.5} sx={{ mt: 1 }}>
                  <Button type="submit" variant="contained" disabled={loading}
                    sx={{ bgcolor: "#ff9702", color: "#000", fontWeight: 700, "&:hover": { bgcolor: "#ffa733" } }}>
                    {loading ? "Saving..." : "Save"}
                  </Button>
                  <Button variant="outlined" onClick={() => router.push("/mainpage")}
                    sx={{ color: "#000", borderColor: "#000" }}>
                    Back to Vehicle Search
                  </Button>
                </Stack>
              </Stack>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
