import React, { useState } from "react";
import { TextField, Button, Grid, Typography, Paper, Snackbar, Alert } from '@mui/material';
import { useRouter } from "next/router";

export default function SignIn() {
  const router = useRouter();
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const handleSnackbarClose = () => {
    setOpenSnackbar(false);
  };

  const handleNavigateToSignUp = () => {
    router.push("/register");  // Navigates to the sign-up page
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: loginEmail,
          password_hash: loginPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed');
      }

      const data = await response.json();
      setSnackbarMessage('Login successful!');
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
      // Handle successful login (e.g., redirect)
    } catch (error) {
      setSnackbarMessage(error.message);
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  };

  return (
    <Grid container spacing={2} style={{ height: '100vh', justifyContent: 'center', alignItems: 'center' }}>
      <Grid item xs={12} sm={6}>
        <Paper elevation={3} style={{ padding: '20px' }}>
          <Typography variant="h5" gutterBottom>
            Sign In
          </Typography>
          <form onSubmit={handleLoginSubmit}>
            <TextField
              fullWidth
              label="Email"
              variant="outlined"
              margin="normal"
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
            />
            <TextField
              fullWidth
              label="Password"
              variant="outlined"
              margin="normal"
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
            />

            <Button color="primary" onClick={() => router.push('/forgotpassword')}>
              Forgot Password?
            </Button>

            <Button variant="contained" color="primary" fullWidth style={{ marginTop: '16px' }} type="submit">
              Sign In
            </Button>
          </form>

          <div style={{ textAlign: "center", marginTop: "16px" }}>
            Don't have an account?{" "}
            <Button color="primary" onClick={handleNavigateToSignUp}>
              Sign Up
            </Button>
          </div>

        </Paper>
      </Grid>

      <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

    </Grid>
  );
}
