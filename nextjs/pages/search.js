
import React, { useState } from "react";
import { Typography, Grid, Paper, TextField, Button, Box } from "@mui/material";
import { useRouter } from "next/router";

export default function SearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = () => {
    // Redirect to result page with query parameter
    router.push(`/result?query=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <Grid container style={{ height: "100vh", justifyContent: "center", alignItems: "center", padding: 16 }}>
      <Grid item xs={12} sm={8} md={6}>
        <Paper elevation={3} style={{ padding: 24 }}>
          <Typography variant="h4" gutterBottom align="center">
            Product Search
          </Typography>
          <Box mt={2}>
            <TextField
              fullWidth
              label="Search for products"
              variant="outlined"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button
              variant="contained"
              color="primary"
              fullWidth
              style={{ marginTop: 16 }}
              onClick={handleSearch}
            >
              Search
            </Button>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
}
