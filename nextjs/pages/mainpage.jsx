// pages/mainpage.jsx
import {
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  Grid,
  Card,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Swal from "sweetalert2";
import useBearStore from "@/store/useBearStore";

const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || `http://${host}:8000`;

// ---------- Static options for the filters ----------
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
  const [resetVersion, setResetVersion] = useState(0);
  const router = useRouter();
  const { isAuthed, _hasHydrated, user } = useBearStore();

  // ---------- Filter state ----------
  const [carType, setCarType] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [startDate, setStartDate] = useState(""); // YYYY-MM-DD
  const [endDate, setEndDate] = useState("");

  // ---------- Data / UI state ----------
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [filtersReady, setFiltersReady] = useState(false); // set true after URL hydration

  // ---------- Columns ----------
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

  // ---------- Derived lists ----------
  const brandList = carType && OPTIONS[carType] ? Object.keys(OPTIONS[carType]) : [];
  const modelList =
    carType && brand && OPTIONS[carType]?.[brand] ? OPTIONS[carType][brand] : [];

  useEffect(() => {
    if (!carType || !OPTIONS[carType]) {
      setBrand("");
      setModel("");
    }
  }, [carType]);

  useEffect(() => {
    if (!brand || !OPTIONS[carType]?.[brand]) {
      setModel("");
    }
  }, [brand, carType]);

  // ---------- Hydrate filters from URL once ----------
  useEffect(() => {
    if (!router.isReady) return;

    const { type, brand: qBrand, model: qModel, from, to } = router.query;

    if (type && OPTIONS[type]) setCarType(type);
    else setCarType("");

    if (type && OPTIONS[type] && qBrand && OPTIONS[type][qBrand]) setBrand(qBrand);
    else setBrand("");

    if (
      type &&
      OPTIONS[type] &&
      qBrand &&
      OPTIONS[type][qBrand] &&
      qModel &&
      OPTIONS[type][qBrand].includes(qModel)
    ) {
      setModel(qModel);
    } else {
      setModel("");
    }

    setStartDate(from ? String(from) : "");
    setEndDate(to ? String(to) : "");

    setFiltersReady(true);
  }, [router.isReady]);

  // ---------- Fetch vehicles (hides vehicles booked by others) ----------
  const fetchVehicles = async (clearAll = false, attempt = 1) => {
    setLoading(true);
    try {
      const today = new Date().toISOString().slice(0, 10);

      // Build params
      const params = new URLSearchParams();

      // hide vehicles booked by others; keep mine visible
      params.append("exclude_booked", "true");
      if (user?.username) params.append("viewer_username", user.username);

      if (!clearAll) {
        if (carType) params.append("type_of_car", carType);
        if (brand) params.append("brand", brand);
        if (model) params.append("model", model);
        // If no explicit dates chosen, default to today..today so newly-booked vehicles vanish
        if (startDate) params.append("from_date", startDate);
        if (endDate)   params.append("to_date", endDate);
      } else {
        // clear filters but still show availability for today by default
        params.append("from_date", today);
        params.append("to_date", today);
      }

      let url = `${API_BASE}/vehicles?${params.toString()}`;
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} – ${text || "no body"}`);
      }

      const data = await res.json();
      setRows(data);

      // Optional optimistic removal if another page set this flag
      const just = sessionStorage.getItem("justBookedVehicleId");
      if (just) {
        setRows((prev) => prev.filter((r) => String(r.id) !== String(just)));
        sessionStorage.removeItem("justBookedVehicleId");
      }
    } catch (e) {
      if (attempt === 1) {
        setTimeout(() => fetchVehicles(clearAll, 2), 600);
      } else {
        setRows([]);
        Swal.fire({
          icon: "error",
          title: "Server unavailable",
          text: e.message,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // ---------- Initial fetch after filters are hydrated ----------
  useEffect(() => {
    if (!filtersReady) return;
    fetchVehicles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersReady, user?.username]); // refetch when user hydrates

  // ---------- Handlers ----------
  const clearFilters = () => {
    setCarType("");
    setBrand("");
    setModel("");
    setStartDate("");
    setEndDate("");
    setSelectedIds([]);
    setResetVersion((v) => v + 1);

    router.replace("/mainpage", undefined, { shallow: true });

    // give UI time to reset first
    setTimeout(() => fetchVehicles(true), 150);
  };

  const goToAdd = () => {
    router.push("/vehicleadd");
  };

  const goToDelete = () => {
    if (!selectedIds.length) return;
    const path =
      selectedIds.length === 1
        ? `/vehicledel?id=${encodeURIComponent(selectedIds[0])}`
        : `/vehicledel?ids=${selectedIds.map((id) => encodeURIComponent(id)).join(",")}`;
    router.push(path);
  };

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
              key={`type-${resetVersion}`}
              select
              label="Car Type"
              value={carType || ""}
              onChange={(e) => setCarType(e.target.value)}
              fullWidth
              SelectProps={{ displayEmpty: true }}
            >
              <MenuItem value="">
                <em></em>
              </MenuItem>
              {Object.keys(OPTIONS).map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              key={`brand-${resetVersion}`}
              select
              label="Brand"
              value={brand || ""}
              onChange={(e) => setBrand(e.target.value)}
              fullWidth
              disabled={!carType}
              SelectProps={{ displayEmpty: true }}
            >
              <MenuItem value="">
                <em></em>
              </MenuItem>
              {(brandList || []).map((b) => (
                <MenuItem key={b} value={b}>
                  {b}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              key={`model-${resetVersion}`}
              select
              label="Model"
              value={model || ""}
              onChange={(e) => setModel(e.target.value)}
              fullWidth
              disabled={!carType || !brand}
              SelectProps={{ displayEmpty: true }}
            >
              <MenuItem value="">
                <em></em>
              </MenuItem>
              {(modelList || []).map((m) => (
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

          <Grid item xs={12} display="flex" gap={2} justifyContent="center" mt={1}>
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
              disabled={loading}
              sx={{ backgroundColor: "#ffffffff", color: "#000", borderColor: "#000" }}
            >
              Clear
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Actions + Vehicle list */}
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
        {_hasHydrated && isAuthed && (
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, mb: 1 }}>
            <Button
              variant="contained"
              onClick={goToAdd}
              sx={{
                backgroundColor: "#ff9702",
                color: "#000",
                fontWeight: 700,
                "&:hover": { backgroundColor: "#ffa733" },
              }}
            >
              Add
            </Button>
            <Button
              variant="outlined"
              onClick={goToDelete}
              disabled={!selectedIds.length}
              sx={{ color: "#000", borderColor: "#000" }}
            >
              Delete
            </Button>
          </Box>
        )}

        <div style={{ height: 420, width: "100%" }}>
          <DataGrid
            rows={rows}
            columns={columns}
            getRowId={(row) => row.id}
            loading={loading}
            checkboxSelection
            disableRowSelectionOnClick
            onRowSelectionModelChange={(ids) => setSelectedIds(ids)}
            rowSelectionModel={selectedIds}
            sortingOrder={["asc", "desc"]}
            initialState={{
              sorting: { sortModel: [{ field: "type_of_car", sort: "asc" }] },
            }}
            onRowDoubleClick={(params) => {
              router.push(`/vehicle/${params.row.id}`);
            }}
          />
        </div>
      </Card>
    </Box>
  );
}
