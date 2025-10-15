// pages/register.jsx
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

export default function Register() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      Swal.fire({
        title: "Error",
        text: "Passwords do not match",
        icon: "error",
      });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("http://localhost:8000/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          password: form.password,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.detail || "Registration failed");

      Swal.fire({
        title: "Success!",
        text: "User registered successfully! Redirecting...",
        icon: "success",
        timer: 3000,          // show SweetAlert for 3s
        showConfirmButton: false,
        willClose: () => {
            router.push("/login"); // go to login after 3s
        },
      });

      setForm({ username: "", password: "", confirmPassword: "" });
      router.push("/login"); // go to login after success
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
        bgcolor: "#2f2f2f",
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

              {/* Car image */}
              <Box
                component="img"
                src="/car.png" // put your car image in /public/car.png
                alt="car"
                sx={{
                  width: "100%",
                  height: { xs: 110, md: 180 },
                  objectFit: "contain",
                  filter: "drop-shadow(0px 4px 8px rgba(0,0,0,0.2))",
                }}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </Box>
          </Grid>

          {/* RIGHT REGISTER AREA */}
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
              {/* SIGN UP title */}
              <Box sx={{ mb: 3 }}>
                <Typography
                  sx={{ fontSize: 36, fontWeight: 800, letterSpacing: 4 }}
                >
                  SIGN UP
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

                <TextField
                  label="Confirm Password"
                  name="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
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
                  {loading ? "Registering..." : "Register"}
                </Button>

                <Box sx={{ textAlign: "center", mt: 0.5 }}>
                  <MUILink
                    href="/login"
                    underline="hover"
                    sx={{ fontSize: 12, color: "#111" }}
                  >
                    already have account?
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
