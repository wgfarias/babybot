"use client";

import React, { useState, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  IconButton,
  Chip,
  Alert,
  Fab,
} from "@mui/material";
import {
  Add,
  ChildCare as BabyIcon,
  Edit,
  Delete,
  Cake,
  Height,
  Scale,
  Refresh,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import type { Baby } from "@/lib/supabase";
import { usePageData } from "@/hooks/usePageData";
import LoadingSpinner from "@/components/LoadingSpinner";

interface BabyFormData {
  name: string;
  birth_date: dayjs.Dayjs | null;
  gender: string;
}

interface BabyWithGrowth extends Baby {
  current_weight?: number;
  current_height?: number;
  age_days?: number;
}

export default function BabiesPage() {
  const { family } = useAuth();
  const [babies, setBabies] = useState<BabyWithGrowth[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBaby, setEditingBaby] = useState<Baby | null>(null);
  const [formData, setFormData] = useState<BabyFormData>({
    name: "",
    birth_date: null,
    gender: "",
  });

  const loadBabies = useCallback(async () => {
    if (!family) return;

    const { data, error } = await supabase
      .from("babies")
      .select("*")
      .eq("family_id", family.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Carregar dados de crescimento para cada bebê
    const babiesWithGrowth = await Promise.all(
      (data || []).map(async (baby) => {
        try {
          const { data: growthData } = await supabase.rpc("get_latest_growth", {
            baby_uuid: baby.id,
          });

          return {
            ...baby,
            current_weight: growthData?.[0]?.weight_grams,
            current_height: growthData?.[0]?.height_cm,
            age_days: growthData?.[0]?.age_days,
          };
        } catch (error) {
          return baby;
        }
      })
    );

    setBabies(babiesWithGrowth);
  }, [family]);

  const { loading, error, retry, isRetrying } = usePageData({
    loadData: loadBabies,
  });

  const handleOpenDialog = (baby?: Baby) => {
    if (baby) {
      setEditingBaby(baby);
      setFormData({
        name: baby.name,
        birth_date: dayjs(baby.birth_date),
        gender: baby.gender || "",
      });
    } else {
      setEditingBaby(null);
      setFormData({
        name: "",
        birth_date: null,
        gender: "",
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingBaby(null);
  };

  const handleSubmit = async () => {
    if (!family || !formData.name || !formData.birth_date) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      const babyData = {
        name: formData.name,
        birth_date: formData.birth_date.format("YYYY-MM-DD"),
        gender: formData.gender || null,
        family_id: family.id,
      };

      if (editingBaby) {
        // Atualizar
        const { error } = await supabase
          .from("babies")
          .update(babyData)
          .eq("id", editingBaby.id);

        if (error) throw error;
      } else {
        // Criar
        const { error } = await supabase.from("babies").insert(babyData);

        if (error) throw error;
      }

      handleCloseDialog();
      retry(); // Usar o retry do hook
    } catch (error) {
      alert("Erro ao salvar bebê");
    }
  };

  const handleDelete = async (baby: Baby) => {
    if (!confirm(`Tem certeza que deseja remover ${baby.name}?`)) return;

    try {
      const { error } = await supabase
        .from("babies")
        .update({ is_active: false })
        .eq("id", baby.id);

      if (error) throw error;

      retry(); // Usar o retry do hook
    } catch (error) {
      alert("Erro ao remover bebê");
    }
  };

  const getAgeText = (birthDate: string) => {
    const birth = dayjs(birthDate);
    const today = dayjs();
    const diffDays = today.diff(birth, "day");

    if (diffDays < 30) {
      return `${diffDays} dias`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} ${months === 1 ? "mês" : "meses"}`;
    } else {
      const years = Math.floor(diffDays / 365);
      const remainingDays = diffDays % 365;
      const months = Math.floor(remainingDays / 30);
      return `${years} ${years === 1 ? "ano" : "anos"}${months > 0 ? ` e ${months} ${months === 1 ? "mês" : "meses"}` : ""}`;
    }
  };

  const getGenderIcon = (gender?: string | null) => {
    switch (gender) {
      case "masculino":
        return "👦";
      case "feminino":
        return "👧";
      default:
        return "👶";
    }
  };

  if (loading && babies.length === 0) {
    return <LoadingSpinner message="Carregando informações dos bebês..." />;
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
      <Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
          }}
        >
          <Typography variant="h4">Bebês</Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            {error && (
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={retry}
                disabled={loading || isRetrying}
              >
                {isRetrying ? "Tentando..." : "Tentar Novamente"}
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
              disabled={loading}
            >
              Adicionar Bebê
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}

        {babies.length === 0 && !loading ? (
          <Card>
            <CardContent sx={{ textAlign: "center", py: 8 }}>
              <BabyIcon sx={{ fontSize: 80, color: "text.secondary", mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Nenhum bebê cadastrado
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Adicione seu primeiro bebê para começar a acompanhar seu
                desenvolvimento
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => handleOpenDialog()}
              >
                Adicionar Primeiro Bebê
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {babies.map((baby) => (
              <Grid item xs={12} sm={6} md={4} key={baby.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: "secondary.main",
                          mr: 2,
                          width: 60,
                          height: 60,
                        }}
                      >
                        <Typography variant="h4">
                          {getGenderIcon(baby.gender)}
                        </Typography>
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" fontWeight="bold">
                          {baby.name}
                        </Typography>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Cake
                            sx={{ fontSize: 16, color: "text.secondary" }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            {getAgeText(baby.birth_date)}
                          </Typography>
                        </Box>
                        {baby.gender && (
                          <Chip
                            label={baby.gender}
                            size="small"
                            variant="outlined"
                            sx={{ mt: 1 }}
                          />
                        )}
                      </Box>
                    </Box>

                    {/* Dados de crescimento */}
                    {(baby.current_weight || baby.current_height) && (
                      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                        {baby.current_weight && (
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Scale
                              sx={{
                                fontSize: 16,
                                mr: 0.5,
                                color: "text.secondary",
                              }}
                            />
                            <Typography variant="body2">
                              {(baby.current_weight / 1000).toFixed(1)}kg
                            </Typography>
                          </Box>
                        )}
                        {baby.current_height && (
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Height
                              sx={{
                                fontSize: 16,
                                mr: 0.5,
                                color: "text.secondary",
                              }}
                            />
                            <Typography variant="body2">
                              {baby.current_height}cm
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    )}

                    <Box
                      sx={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <Button
                        size="small"
                        startIcon={<Edit />}
                        onClick={() => handleOpenDialog(baby)}
                      >
                        Editar
                      </Button>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(baby)}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* FAB para mobile */}
        <Fab
          color="primary"
          sx={{
            position: "fixed",
            bottom: 16,
            right: 16,
            display: { xs: "flex", sm: "none" },
          }}
          onClick={() => handleOpenDialog()}
        >
          <Add />
        </Fab>

        {/* Dialog de adição/edição */}
        <Dialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {editingBaby ? "Editar Bebê" : "Adicionar Bebê"}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              <TextField
                fullWidth
                label="Nome do Bebê"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                margin="normal"
                required
              />

              <DatePicker
                label="Data de Nascimento"
                value={formData.birth_date}
                onChange={(date) =>
                  setFormData({ ...formData, birth_date: date })
                }
                slotProps={{
                  textField: {
                    fullWidth: true,
                    margin: "normal",
                    required: true,
                  },
                }}
                maxDate={dayjs()}
              />

              <FormControl fullWidth margin="normal">
                <InputLabel>Gênero</InputLabel>
                <Select
                  value={formData.gender}
                  onChange={(e) =>
                    setFormData({ ...formData, gender: e.target.value })
                  }
                  label="Gênero"
                >
                  <MenuItem value="">Não informar</MenuItem>
                  <MenuItem value="masculino">Masculino</MenuItem>
                  <MenuItem value="feminino">Feminino</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button onClick={handleSubmit} variant="contained">
              {editingBaby ? "Salvar" : "Adicionar"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
}
