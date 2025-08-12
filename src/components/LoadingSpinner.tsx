import React from "react";
import { Box, CircularProgress, Typography } from "@mui/material";

interface LoadingSpinnerProps {
  message?: string;
  size?: number;
  minHeight?: string;
}

export default function LoadingSpinner({
  message = "Carregando...",
  size = 40,
  minHeight = "400px",
}: LoadingSpinnerProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight,
        gap: 2,
      }}
    >
      <CircularProgress size={size} />
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
}

