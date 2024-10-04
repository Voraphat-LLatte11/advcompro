import * as React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Menu,
  MenuItem,
  Box,
  ListItemIcon,
} from "@mui/material";
import SvgIcon from '@mui/material/SvgIcon'
import { useRouter } from "next/router";
import Link from "next/link";
import Divider from "@mui/material/Divider";
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import useBearStore from "@/store/useBearStore";

const NavigationLayout = ({ children }) => {
  const router = useRouter();
  const appName = useBearStore((state) => state.appName);

  return (
    <>
      <AppBar position="sticky" sx={{ backgroundColor: "#d6e7f9" }}>
        <Toolbar>

          <Link href={"/"}>
            <img src={'https://i.postimg.cc/x13gF3Dk/prodogo2.png'} alt="Logo" width="30" height="30"/>
          </Link>
          
          <Typography
            variant="body1"
            sx={{
              fontSize: "22px",
              fontWeight: 500,
              color: "#053871",
              padding: "0 10px",
              fontFamily: "Prompt",
            }}>
            {appName}
          </Typography> 

          <NavigationLink href="/dashboard" label="Dashboard" />
          <div style={{ flexGrow: 1 }} />

          <Button
            color="#053871"
            onClick={() => {
              router.push("/register");
            }}>
            <PersonOutlineIcon sx={{ color: "#053871" }} />
          </Button>
        </Toolbar>
      </AppBar>
      <main>{children}</main>
    </>
  );
};

const NavigationLink = ({ href, label }) => {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <Typography
        variant="body1"
        sx={{
          fontSize: "14px",
          fontWeight: 500,
          // textTransform: "uppercase",
          color: "#053871",
          padding: "0 10px", // Add padding on left and right
        }}>
        {label}
      </Typography>{" "}
    </Link>
  );
};

export default NavigationLayout;
