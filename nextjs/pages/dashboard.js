import React from "react";
import { Typography, Grid, Paper, Box } from "@mui/material";
import DashboardChart from "../components/DashboardChart";

export default function DashboardPage() {
  return (
    <Grid container style={{ height: "100vh", justifyContent: "center", alignItems: "center", padding: 16 }}>
      <Grid item xs={12} sm={10} md={8}>
        <Paper elevation={3} style={{ padding: 24 }}>
          <Typography variant="h4" gutterBottom align="center">
            Dashboard
          </Typography>
          <Box mt={4}>
            <DashboardChart />
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
}
