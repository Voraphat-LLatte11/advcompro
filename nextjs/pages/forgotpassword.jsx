// pages/forgotpassword.jsx
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
import NextLink from "next/link";

export default function ForgotPassword() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // client-side checks
    if (!form.username || !form.newPassword || !form.confirmPassword) {
      Swal.fire({ icon: "error", title: "Missing fields", text: "Please fill in all fields." });
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      Swal.fire({ icon: "error", title: "Passwords don't match", text: "Please re-enter the same password." });
      return;
    }
    if (form.newPassword.length < 6) {
      Swal.fire({ icon: "warning", title: "Password too short", text: "Use at least 6 characters." });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("http://localhost:8000/forgotpassword/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: form.username, newPassword: form.newPassword }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.detail || "Password reset failed");

      await Swal.fire({
        icon: "success",
        title: "Password changed",
        text: "Your password has been updated. Please log in.",
        timer: 2000,
        showConfirmButton: false,
      });
      router.push("/login");
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.message });
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
          {/* LEFT ORANGE PANEL (same as login) */}
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
                  sx={{ fontSize: { xs: 22, md: 28 }, fontWeight: 700, color: "#111" }}
                >
                  Welcome To
                </Typography>
                <Typography
                  sx={{ fontSize: { xs: 28, md: 34 }, fontWeight: 800, color: "#111", lineHeight: 1.1 }}
                >
                  BidKomKom
                </Typography>
              </Box>

              <Box
                component="img"
                src="/car.png"
                alt="car"
                sx={{
                  width: "100%",
                  height: { xs: 110, md: 180 },
                  objectFit: "contain",
                  filter: "drop-shadow(0px 4px 8px rgba(0,0,0,0.2))",
                }}
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            </Box>
          </Grid>

          {/* RIGHT RESET AREA */}
          <Grid item xs={12} md={7} sx={{ display: "flex", alignItems: "center" }}>
            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{ width: "100%", px: { xs: 2.5, md: 6 }, py: { xs: 3, md: 6 } }}
            >
              <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontSize: 36, fontWeight: 800, letterSpacing: 4 }}>
                  RESET PASSWORD
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
                  InputProps={{ sx: { bgcolor: "#e6e6e6", borderRadius: 1 } }}
                />
                <TextField
                  label="New Password"
                  name="newPassword"
                  type="password"
                  value={form.newPassword}
                  onChange={handleChange}
                  required
                  fullWidth
                  variant="outlined"
                  InputProps={{ sx: { bgcolor: "#e6e6e6", borderRadius: 1 } }}
                />
                <TextField
                  label="Confirm New Password"
                  name="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                  fullWidth
                  variant="outlined"
                  error={
                    Boolean(form.confirmPassword) &&
                    form.newPassword !== form.confirmPassword
                  }
                  helperText={
                    Boolean(form.confirmPassword) &&
                    form.newPassword !== form.confirmPassword
                      ? "Passwords do not match"
                      : " "
                  }
                  InputProps={{ sx: { bgcolor: "#e6e6e6", borderRadius: 1 } }}
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
                  {loading ? "Updating..." : "Change Password"}
                </Button>

                <Box sx={{ textAlign: "center", mt: 0.5 }}>
                  <MUILink
                    component={NextLink}
                    href="/login"
                    underline="hover"
                    sx={{ fontSize: 12, color: "#111" }}
                  >
                    Back to Login
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
