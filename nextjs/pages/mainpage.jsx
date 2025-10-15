// pages/mainpage.jsx
import {
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  Grid,
  Card,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Swal from "sweetalert2";

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

export default function MainPage() {
  const router = useRouter();

  const [carType, setCarType] = useState("Car");
  const [brand, setBrand] = useState("Toyota");
  const [model, setModel] = useState(OPTIONS.Car.Toyota[0]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // Columns for DataGrid
  const columns = useMemo(
    () => [
      { field: "type_of_car", headerName: "Type", flex: 1, minWidth: 120 },
      { field: "brand", headerName: "Brand", flex: 1, minWidth: 120 },
      { field: "model", headerName: "Model", flex: 1, minWidth: 140 },
      { field: "rent_start_date", headerName: "Rent Start", flex: 1, minWidth: 130 },
      { field: "rent_end_date", headerName: "Rent End", flex: 1, minWidth: 130 },
    ],
    []
  );

  // sync brand/model defaults when car type changes
  useEffect(() => {
    const brands = Object.keys(OPTIONS[carType]);
    const firstBrand = brands[0];
    setBrand(firstBrand);
    setModel(OPTIONS[carType][firstBrand][0]);
  }, [carType]);

  // sync model when brand changes
  useEffect(() => {
    const firstModel = OPTIONS[carType][brand]?.[0] ?? "";
    setModel(firstModel);
  }, [brand, carType]);

  // initial fetch: all vehicles
  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async (clearAll = false) => {
    setLoading(true);
    try {
      let url = "http://localhost:8000/vehicles";
      if (!clearAll) {
        const params = new URLSearchParams();
        if (carType) params.append("type_of_car", carType);
        if (brand) params.append("brand", brand);
        if (model) params.append("model", model);
        if (startDate) params.append("from_date", startDate);
        if (endDate) params.append("to_date", endDate);
        if (params.toString()) url += `?${params.toString()}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to load vehicles");
      setRows(data);
    } catch (e) {
      console.error(e);
      setRows([]);
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
  setCarType("Car");
  setBrand("Toyota");
  setModel(OPTIONS.Car.Toyota[0]);
  setStartDate("");
  setEndDate("");
  fetchVehicles(true); // reload full list with no filters
  };


  const brandList = Object.keys(OPTIONS[carType] || {});
  const modelList = (OPTIONS[carType]?.[brand]) || [];

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
      {/* Search box */}
      <Card
        elevation={8}
        sx={{
          position: "relative",
          zIndex: 2,
          backgroundColor: "rgba(255,255,255,0.82)",
          backdropFilter: "blur(6px)",
          borderRadius: 4,
          p: { xs: 3, md: 5 },
          width: { xs: "95%", md: "85%", lg: "70%" },
          maxWidth: 1000,
        }}
      >
        <Typography
          align="center"
          sx={{
            fontWeight: 900,
            letterSpacing: 2,
            fontSize: { xs: "2rem", md: "2.6rem" },
            color: "#000",
            mb: 3,
          }}
        >
          Vehicle Search
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              label="Car Type"
              value={carType}
              onChange={(e) => setCarType(e.target.value)}
              fullWidth
            >
              {Object.keys(OPTIONS).map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              label="Brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              fullWidth
            >
              {brandList.map((b) => (
                <MenuItem key={b} value={b}>
                  {b}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              label="Model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              fullWidth
            >
              {modelList.map((m) => (
                <MenuItem key={m} value={m}>
                  {m}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Rent Start Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              fullWidth
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Rent End Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              fullWidth
            />
          </Grid>

          <Grid
            item
            xs={12}
            display="flex"
            gap={2}
            justifyContent="center"
            mt={1}
          >
            <Button
              variant="contained"
              onClick={() => fetchVehicles()}
              disabled={loading}
              sx={{
                backgroundColor: "#ff9702",
                color: "#000",
                fontWeight: 700,
                px: 4,
                "&:hover": { backgroundColor: "#ffa733" },
              }}
            >
              {loading ? "Searching..." : "Search"}
            </Button>
            <Button
              variant="outlined"
              onClick={clearFilters}
              sx={{ color: "#000", borderColor: "#000" }}
            >
              Clear
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Vehicle list */}
      <Card
        sx={{
          position: "relative",
          zIndex: 2,
          width: { xs: "95%", md: "85%", lg: "70%" },
          maxWidth: 1000,
          p: 2,
          borderRadius: 3,
          backgroundColor: "#fff",
          boxShadow: "0px 6px 14px rgba(0,0,0,0.15)",
        }}
      >
        <div style={{ height: 420, width: "100%" }}>
          <DataGrid
            rows={rows}
            columns={columns}
            loading={loading}
            disableRowSelectionOnClick
            sortingOrder={["asc", "desc"]}
            initialState={{
              sorting: { sortModel: [{ field: "type_of_car", sort: "asc" }] },
            }}
            onRowClick={(params) => {
              // 👇 navigate to details page with vehicle id
              router.push(`/vehicle/${params.row.id}`);
            }}
          />
        </div>
      </Card>
    </Box>
  );
}
