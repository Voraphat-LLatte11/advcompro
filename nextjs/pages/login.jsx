// pages/login.jsx (or wherever your login page lives)
import { useState } from "react";
import {
  Box,
  Paper,
  Grid,
  Typography,
  TextField,
  Button,
  Stack,
  Link as MUILink,
} from "@mui/material";
import Swal from "sweetalert2";
import { useRouter } from "next/router";
import useBearStore from "@/store/useBearStore";

export default function Login() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch("http://localhost:8000/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.detail || "Login failed");

        // ✅ update store BEFORE redirect
        useBearStore.getState().setAuth({
            user: { username: result.username ?? form.username },
            token: result.token ?? null,
        });

        // SweetAlert + 3s delay then go to dashboard
        Swal.fire({
            title: "Success!",
            text: "Login successful! Redirecting...",
            icon: "success",
            timer: 3000,
            showConfirmButton: false,
            willClose: () => {
                router.push("/mainpage"); // or /dashboard
            },
        });

    } catch (err) {
      Swal.fire({ title: "Error", text: err.message, icon: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#2f2f2f", // dark background around the card
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: { xs: 2, md: 4 },
      }}
    >
      <Paper
        elevation={6}
        sx={{
          width: "100%",
          maxWidth: 1000,
          borderRadius: 3,
          overflow: "hidden",
          p: { xs: 1.5, md: 2.5 },
        }}
      >
        <Grid container>
          {/* LEFT ORANGE PANEL */}
          <Grid item xs={12} md={5}>
            <Box
              sx={{
                bgcolor: "#ff9702",
                borderRadius: 3,
                height: { xs: 220, md: "100%" },
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                p: { xs: 3, md: 4 },
                m: { xs: 0, md: 1 },
              }}
            >
              <Box>
                <Typography
                  sx={{
                    fontSize: { xs: 22, md: 28 },
                    fontWeight: 700,
                    color: "#111",
                  }}
                >
                  Welcome To
                </Typography>
                <Typography
                  sx={{
                    fontSize: { xs: 28, md: 34 },
                    fontWeight: 800,
                    color: "#111",
                    lineHeight: 1.1,
                  }}
                >
                  BidKomKom
                </Typography>
              </Box>

              {/* Car image placeholder — replace src with your asset */}
              <Box
                component="img"
                src="/car.png" // put a car image in /public/car.png
                alt="car"
                sx={{
                  width: "100%",
                  height: { xs: 110, md: 180 },
                  objectFit: "contain",
                  filter: "drop-shadow(0px 4px 8px rgba(0,0,0,0.2))",
                }}
                onError={(e) => {
                  // simple fallback if image not found
                  e.currentTarget.style.display = "none";
                }}
              />
            </Box>
          </Grid>

          {/* RIGHT LOGIN AREA */}
          <Grid item xs={12} md={7} sx={{ display: "flex", alignItems: "center" }}>
            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{
                width: "100%",
                px: { xs: 2.5, md: 6 },
                py: { xs: 3, md: 6 },
              }}
            >
              {/* LOGIN title with orange underline */}
              <Box sx={{ mb: 3 }}>
                <Typography
                  sx={{ fontSize: 36, fontWeight: 800, letterSpacing: 4 }}
                >
                  LOGIN
                </Typography>
                <Box sx={{ width: 48, height: 6, bgcolor: "#ff9702", mt: 0.5 }} />
              </Box>

              <Stack spacing={2.2}>
                <TextField
                  label="Username"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  required
                  fullWidth
                  variant="outlined"
                  InputProps={{
                    sx: {
                      bgcolor: "#e6e6e6",
                      borderRadius: 1,
                    },
                  }}
                />
                <TextField
                  label="Password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  fullWidth
                  variant="outlined"
                  InputProps={{
                    sx: {
                      bgcolor: "#e6e6e6",
                      borderRadius: 1,
                    },
                  }}
                />

                <Box sx={{ textAlign: "right", mt: -1 }}>
                  <MUILink
                    href="#"
                    underline="hover"
                    sx={{ fontSize: 12, color: "#6b6b6b" }}
                    onClick={(e) => e.preventDefault()}
                  >
                    forgot password?
                  </MUILink>
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{
                    bgcolor: "#ff9702",
                    textTransform: "none",
                    fontWeight: 700,
                    borderRadius: 1,
                    py: 1.1,
                    "&:hover": { bgcolor: "#ff9702" },
                  }}
                >
                  {loading ? "Logging in..." : "Login"}
                </Button>

                <Box sx={{ textAlign: "center", mt: 0.5 }}>
                  <MUILink
                    href="/register"
                    underline="hover"
                    sx={{ fontSize: 12, color: "#111" }}
                  >
                    Don&apos;t have an account?
                  </MUILink>
                </Box>
              </Stack>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
