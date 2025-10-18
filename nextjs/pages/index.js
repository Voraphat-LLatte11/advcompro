// pages/index.js
import {
  Box,
  Button,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  CardMedia,
} from "@mui/material";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();

  return (
    <Box sx={{ bgcolor: "#ff9702", minHeight: "100vh" }}>
      {/* HERO */}
      <Box
        sx={{
          position: "relative",
          height: { xs: "70vh", md: "80vh" },
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.25)),
            url("/background.jpg")
    `     ,
          backgroundSize: "cover",
          backgroundPosition: "center",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 2,
          textAlign: "center",
        }}
      >
        {/* ✅ Text Box above background */}
        <Box
          sx={{
            position: "relative",
            zIndex: 2, // ensures it’s above background
            backgroundColor: "rgba(255,255,255,0.8)", // light translucent layer
            backdropFilter: "blur(6px)", // adds smooth glass effect
            borderRadius: 3,
            py: { xs: 3, md: 5 },
            px: { xs: 3, md: 7 },
            boxShadow: "0 8px 25px rgba(0,0,0,0.3)",
            maxWidth: 600,
          }}
        >
          <Typography
            sx={{
              fontWeight: 900,
              letterSpacing: 3,
              fontSize: { xs: "2.4rem", md: "3.8rem" },
              color: "#000",
              lineHeight: 1.1,
            }}
          >
            WELCOME
          </Typography>
          <Typography
            sx={{
              fontWeight: 900,
              letterSpacing: 3,
              fontSize: { xs: "2.4rem", md: "3.8rem" },
              color: "#000",
              lineHeight: 1.1,
            }}
          >
            TO
          </Typography>
          <Typography
            sx={{
              fontWeight: 900,
              letterSpacing: 3,
              fontSize: { xs: "2.8rem", md: "4.2rem" },
              color: "#000",
              lineHeight: 1.1,
            }}
          >
            BIDKOMKOM
          </Typography>

          <Typography sx={{ mt: 1, fontSize: { xs: 16, md: 18 }, color: "#333" }}>
            Vehicle Rental for Everyone
          </Typography>

          <Button
            variant="contained"
            size="large"
            sx={{
            mt: 4,
              backgroundColor: "#ff9702",
              color: "#000",
              fontWeight: 700,
              borderRadius: "8px",
              px: 5,
              py: 1.2,
              "&:hover": {
                backgroundColor: "#ffa733",
                boxShadow: "0 4px 12px rgba(255,151,2,0.5)",
              },
            }}
            onClick={() => router.push("/register")}
          >
            GET STARTED
          </Button>
        </Box>
      </Box>


      {/* OVERVIEW */}
      <Container sx={{ py: 6 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>
          Overview
        </Typography>

        <Grid container spacing={4} justifyContent="center">
          {[
            { img: "/vehicle1.png", text: "Easy, 100% Guaranteed" },
            { img: "/vehicle2.jpg", text: "Easy, 100% Guaranteed" },
            { img: "/vehicle3.jpg", text: "Easy, 100% Guaranteed" },
          ].map((item, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card
                sx={{
                  borderRadius: 4,
                  overflow: "hidden",
                  textAlign: "center",
                  boxShadow: "0px 4px 10px rgba(0,0,0,0.15)",
                  transition: "transform 0.3s",
                  "&:hover": { transform: "scale(1.05)" },
                }}
              >
                <CardMedia
                  component="img"
                  image={item.img}
                  alt={`bike-${i}`}
                  sx={{ height: 220, objectFit: "contain", bgcolor: "#fff" }}
                />
                <CardContent sx={{ py: 2 }}>
                  <Typography sx={{ fontWeight: 500, color: "#333" }}>
                    {item.text}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
