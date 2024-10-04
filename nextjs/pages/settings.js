
import React, { useState } from "react";
import { Typography, Grid, Paper, TextField, Button, Snackbar, Alert, Box } from "@mui/material";
import { useRouter } from "next/router";

export default function SettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const handleSnackbarClose = () => {
    setOpenSnackbar(false);
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      // Simulating a settings save action
      setSnackbarMessage("Settings updated successfully!");
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
    } catch (error) {
      setSnackbarMessage("Error updating settings.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      // Simulating a delete action
      setSnackbarMessage("Account deleted successfully!");
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
      // Redirect to the register page after deleting account
      router.push("/register");
    } catch (error) {
      setSnackbarMessage("Error deleting account.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  return (
    <Grid container style={{ height: "100vh", justifyContent: "center", alignItems: "center", padding: 16 }}>
      <Grid item xs={12} sm={8} md={6}>
        <Paper elevation={3} style={{ padding: 24 }}>
          <Typography variant="h4" gutterBottom align="center">
            User Settings
          </Typography>
          <form onSubmit={handleSaveSettings}>
            <TextField
              fullWidth
              label="Username"
              variant="outlined"
              margin="normal"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <TextField
              fullWidth
              label="Email"
              variant="outlined"
              margin="normal"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Box mt={2}>
              <Button variant="contained" color="primary" fullWidth type="submit">
                Save Settings
              </Button>
            </Box>
          </form>
          <Box mt={2}>
            <Button variant="outlined" color="secondary" fullWidth onClick={handleDeleteAccount}>
              Delete Account
            </Button>
          </Box>
          <Box mt={2}>
            <Button variant="contained" color="default" fullWidth onClick={() => router.push("/signin")}>
              Logout
            </Button>
          </Box>
        </Paper>
      </Grid>

      <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Grid>
  );
}
