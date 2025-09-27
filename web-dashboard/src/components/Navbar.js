import React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import { Link as RouterLink, useLocation } from "react-router-dom";
import CloudIcon from "@mui/icons-material/Cloud";
import DashboardIcon from "@mui/icons-material/Dashboard";
import InsightsIcon from "@mui/icons-material/Insights";
import PolicyIcon from "@mui/icons-material/Policy";
import AppSettingsAltIcon from "@mui/icons-material/AppSettingsAlt";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

const navLinks = [
  {
    label: "Dashboard",
    path: "/",
    icon: <DashboardIcon />
  },
  {
    label: "Analytics",
    path: "/analytics",
    icon: <InsightsIcon />
  },
  {
    label: "Policy Center",
    path: "/policy",
    icon: <PolicyIcon />
  },
  {
    label: "Citizen App",
    path: "/citizen",
    icon: <AppSettingsAltIcon />
  }
];

export default function Navbar() {
  const location = useLocation();
  // Theme toggle logic can be added. Here it's dummy.
  const [dark, setDark] = React.useState(true);
  const handleThemeSwitch = () => setDark((v) => !v);

  return (
    <AppBar position="static" elevation={0} sx={{
      background: "rgba(15,24,44,0.95)",
      backdropFilter: "blur(10px)",
      borderBottom: "1px solid #10204088"
    }}>
      <Toolbar>
        {/* Branding */}
        <CloudIcon sx={{ fontSize: 32, mr: 1, color: "#00e676" }} />
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{
            flexGrow: 0,
            color: "#fff",
            fontWeight: 700,
            textDecoration: "none",
            letterSpacing: 2,
            pr: 3
          }}
        >
          NCR AI POLLUTION
        </Typography>

        {/* Navigation Links */}
        <Box sx={{ flexGrow: 1, display: "flex" }}>
          {navLinks.map((link) => (
            <Button
              key={link.path}
              component={RouterLink}
              to={link.path}
              startIcon={link.icon}
              variant={location.pathname === link.path ? "contained" : "text"}
              color={location.pathname === link.path ? "success" : "inherit"}
              sx={{
                mx: 1,
                fontWeight: 600,
                bgcolor: location.pathname === link.path ? "#00e67633" : "transparent",
                borderRadius: 2,
                letterSpacing: 1,
                transition: "all 0.2s",
                "&:hover": {
                  bgcolor: "#00e67622",
                  color: "#00e676"
                }
              }}
            >
              {link.label}
            </Button>
          ))}
        </Box>

        {/* Theme switch */}
        <IconButton color="inherit" onClick={handleThemeSwitch} sx={{ mx: 1 }}>
          {dark ? <DarkModeIcon /> : <WbSunnyIcon />}
        </IconButton>

        {/* User/Profile */}
        <IconButton color="inherit">
          <AccountCircleIcon sx={{ fontSize: 30 }} />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}
