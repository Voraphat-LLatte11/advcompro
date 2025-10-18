import * as React from "react";
import {
  AppBar, Toolbar, Typography, Button, Box, IconButton, Avatar,
  Menu, MenuItem, Divider, ListItemIcon
} from "@mui/material";
import DirectionsCarOutlinedIcon from "@mui/icons-material/DirectionsCarOutlined";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import DashboardIcon from "@mui/icons-material/Dashboard";
import LogoutIcon from "@mui/icons-material/Logout";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import PaidIcon from "@mui/icons-material/Paid";
import Link from "next/link";
import { useRouter } from "next/router";
import useBearStore from "@/store/useBearStore";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

const NavigationLayout = ({ children }) => {
  const router = useRouter();
  const { appName, isAuthed, user, logout, _hasHydrated } = useBearStore();

  const [anchorEl, setAnchorEl] = React.useState(null);
  const [coinBusy, setCoinBusy] = React.useState(false);
  const open = Boolean(anchorEl);

  const showLoggedIn = _hasHydrated && isAuthed;
  const showLoggedOut = _hasHydrated && !isAuthed;
  const loadingAuth = !_hasHydrated;

  // ---- Add 100 coins (Beta) ----

  return (
    <>
      <AppBar position="sticky" sx={{ backgroundColor: "#1f1f1f" }}>
        <Toolbar>
          {/* Logo */}
          {showLoggedIn ? (
            <IconButton edge="start" disabled sx={{ mr: 1, cursor: "default" }}>
              <DirectionsCarIcon sx={{ color: "#fff" }} fontSize="large" />
            </IconButton>
          ) : (
            <Link href="/" aria-label="Go to home">
              <IconButton edge="start" sx={{ mr: 1 }}>
                <DirectionsCarOutlinedIcon sx={{ color: "#fff" }} fontSize="large" />
              </IconButton>
            </Link>
          )}

          {/* Title */}
          <Typography
            variant="h6"
            sx={{
              color: "#fff",
              px: 1.5,
              fontWeight: 800,
              fontSize: "1.8rem",
              letterSpacing: 1.5,
              fontFamily: "Roboto, sans-serif",
              display: "flex",
              alignItems: "baseline",
              gap: 1,
            }}
          >
            {appName ?? "BIDKOMKOM"}
          </Typography>

          {showLoggedIn && <NavLink href="/mainpage" label="Rent the vehicle" />}

          <Box sx={{ flexGrow: 1 }} />

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
                sx={{
                  backgroundColor: "#ff9702",
                  color: "#000",
                  "&:hover": { backgroundColor: "#ffa733" },
                }}
                onClick={() => router.push("/register")}
              >
                Register
              </Button>
            </Box>
          )}

          {/* AFTER LOGIN */}
          {showLoggedIn && (
            <>
              <Box
                onClick={(e) => setAnchorEl(e.currentTarget)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 1,
                  py: 0.5,
                  borderRadius: 2,
                  cursor: "pointer",
                  "&:hover": { backgroundColor: "rgba(255,255,255,0.08)" },
                }}
                aria-controls={open ? "user-menu" : undefined}
                aria-haspopup="true"
                aria-expanded={open ? "true" : undefined}
              >
                <Avatar sx={{ width: 34, height: 34 }}>
                  {(user?.username?.[0] ?? "U").toUpperCase()}
                </Avatar>
                <Typography
                  variant="body2"
                  sx={{ color: "#fff", fontWeight: 600, maxWidth: 160 }}
                  noWrap
                >
                  {user?.username ?? "User"}
                </Typography>
              </Box>

              <Menu
                id="user-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
              >
                <Box sx={{ px: 2, py: 1, minWidth: 220 }}>
                  <Typography variant="subtitle2">Signed in as</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {user?.username ?? "User"}
                  </Typography>
                </Box>

                <Divider />

                <MenuItem
                  onClick={() => {
                    setAnchorEl(null);
                    router.push("/profile");
                  }}
                >
                  <ListItemIcon>
                    <AccountCircleIcon fontSize="small" />
                  </ListItemIcon>
                  Profile
                </MenuItem>

                <MenuItem
                  onClick={() => {
                    setAnchorEl(null);
                    router.push("/dashboard");
                  }}
                >
                  <ListItemIcon>
                    <DashboardIcon fontSize="small" />
                  </ListItemIcon>
                  Dashboard
                </MenuItem>

                <Divider />

                <MenuItem
                  onClick={() => {
                    setAnchorEl(null);
                    logout();
                    router.push("/");
                  }}
                >
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
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
