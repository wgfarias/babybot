"use client";

import React, { useState } from "react";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme as useMuiTheme,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard,
  ChildCare as BabyIcon,
  Group,
  Restaurant,
  Bedtime,
  DirectionsWalk,
  Settings,
  Logout,
  DarkMode,
  LightMode,
  Height,
  ChildFriendly,
} from "@mui/icons-material";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import Link from "next/link";

const drawerWidth = 280;

const menuItems = [
  { text: "Dashboard", icon: <Dashboard />, path: "/dashboard" },
  { text: "Bebês", icon: <BabyIcon />, path: "/dashboard/babies" },
  { text: "Cuidadores", icon: <Group />, path: "/dashboard/caregivers" },
  { text: "Sono", icon: <Bedtime />, path: "/dashboard/sleep" },
  { text: "Alimentação", icon: <Restaurant />, path: "/dashboard/feeding" },
  { text: "Passeios", icon: <DirectionsWalk />, path: "/dashboard/walks" },
  { text: "Fraldas", icon: <ChildFriendly />, path: "/dashboard/diapers" },
  { text: "Crescimento", icon: <Height />, path: "/dashboard/growth" },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("md"));
  const { isDark, toggleTheme } = useTheme();
  const { user, caregiver, family, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose(); // Fechar o menu primeiro
    try {
      await signOut();
      // Forçar redirecionamento e reload
      window.location.href = "/auth";
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      // Em caso de erro, ainda assim redirecionar
      window.location.href = "/auth";
    }
  };

  const drawer = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Simplified Logo Section */}
      <Box
        sx={{
          p: 3,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: "primary.main",
            mb: 0.5,
          }}
        >
          🤖 BabyBot
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {family?.name || "Sua Família"}
        </Typography>
      </Box>

      {/* Simplified Menu Items */}
      <Box
        sx={{
          flexGrow: 1,
          px: 2,
          py: 1,
          overflow: "auto",
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "rgba(156, 163, 175, 0.3)",
            borderRadius: "3px",
            "&:hover": {
              background: "rgba(156, 163, 175, 0.5)",
            },
          },
        }}
      >
        <List sx={{ p: 0 }}>
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  component={Link}
                  href={item.path}
                  selected={isActive}
                  sx={{
                    borderRadius: 1,
                    py: 1.25,
                    px: 2,
                    minHeight: 44,
                    "&.Mui-selected": {
                      backgroundColor: "primary.main",
                      color: "white",
                      "& .MuiListItemIcon-root": {
                        color: "white",
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: "0.875rem",
                      fontWeight: isActive ? 600 : 400,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* Simplified Settings Section */}
      <Box
        sx={{
          px: 2,
          pb: 2,
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <ListItemButton
          sx={{
            borderRadius: 1,
            py: 1.25,
            px: 2,
            minHeight: 44,
            mt: 1,
          }}
          onClick={toggleTheme}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            {isDark ? <LightMode /> : <DarkMode />}
          </ListItemIcon>
          <ListItemText
            primary={isDark ? "Modo Claro" : "Modo Escuro"}
            primaryTypographyProps={{
              fontSize: "0.875rem",
              fontWeight: 400,
            }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Simplified AppBar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Toolbar sx={{ minHeight: 64, px: 3 }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 500 }}>
            {menuItems.find((item) => item.path === pathname)?.text ||
              "Dashboard"}
          </Typography>

          <IconButton onClick={handleMenuClick}>
            <Avatar sx={{ width: 36, height: 36, bgcolor: "primary.main" }}>
              {caregiver?.name?.charAt(0)?.toUpperCase() || "U"}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <Box
              sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: "divider" }}
            >
              <Typography variant="subtitle2" fontWeight="bold">
                {caregiver?.name || "Usuário"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {family?.name || "Família"}
              </Typography>
            </Box>

            <MenuItem onClick={toggleTheme}>
              <ListItemIcon>
                {isDark ? (
                  <LightMode fontSize="small" />
                ) : (
                  <DarkMode fontSize="small" />
                )}
              </ListItemIcon>
              <ListItemText primary={isDark ? "Modo Claro" : "Modo Escuro"} />
            </MenuItem>

            <MenuItem onClick={handleMenuClose}>
              <ListItemIcon>
                <Settings fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Configurações" />
            </MenuItem>

            <Divider />

            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Sair" />
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              borderRight: "1px solid",
              borderColor: "divider",
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          backgroundColor: "background.default",
          minHeight: "100vh",
        }}
      >
        <Toolbar sx={{ minHeight: 64 }} />
        <Box sx={{ p: 4 }}>{children}</Box>
      </Box>
    </Box>
  );
}
