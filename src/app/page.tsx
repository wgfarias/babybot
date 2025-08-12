"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Container, Box, CircularProgress, Typography } from "@mui/material";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push("/dashboard");
      } else {
        router.push("/auth");
      }
    }
  }, [user, loading, router]);

  return (
    <Container
      maxWidth="sm"
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box sx={{ textAlign: "center" }}>
        <CircularProgress size={48} sx={{ mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          🤖 BabyBot
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Carregando...
        </Typography>
      </Box>
    </Container>
  );
}
