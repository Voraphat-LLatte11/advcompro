import * as React from "react";
import {
  AppBar, Toolbar, Typography, Button, Box, IconButton, Avatar, Menu, MenuItem, Divider, ListItemIcon
} from "@mui/material";
import CarRentalIcon from '@mui/icons-material/CarRental';
import PersonIcon from "@mui/icons-material/Person";
import DashboardIcon from "@mui/icons-material/Dashboard";
import LogoutIcon from "@mui/icons-material/Logout";
import Link from "next/link";
import { useRouter } from "next/router";
import useBearStore from "@/store/useBearStore";

const NavigationLayout = ({ children }) => {
  const router = useRouter();

  // ✅ hooks must be called every render (no early returns before these)
  const { appName, isAuthed, user, logout, _hasHydrated } = useBearStore();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  // render flags
  const showLoggedIn = _hasHydrated && isAuthed;     // only show after hydration
  const showLoggedOut = _hasHydrated && !isAuthed;
  const loadingAuth = !_hasHydrated;

  return (
    <>
      <AppBar position="sticky" sx={{ backgroundColor: "#1f1f1f" }}>
        <Toolbar>
          <Link href="/"><CarRentalIcon sx={{ color: "#fff" }} fontSize="large" /></Link>
          <Typography
            variant="h6" // you can also try "h5" or "h4"
            sx={{
              color: "#fff",
              px: 1.5,
              fontWeight: 800,
              fontSize: "1.8rem", // ← adjust size (1.8rem ≈ 29px)
              letterSpacing: 1.5,
              fontFamily: "Roboto, sans-serif",
            }}
          >
          {appName}
          </Typography>

          <NavLink href="/mainpage" label="Rent the vehicle" />
          <Box sx={{ flexGrow: 1 }} />

          {/* 🔄 While hydrating, show nothing (or a small placeholder) */}
          {loadingAuth && <Box sx={{ width: 160, height: 36 }} />}

          {/* BEFORE LOGIN */}
          {showLoggedOut && (
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="outlined"
                sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.6)" }}
                onClick={() => router.push("/login")}
              >
                Login
              </Button>
              <Button
                variant="contained"
                sx={{ backgroundColor: "#ff9702", color: "#000", "&:hover": { backgroundColor: "#ffa733" } }}
                onClick={() => router.push("/register")}
              >
                Register
              </Button>
            </Box>
          )}

          {/* AFTER LOGIN */}
          {showLoggedIn && (
            <>
              <Button
                variant="outlined"
                sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.6)", mr: 1 }}
                onClick={() => router.push("/mainpage")}
              >
                Dashboard
              </Button>
              <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                <Avatar sx={{ width: 34, height: 34 }}>
                  {(user?.username?.[0] ?? "U").toUpperCase()}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
              >
                <Box sx={{ px: 2, py: 1, minWidth: 200 }}>
                  <Typography variant="subtitle2">Signed in as</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {user?.username ?? "User"}
                  </Typography>
                </Box>
                <Divider />
                <MenuItem onClick={() => { setAnchorEl(null); router.push("/mainpage"); }}>
                  <ListItemIcon><DashboardIcon fontSize="small" /></ListItemIcon>
                  Dashboard
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => { setAnchorEl(null); logout(); router.push("/"); }}>
                  <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
                  Logout
                </MenuItem>
              </Menu>
            </>
          )}
        </Toolbar>
      </AppBar>

      <main>{children}</main>
    </>
  );
};

const NavLink = ({ href, label }) => (
  <Link href={href} style={{ textDecoration: "none" }}>
    <Typography sx={{ color: "#fff", px: 1, fontWeight: 500 }}>{label}</Typography>
  </Link>
);

export default NavigationLayout;
