"use client";

import React, { useState } from "react";
import {
  Container,
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  Tab,
  Tabs,
  Alert,
  IconButton,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Phone,
  Person,
  Groups,
  DarkMode,
  LightMode,
} from "@mui/icons-material";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
// Função para aplicar máscara de telefone
const formatPhoneNumber = (value: string) => {
  // Remove tudo que não é número
  const phoneNumber = value.replace(/\D/g, "");
  
  // Aplica a máscara (11) 99999-9999
  if (phoneNumber.length >= 11) {
    return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 7)}-${phoneNumber.slice(7, 11)}`;
  } else if (phoneNumber.length >= 7) {
    return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 7)}-${phoneNumber.slice(7)}`;
  } else if (phoneNumber.length >= 2) {
    return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2)}`;
  } else if (phoneNumber.length >= 1) {
    return `(${phoneNumber}`;
  }
  
  return phoneNumber;
};

// Função para limpar a formatação do telefone
const cleanPhoneNumber = (value: string) => {
  return value.replace(/\D/g, "");
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`auth-tabpanel-${index}`}
      aria-labelledby={`auth-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function AuthPage() {
  const [tab, setTab] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Login form
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup form
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupFamilyName, setSignupFamilyName] = useState("");

  const { isDark, toggleTheme } = useTheme();
  const { signInWithPhone, signUpWithPhone } = useAuth();
  const router = useRouter();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
    setError("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Limpar formatação do telefone antes de enviar
    const cleanPhone = cleanPhoneNumber(loginPhone);
    const { error } = await signInWithPhone(cleanPhone, loginPassword);

    if (error) {
      setError(error.message || "Erro ao fazer login");
    } else {
      router.push("/dashboard");
    }

    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (signupPassword !== signupConfirmPassword) {
      setError("As senhas não coincidem");
      setLoading(false);
      return;
    }

    if (signupPassword.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      setLoading(false);
      return;
    }

    // Limpar formatação do telefone antes de enviar
    const cleanPhone = cleanPhoneNumber(signupPhone);
    const { error } = await signUpWithPhone(
      cleanPhone,
      signupPassword,
      signupName,
      signupFamilyName
    );

    if (error) {
      setError(error.message || "Erro ao criar conta");
    } else {
      router.push("/dashboard");
    }

    setLoading(false);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: isDark 
          ? "linear-gradient(135deg, #0F0F23 0%, #1E1E2E 50%, #252548 100%)"
          : "linear-gradient(135deg, #F8FAFC 0%, #E5E7EB 50%, #D1D5DB 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
        position: "relative",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "radial-gradient(ellipse at center, rgba(59, 130, 246, 0.1) 0%, transparent 70%)",
          pointerEvents: "none"
        }
      }}
    >
      <Container maxWidth="sm" sx={{ position: "relative", zIndex: 1 }}>
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            p: 5,
            borderRadius: 4,
            background: isDark
              ? "linear-gradient(135deg, #1E1E2E 0%, #252548 100%)"
              : "linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)",
            backdropFilter: "blur(20px)",
            border: "1px solid",
            borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
            boxShadow: isDark 
              ? "0 20px 60px rgba(0, 0, 0, 0.5)"
              : "0 20px 60px rgba(0, 0, 0, 0.1)",
            transition: "all 0.3s ease-in-out",
            "&:hover": {
              transform: "translateY(-4px)",
              boxShadow: isDark 
                ? "0 25px 80px rgba(0, 0, 0, 0.6)"
                : "0 25px 80px rgba(0, 0, 0, 0.15)",
            }
          }}
        >
        {/* Enhanced Header */}
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Box sx={{ mb: 3, position: "relative" }}>
            <Typography
              variant="h3"
              component="h1"
              sx={{
                fontWeight: 800,
                background: "linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                mb: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 2
              }}
            >
              <Box sx={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.8rem",
                boxShadow: "0 8px 24px rgba(59, 130, 246, 0.3)"
              }}>
                🤖
              </Box>
              BabyBot
            </Typography>
            
            <IconButton
              onClick={toggleTheme}
              sx={{
                position: "absolute",
                top: 0,
                right: 0,
                width: 44,
                height: 44,
                background: "rgba(59, 130, 246, 0.1)",
                border: "1px solid rgba(59, 130, 246, 0.2)",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  background: "rgba(59, 130, 246, 0.2)",
                  transform: "rotate(180deg)"
                }
              }}
            >
              {isDark ? <LightMode /> : <DarkMode />}
            </IconButton>
          </Box>

          <Typography variant="h6" color="text.secondary" sx={{ mb: 1, fontWeight: 400 }}>
            Acompanhe o desenvolvimento do seu bebê
          </Typography>
          <Typography variant="body2" color="text.secondary">
            com inteligência e carinho
          </Typography>
        </Box>

        {/* Enhanced Tabs */}
        <Box sx={{ 
          borderBottom: 1, 
          borderColor: "divider",
          mb: 2,
          "& .MuiTabs-indicator": {
            background: "linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)",
            height: 3,
            borderRadius: 2
          }
        }}>
          <Tabs 
            value={tab} 
            onChange={handleTabChange} 
            centered
            sx={{
              "& .MuiTab-root": {
                fontWeight: 600,
                fontSize: "1rem",
                textTransform: "none",
                transition: "all 0.2s ease-in-out",
                "&.Mui-selected": {
                  background: "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)",
                  color: "primary.main"
                }
              }
            }}
          >
            <Tab label="Entrar" />
            <Tab label="Cadastrar" />
          </Tabs>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Login Panel */}
        <TabPanel value={tab} index={0}>
          <Box component="form" onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="Telefone"
              placeholder="(11) 99999-9999"
              value={loginPhone}
              onChange={(e) => {
                const formatted = formatPhoneNumber(e.target.value);
                setLoginPhone(formatted);
              }}
              required
              margin="normal"
              inputProps={{
                maxLength: 15, // (11) 99999-9999
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Phone />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Senha"
              type={showPassword ? "text" : "password"}
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              required
              margin="normal"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3, mb: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : "Entrar"}
            </Button>
          </Box>
        </TabPanel>

        {/* Signup Panel */}
        <TabPanel value={tab} index={1}>
          <Box component="form" onSubmit={handleSignup}>
            <TextField
              fullWidth
              label="Seu Nome"
              value={signupName}
              onChange={(e) => setSignupName(e.target.value)}
              required
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Nome da Família"
              value={signupFamilyName}
              onChange={(e) => setSignupFamilyName(e.target.value)}
              required
              margin="normal"
              placeholder="Ex: Família Silva"
              InputProps={{
                                  startAdornment: (
                    <InputAdornment position="start">
                      <Groups />
                    </InputAdornment>
                  ),
              }}
            />

            <TextField
              fullWidth
              label="Telefone"
              placeholder="(11) 99999-9999"
              value={signupPhone}
              onChange={(e) => {
                const formatted = formatPhoneNumber(e.target.value);
                setSignupPhone(formatted);
              }}
              required
              margin="normal"
              inputProps={{
                maxLength: 15, // (11) 99999-9999
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Phone />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Senha"
              type={showPassword ? "text" : "password"}
              value={signupPassword}
              onChange={(e) => setSignupPassword(e.target.value)}
              required
              margin="normal"
              helperText="Mínimo 6 caracteres"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Confirmar Senha"
              type={showPassword ? "text" : "password"}
              value={signupConfirmPassword}
              onChange={(e) => setSignupConfirmPassword(e.target.value)}
              required
              margin="normal"
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3, mb: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : "Criar Conta"}
            </Button>
          </Box>
        </TabPanel>

        {/* Footer */}
        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
          sx={{ mt: 4 }}
        >
          Um assistente inteligente para cuidar do que é mais importante
        </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
