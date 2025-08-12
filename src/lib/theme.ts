import { createTheme, ThemeOptions } from "@mui/material/styles";

// Cores personalizadas para o BabyBot - Inspirado no design de referência
const colors = {
  primary: {
    main: "#3B82F6", // Azul profissional
    light: "#60A5FA",
    dark: "#1E40AF",
    contrastText: "#ffffff",
  },
  secondary: {
    main: "#8B5CF6", // Roxo moderno
    light: "#A78BFA",
    dark: "#6D28D9",
    contrastText: "#ffffff",
  },
  success: {
    main: "#10B981", // Verde esmeralda
    light: "#34D399",
    dark: "#047857",
  },
  warning: {
    main: "#F59E0B", // Laranja/âmbar
    light: "#FBBF24",
    dark: "#D97706",
  },
  error: {
    main: "#EF4444", // Vermelho
    light: "#F87171",
    dark: "#DC2626",
  },
  info: {
    main: "#06B6D4", // Ciano
    light: "#22D3EE",
    dark: "#0891B2",
  },
};

// Configurações base do tema
const baseTheme: ThemeOptions = {
  typography: {
    fontFamily: [
      "Inter",
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "Roboto",
      '"Helvetica Neue"',
      "Arial",
      "sans-serif",
    ].join(","),
    h1: {
      fontSize: "2.5rem",
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: "2rem",
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: "1.5rem",
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: "1.25rem",
      fontWeight: 500,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: "1.125rem",
      fontWeight: 500,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: "1rem",
      fontWeight: 500,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: "1rem",
      lineHeight: 1.6,
    },
    body2: {
      fontSize: "0.875rem",
      lineHeight: 1.5,
    },
  },
  shape: {
    borderRadius: 6,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
          borderRadius: 8,
          padding: "8px 24px",
        },
        contained: {
          boxShadow: "none",
          "&:hover": {
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: "none",
          border: "1px solid",
          borderColor: "rgba(0, 0, 0, 0.06)",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 8,
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: "none",
          borderBottom: "1px solid",
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          paddingLeft: 32,
          paddingRight: 32,
          paddingTop: 24,
          paddingBottom: 24,
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          paddingLeft: 32,
          paddingRight: 32,
          paddingBottom: 24,
          paddingTop: 16,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          paddingLeft: 32,
          paddingRight: 32,
          paddingTop: 24,
          paddingBottom: 16,
        },
      },
    },
  },
};

// Tema Dark (padrão) - Inspirado no sistema de referência
export const darkTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: "dark",
    ...colors,
    background: {
      default: "#0F0F23", // Fundo principal escuro
      paper: "#1E1E2E", // Cards e superfícies
    },
    text: {
      primary: "#F8FAFC",
      secondary: "#CBD5E1",
    },
    divider: "rgba(255, 255, 255, 0.06)",
  },
  components: {
    ...baseTheme.components,
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: "linear-gradient(135deg, #1E1E2E 0%, #252548 100%)",
          borderBottomColor: "rgba(255, 255, 255, 0.06)",
          backdropFilter: "blur(8px)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: "none",
          border: "1px solid",
          backgroundColor: "#1E1E2E",
          borderColor: "rgba(255, 255, 255, 0.08)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "#1E1E2E",
          backgroundImage: "none",
        },
      },
    },
  },
});

// Tema Light
export const lightTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: "light",
    ...colors,
    background: {
      default: "#F8FAFC",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#1E293B",
      secondary: "#64748B",
    },
    divider: "rgba(0, 0, 0, 0.06)",
  },
  components: {
    ...baseTheme.components,
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: "linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)",
          borderBottomColor: "rgba(0, 0, 0, 0.06)",
          color: "#1E293B",
          backdropFilter: "blur(8px)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: "none",
          border: "1px solid",
          backgroundColor: "#FFFFFF",
          borderColor: "rgba(0, 0, 0, 0.06)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "#FFFFFF",
        },
      },
    },
  },
});

// Hook para alternar tema
export const getTheme = (isDark: boolean) => (isDark ? darkTheme : lightTheme);
