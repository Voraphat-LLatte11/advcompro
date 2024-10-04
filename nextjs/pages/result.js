
import React, { useEffect, useState } from "react";
import { Typography, Grid, Paper, CircularProgress, Box } from "@mui/material";
import ProductComparisonTable from "../components/ProductComparisonTable";
import { useRouter } from "next/router";

export default function ResultPage() {
  const router = useRouter();
  const { query } = router.query;
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (query) {
      // Simulate fetching data
      setTimeout(() => {
        // This should be replaced by actual API call to fetch products from multiple sources
        setProducts([
          { name: "Product A", price: "$10", website: "Website 1" },
          { name: "Product B", price: "$15", website: "Website 2" },
          { name: "Product C", price: "$12", website: "Website 3" }
        ]);
        setLoading(false);
      }, 2000);
    }
  }, [query]);

  return (
    <Grid container style={{ height: "100vh", justifyContent: "center", alignItems: "center", padding: 16 }}>
      <Grid item xs={12}>
        <Paper elevation={3} style={{ padding: 24 }}>
          <Typography variant="h4" gutterBottom align="center">
            Search Results
          </Typography>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" mt={4}>
              <CircularProgress />
            </Box>
          ) : (
            <Box mt={4}>
              <ProductComparisonTable products={products} />
            </Box>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
}
