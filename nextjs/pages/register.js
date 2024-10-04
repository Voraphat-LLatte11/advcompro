
import React, { useState } from "react";
import { TextField, Button, Grid, Typography, Paper, Snackbar, Alert, Box, CircularProgress } from "@mui/material";
import { useRouter } from "next/router";

export default function RegisterPage() {
  const router = useRouter();
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const handleSnackbarClose = () => {
    setOpenSnackbar(false);
  };

  // Navigate to Sign In page
  const handleNavigateToSignIn = () => {
    router.push("/signin");
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (registerPassword !== registerConfirmPassword) {
      setSnackbarMessage("Passwords do not match");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/users/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: registerName,
          email: registerEmail,
          password_hash: registerPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Registration failed");
      }

      setSnackbarMessage("Registration successful!");
      setSnackbarSeverity("success");
      setOpenSnackbar(true);

      // Redirect to Sign In page after successful registration
      router.push("/signin");
    } catch (error) {
      setSnackbarMessage(error.message);
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Grid container style={{ height: "100vh", justifyContent: "center", alignItems: "center", padding: 16 }}>
      <Grid item xs={12} sm={8} md={6} lg={4}>
        <Paper elevation={3} style={{ padding: 24 }}>
          <Typography variant="h4" gutterBottom align="center" style={{ fontWeight: "bold", marginBottom: 16 }}>
            Create an Account
          </Typography>
          <form onSubmit={handleRegisterSubmit}>
            <TextField
              fullWidth
              label="Name"
              variant="outlined"
              margin="normal"
              value={registerName}
              onChange={(e) => setRegisterName(e.target.value)}
              required
            />
            <TextField
              fullWidth
              label="Email"
              variant="outlined"
              margin="normal"
              type="email"
              value={registerEmail}
              onChange={(e) => setRegisterEmail(e.target.value)}
              required
            />
            <TextField
              fullWidth
              label="Password"
              variant="outlined"
              margin="normal"
              type="password"
              value={registerPassword}
              onChange={(e) => setRegisterPassword(e.target.value)}
              required
              helperText="Password must be at least 8 characters."
            />
            <TextField
              fullWidth
              label="Confirm Password"
              variant="outlined"
              margin="normal"
              type="password"
              value={registerConfirmPassword}
              onChange={(e) => setRegisterConfirmPassword(e.target.value)}
              required
            />
            <Box position="relative" marginTop={2}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                type="submit"
                disabled={loading}
                style={{ padding: 12 }}
              >
                {loading ? "Registering..." : "Register"}
              </Button>
              {loading && (
                <CircularProgress
                  size={24}
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    marginTop: -12,
                    marginLeft: -12,
                  }}
                />
              )}
            </Box>
          </form>
          <Typography variant="body2" align="center" style={{ marginTop: 24 }}>
            Already have an account?{" "}
            <Button color="primary" onClick={handleNavigateToSignIn}>
              Sign In
            </Button>
          </Typography>
        </Paper>
      </Grid>

      {/* Snackbar for notifications */}
      <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Grid>
  );
}
