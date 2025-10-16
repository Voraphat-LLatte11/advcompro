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
  const handleAddCoinsBeta = async () => {
    if (!user?.username) return;
    setCoinBusy(true);
    try {
      const res = await fetch(`${API_BASE}/coins/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user.username,
          amount: 100,
          reason: "topup",
          reference_type: "beta",
          reference_id: "nav-beta-quick-add",
          metadata: { source: "navbar", note: "beta quick topup" },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.detail || "Failed to add coins");
      }

      // Optionally update your store here if you track coin balance
      // useBearStore.getState().setCoins?.(data.coin_balance);

      alert(`Added 100 coins!\nNew balance: ${data.coin_balance}`);
    } catch (err) {
      console.error(err);
      alert(`Could not add coins: ${String(err.message || err)}`);
    } finally {
      setCoinBusy(false);
      setAnchorEl(null);
    }
  };

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
                <Box sx={{ px: 2, py: 1, minWidth: 220 }}>
                  <Typography variant="subtitle2">Signed in as</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {user?.username ?? "User"}
                  </Typography>
                </Box>

                <Divider />

                {/* Profile page */}
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

                {/* Add 100 coins {Beta} */}
                <MenuItem
                  disabled={coinBusy}
                  onClick={handleAddCoinsBeta}
                >
                  <ListItemIcon>
                    <PaidIcon fontSize="small" />
                  </ListItemIcon>
                  {coinBusy ? "Adding coins..." : "Add 100 coins {Beta}"}
                </MenuItem>

                <Divider />

                <MenuItem
                  onClick={() => {
                    setAnchorEl(null);
                    router.push("/mainpage");
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
