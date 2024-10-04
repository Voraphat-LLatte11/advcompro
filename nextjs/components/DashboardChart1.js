
import React from "react";
import { Line } from "react-chartjs-2";
import { Box, Typography } from "@mui/material";

export default function DashboardChart() {
  const data = {
    labels: ["January", "February", "March", "April", "May", "June"],
    datasets: [
      {
        label: "Product Searches",
        data: [12, 19, 3, 5, 2, 3],
        fill: false,
        borderColor: "rgba(75,192,192,1)",
        tension: 0.1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <Box height={400}>
      <Typography variant="h6" gutterBottom align="center">
        Search Statistics
      </Typography>
      <Line data={data} options={options} />
    </Box>
  );
}
