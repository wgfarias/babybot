"use client";

import React, { useState, useEffect } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Snackbar,
  InputAdornment,
} from "@mui/material";
import {
  Add,
  Restaurant,
  Edit,
  Delete,
  PlayArrow,
  Stop,
  AccessTime,
  LocalDining,
  Warning,
  CheckCircle,
  Error as ErrorIcon,
  Info,
} from "@mui/icons-material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import type { Baby } from "@/lib/supabase";

dayjs.extend(duration);
dayjs.extend(relativeTime);
dayjs.locale("pt-br");

interface FeedingRecord {
  id: string;
  baby_id: string;
  caregiver_id: string;
  feeding_type: string;
  breastfeeding_start: string | null;
  breastfeeding_end: string | null;
  breast_side: string | null;
  amount_ml: number | null;
  food_description: string | null;
  notes: string | null;
  feeding_time: string;
  created_at: string;
  updated_at: string;
}

interface FeedingRecordWithRelations extends FeedingRecord {
  baby_name: string;
  caregiver_name: string;
  duration_minutes?: number;
  is_feeding: boolean;
}

interface FeedingFormData {
  baby_id: string;
  feeding_type: string;
  feeding_time: dayjs.Dayjs | null;
  breastfeeding_start: dayjs.Dayjs | null;
  breastfeeding_end: dayjs.Dayjs | null;
  breast_side: string;
  amount_ml: string;
  food_description: string;
  notes: string;
}

const feedingTypes = [
  { value: "amamentacao", label: "Amamentação", icon: "🤱" },
  { value: "mamadeira", label: "Mamadeira", icon: "🍼" },
  { value: "papinha", label: "Papinha", icon: "🥄" },
  { value: "fruta", label: "Fruta", icon: "🍎" },
  { value: "agua", label: "Água", icon: "💧" },
  { value: "suco", label: "Suco", icon: "🧃" },
  { value: "outros", label: "Outros", icon: "🍽️" },
];

const breastSideOptions = [
  { value: "esquerdo", label: "Seio Esquerdo" },
  { value: "direito", label: "Seio Direito" },
  { value: "ambos", label: "Ambos os Seios" },
];

export default function FeedingPage() {
  const { family, caregiver } = useAuth();
  const [feedingRecords, setFeedingRecords] = useState<
    FeedingRecordWithRelations[]
  >([]);
  const [babies, setBabies] = useState<Baby[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] =
    useState<FeedingRecordWithRelations | null>(null);
  const [formData, setFormData] = useState<FeedingFormData>({
    baby_id: "",
    feeding_type: "",
    feeding_time: null,
    breastfeeding_start: null,
    breastfeeding_end: null,
    breast_side: "",
    amount_ml: "",
    food_description: "",
    notes: "",
  });

  // Estados para modal de confirmação e snackbar
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "warning" | "info",
  });

  // Estados para modal de finalizar amamentação
  const [finishBreastfeedingOpen, setFinishBreastfeedingOpen] = useState(false);
  const [recordToFinish, setRecordToFinish] = useState<string | null>(null);
  const [selectedBreastSide, setSelectedBreastSide] = useState("esquerdo");

  useEffect(() => {
    if (family) {
      loadBabies();
      loadFeedingRecords();
    }
  }, [family]);

  // Funções para snackbar
  const showSnackbar = (
    message: string,
    severity: "success" | "error" | "warning" | "info" = "success"
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Funções para modal de confirmação
  const handleDeleteClick = (recordId: string) => {
    setRecordToDelete(recordId);
    setConfirmDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (recordToDelete) {
      handleDelete(recordToDelete);
    }
    setConfirmDialogOpen(false);
    setRecordToDelete(null);
  };

  const handleCancelDelete = () => {
    setConfirmDialogOpen(false);
    setRecordToDelete(null);
  };

  // Funções para modal de finalizar amamentação
  const handleFinishBreastfeedingClick = (
    recordId: string,
    currentBreastSide: string | null
  ) => {
    setRecordToFinish(recordId);
    setSelectedBreastSide(currentBreastSide || "esquerdo");
    setFinishBreastfeedingOpen(true);
  };

  const handleConfirmFinishBreastfeeding = () => {
    if (recordToFinish) {
      handleEndBreastfeeding(recordToFinish, selectedBreastSide);
    }
    setFinishBreastfeedingOpen(false);
    setRecordToFinish(null);
  };

  const handleCancelFinishBreastfeeding = () => {
    setFinishBreastfeedingOpen(false);
    setRecordToFinish(null);
  };

  const loadBabies = async () => {
    if (!family) return;

    try {
      const { data, error } = await supabase
        .from("babies")
        .select("*")
        .eq("family_id", family.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBabies(data || []);
    } catch (error: any) {
      setError("Erro ao carregar bebês");
    }
  };

  const loadFeedingRecords = async () => {
    if (!family) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("feeding_records")
        .select(
          `
          *,
          babies!feeding_records_baby_id_fkey(name),
          caregivers!feeding_records_caregiver_id_fkey(name)
        `
        )
        .eq("babies.family_id", family.id)
        .order("feeding_time", { ascending: false });

      if (error) throw error;

      const recordsWithRelations = (data || []).map((record: any) => {
        let duration_minutes = null;

        if (record.breastfeeding_start && record.breastfeeding_end) {
          const startTime = dayjs(record.breastfeeding_start);
          const endTime = dayjs(record.breastfeeding_end);
          duration_minutes = Math.max(1, endTime.diff(startTime, "minutes"));
        }

        return {
          ...record,
          baby_name: record.babies?.name || "Bebê não encontrado",
          caregiver_name: record.caregivers?.name || "Cuidador não encontrado",
          is_feeding:
            record.feeding_type === "amamentacao" &&
            record.breastfeeding_start &&
            !record.breastfeeding_end,
          duration_minutes,
        };
      });

      setFeedingRecords(recordsWithRelations);
    } catch (error: any) {
      setError("Erro ao carregar registros de alimentação");
    } finally {
      setLoading(false);
    }
  };

  const handleStartBreastfeeding = async (babyId: string) => {
    if (!caregiver) return;

    try {
      setLoading(true);

      // Verificar se já existe amamentação em andamento
      const existingFeeding = feedingRecords.find(
        (record) =>
          record.baby_id === babyId &&
          record.feeding_type === "amamentacao" &&
          record.is_feeding
      );

      if (existingFeeding) {
        showSnackbar("Este bebê já está sendo amamentado!", "warning");
        return;
      }

      const { error } = await supabase.from("feeding_records").insert({
        baby_id: babyId,
        caregiver_id: caregiver.id,
        feeding_type: "amamentacao",
        feeding_time: new Date().toISOString(),
        breastfeeding_start: new Date().toISOString(),
        breast_side: "esquerdo",
      });

      if (error) throw error;

      showSnackbar("Amamentação iniciada com sucesso!", "success");
      loadFeedingRecords();
    } catch (error: any) {
      setError(error.message || "Erro ao iniciar amamentação");
    } finally {
      setLoading(false);
    }
  };

  const handleEndBreastfeeding = async (
    recordId: string,
    breastSide?: string
  ) => {
    try {
      setLoading(true);

      const updateData: any = {
        breastfeeding_end: new Date().toISOString(),
      };

      // Se foi fornecido um lado do seio, atualizar também
      if (breastSide) {
        updateData.breast_side = breastSide;
      }

      const { error } = await supabase
        .from("feeding_records")
        .update(updateData)
        .eq("id", recordId);

      if (error) throw error;

      showSnackbar("Amamentação finalizada com sucesso!", "success");
      loadFeedingRecords();
    } catch (error: any) {
      setError(error.message || "Erro ao finalizar amamentação");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (record?: FeedingRecordWithRelations) => {
    if (record) {
      setEditingRecord(record);
      setFormData({
        baby_id: record.baby_id,
        feeding_type: record.feeding_type,
        feeding_time: dayjs(record.feeding_time),
        breastfeeding_start: record.breastfeeding_start
          ? dayjs(record.breastfeeding_start)
          : null,
        breastfeeding_end: record.breastfeeding_end
          ? dayjs(record.breastfeeding_end)
          : null,
        breast_side: record.breast_side || "",
        amount_ml: record.amount_ml ? record.amount_ml.toString() : "",
        food_description: record.food_description || "",
        notes: record.notes || "",
      });
    } else {
      setEditingRecord(null);
      setFormData({
        baby_id: babies[0]?.id || "",
        feeding_type: "",
        feeding_time: dayjs(),
        breastfeeding_start: null,
        breastfeeding_end: null,
        breast_side: "",
        amount_ml: "",
        food_description: "",
        notes: "",
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingRecord(null);
    setFormData({
      baby_id: "",
      feeding_type: "",
      feeding_time: null,
      breastfeeding_start: null,
      breastfeeding_end: null,
      breast_side: "",
      amount_ml: "",
      food_description: "",
      notes: "",
    });
  };

  const handleSubmit = async () => {
    if (
      !caregiver ||
      !formData.baby_id ||
      !formData.feeding_type ||
      !formData.feeding_time
    ) {
      setError("Por favor, preencha os campos obrigatórios");
      return;
    }

    try {
      setLoading(true);

      const feedingData: any = {
        baby_id: formData.baby_id,
        caregiver_id: caregiver.id,
        feeding_type: formData.feeding_type,
        feeding_time: formData.feeding_time.toISOString(),
        notes: formData.notes || null,
      };

      // Campos específicos por tipo de alimentação
      if (formData.feeding_type === "amamentacao") {
        feedingData.breastfeeding_start = formData.breastfeeding_start
          ? formData.breastfeeding_start.toISOString()
          : null;
        feedingData.breastfeeding_end = formData.breastfeeding_end
          ? formData.breastfeeding_end.toISOString()
          : null;
        feedingData.breast_side = formData.breast_side || null;
      } else if (
        formData.feeding_type === "mamadeira" ||
        formData.feeding_type === "agua" ||
        formData.feeding_type === "suco"
      ) {
        feedingData.amount_ml = formData.amount_ml
          ? parseInt(formData.amount_ml)
          : null;
      } else if (
        formData.feeding_type === "papinha" ||
        formData.feeding_type === "fruta" ||
        formData.feeding_type === "outros"
      ) {
        feedingData.food_description = formData.food_description || null;
      }

      if (editingRecord) {
        const { error } = await supabase
          .from("feeding_records")
          .update(feedingData)
          .eq("id", editingRecord.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("feeding_records")
          .insert(feedingData);

        if (error) throw error;
      }

      handleCloseDialog();
      showSnackbar(
        editingRecord
          ? "Registro atualizado com sucesso!"
          : "Registro criado com sucesso!",
        "success"
      );
      loadFeedingRecords();
    } catch (error: any) {
      setError(error.message || "Erro ao salvar registro");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (recordId: string) => {
    try {
      setLoading(true);

      const { error, data } = await supabase
        .from("feeding_records")
        .delete()
        .eq("id", recordId)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        showSnackbar("Nenhum registro foi encontrado para exclusão", "warning");
        return;
      }

      showSnackbar("Registro excluído com sucesso!", "success");
      loadFeedingRecords();
    } catch (error: any) {
      showSnackbar(error.message || "Erro ao excluir registro", "error");
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  };

  const getBreastfeedingBabies = () => {
    return feedingRecords.filter((record) => record.is_feeding);
  };

  const getFeedingTypeInfo = (type: string) => {
    return (
      feedingTypes.find((t) => t.value === type) || { label: type, icon: "🍽️" }
    );
  };

  const getBreastSideLabel = (side: string | null) => {
    if (!side) return "";
    const option = breastSideOptions.find((opt) => opt.value === side);
    return option ? option.label : side;
  };

  if (loading && feedingRecords.length === 0) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <Typography>Carregando...</Typography>
      </Box>
    );
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
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Alimentação
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            disabled={loading}
          >
            Adicionar Registro
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}

        {/* Bebês sendo amamentados atualmente */}
        {getBreastfeedingBabies().length > 0 && (
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography
                variant="h6"
                sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
              >
                <Restaurant color="primary" />
                Amamentando agora
              </Typography>
              <Grid container spacing={2}>
                {getBreastfeedingBabies().map((record) => (
                  <Grid item xs={12} sm={6} md={4} key={record.id}>
                    <Card variant="outlined">
                      <CardContent sx={{ p: 2 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {record.baby_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Desde:{" "}
                          {dayjs(record.breastfeeding_start).format("HH:mm")}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {getBreastSideLabel(record.breast_side)}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 2 }}
                        >
                          Duração:{" "}
                          {formatDuration(
                            dayjs().diff(
                              dayjs(record.breastfeeding_start),
                              "minutes"
                            )
                          )}
                        </Typography>
                        <Button
                          variant="contained"
                          color="secondary"
                          startIcon={<Stop />}
                          onClick={() =>
                            handleFinishBreastfeedingClick(
                              record.id,
                              record.breast_side
                            )
                          }
                          disabled={loading}
                          size="small"
                          fullWidth
                        >
                          Finalizar Amamentação
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Bebês prontos para amamentar - Ações rápidas */}
        {babies.length > 0 && (
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Iniciar Amamentação
              </Typography>
              <Grid container spacing={2}>
                {babies
                  .filter(
                    (baby) =>
                      !getBreastfeedingBabies().some(
                        (record) => record.baby_id === baby.id
                      )
                  )
                  .map((baby) => (
                    <Grid item xs={12} sm={6} md={4} key={baby.id}>
                      <Card variant="outlined">
                        <CardContent sx={{ p: 2 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {baby.name}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 2 }}
                          >
                            Pronto para amamentar
                          </Typography>
                          <Button
                            variant="contained"
                            startIcon={<PlayArrow />}
                            onClick={() => handleStartBreastfeeding(baby.id)}
                            disabled={loading}
                            size="small"
                            fullWidth
                          >
                            Iniciar Amamentação
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Histórico de registros */}
        <Typography variant="h6" sx={{ mb: 3 }}>
          Histórico de Alimentação
        </Typography>

        {feedingRecords.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: "center", py: 6 }}>
              <Restaurant
                sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}
              />
              <Typography variant="h6" gutterBottom>
                Nenhum registro de alimentação
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Comece registrando a alimentação dos seus bebês
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => handleOpenDialog()}
              >
                Primeiro Registro
              </Button>
            </CardContent>
          </Card>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Bebê</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Horário</TableCell>
                  <TableCell>Detalhes</TableCell>
                  <TableCell>Cuidador</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {feedingRecords.map((record) => {
                  const typeInfo = getFeedingTypeInfo(record.feeding_type);
                  return (
                    <TableRow key={record.id}>
                      <TableCell>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Avatar
                            sx={{
                              bgcolor: "primary.main",
                              width: 32,
                              height: 32,
                            }}
                          >
                            <Restaurant sx={{ fontSize: 16 }} />
                          </Avatar>
                          <Typography variant="subtitle2">
                            {record.baby_name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Typography variant="body2">
                            {typeInfo.icon} {typeInfo.label}
                          </Typography>
                          {record.is_feeding && (
                            <Chip
                              label="Em andamento"
                              color="info"
                              size="small"
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {dayjs(record.feeding_time).format(
                            "DD/MM/YYYY HH:mm"
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          {record.feeding_type === "amamentacao" && (
                            <>
                              {record.breast_side && (
                                <Typography variant="body2">
                                  {getBreastSideLabel(record.breast_side)}
                                </Typography>
                              )}
                              {record.duration_minutes && (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  Duração:{" "}
                                  {formatDuration(record.duration_minutes)}
                                </Typography>
                              )}
                              {record.is_feeding &&
                                record.breastfeeding_start && (
                                  <Typography variant="body2" color="primary">
                                    Duração:{" "}
                                    {formatDuration(
                                      dayjs().diff(
                                        dayjs(record.breastfeeding_start),
                                        "minutes"
                                      )
                                    )}
                                  </Typography>
                                )}
                            </>
                          )}
                          {record.amount_ml && (
                            <Typography variant="body2">
                              {record.amount_ml}ml
                            </Typography>
                          )}
                          {record.food_description && (
                            <Typography variant="body2">
                              {record.food_description}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {record.caregiver_name}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          onClick={() => handleOpenDialog(record)}
                          size="small"
                          disabled={loading}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDeleteClick(record.id)}
                          size="small"
                          color="error"
                          disabled={loading}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Dialog de adição/edição */}
        <Dialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {editingRecord
              ? "Editar Registro de Alimentação"
              : "Adicionar Registro de Alimentação"}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Bebê</InputLabel>
                <Select
                  value={formData.baby_id}
                  onChange={(e) =>
                    setFormData({ ...formData, baby_id: e.target.value })
                  }
                  label="Bebê"
                  required
                >
                  {babies.map((baby) => (
                    <MenuItem key={baby.id} value={baby.id}>
                      {baby.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth margin="normal">
                <InputLabel>Tipo de Alimentação</InputLabel>
                <Select
                  value={formData.feeding_type}
                  onChange={(e) =>
                    setFormData({ ...formData, feeding_type: e.target.value })
                  }
                  label="Tipo de Alimentação"
                  required
                >
                  {feedingTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <DateTimePicker
                label="Horário da Alimentação"
                value={formData.feeding_time}
                onChange={(date) =>
                  setFormData({ ...formData, feeding_time: date })
                }
                slotProps={{
                  textField: {
                    fullWidth: true,
                    margin: "normal",
                    required: true,
                  },
                }}
                maxDateTime={dayjs()}
              />

              {/* Campos específicos para amamentação */}
              {formData.feeding_type === "amamentacao" && (
                <>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Seio</InputLabel>
                    <Select
                      value={formData.breast_side}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          breast_side: e.target.value,
                        })
                      }
                      label="Seio"
                    >
                      {breastSideOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <DateTimePicker
                    label="Início da Amamentação"
                    value={formData.breastfeeding_start}
                    onChange={(date) =>
                      setFormData({ ...formData, breastfeeding_start: date })
                    }
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        margin: "normal",
                      },
                    }}
                    maxDateTime={dayjs()}
                  />

                  <DateTimePicker
                    label="Fim da Amamentação (opcional)"
                    value={formData.breastfeeding_end}
                    onChange={(date) =>
                      setFormData({ ...formData, breastfeeding_end: date })
                    }
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        margin: "normal",
                        helperText: "Deixe vazio se ainda estiver amamentando",
                      },
                    }}
                    minDateTime={formData.breastfeeding_start}
                    maxDateTime={dayjs()}
                  />
                </>
              )}

              {/* Campo para quantidade (mamadeira, água, suco) */}
              {(formData.feeding_type === "mamadeira" ||
                formData.feeding_type === "agua" ||
                formData.feeding_type === "suco") && (
                <TextField
                  fullWidth
                  label="Quantidade"
                  type="number"
                  value={formData.amount_ml}
                  onChange={(e) =>
                    setFormData({ ...formData, amount_ml: e.target.value })
                  }
                  margin="normal"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">ml</InputAdornment>
                    ),
                  }}
                  placeholder="Ex: 150"
                />
              )}

              {/* Campo para descrição (papinha, fruta, outros) */}
              {(formData.feeding_type === "papinha" ||
                formData.feeding_type === "fruta" ||
                formData.feeding_type === "outros") && (
                <TextField
                  fullWidth
                  label="Descrição do Alimento"
                  value={formData.food_description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      food_description: e.target.value,
                    })
                  }
                  margin="normal"
                  placeholder="Ex: papinha de cenoura, maçã picada..."
                />
              )}

              <TextField
                fullWidth
                label="Observações"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                margin="normal"
                multiline
                rows={3}
                placeholder="Ex: comeu bem, teve dificuldades..."
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} disabled={loading}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={loading}
            >
              {loading ? "Salvando..." : editingRecord ? "Salvar" : "Adicionar"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal de Confirmação */}
        <Dialog
          open={confirmDialogOpen}
          onClose={handleCancelDelete}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Warning color="warning" />
            Confirmar Exclusão
          </DialogTitle>
          <DialogContent>
            <Typography>
              Tem certeza que deseja excluir este registro de alimentação? Esta
              ação não pode ser desfeita.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancelDelete} color="inherit">
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmDelete}
              color="error"
              variant="contained"
              disabled={loading}
            >
              Excluir
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal de Finalizar Amamentação */}
        <Dialog
          open={finishBreastfeedingOpen}
          onClose={handleCancelFinishBreastfeeding}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Restaurant color="primary" />
            Finalizar Amamentação
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Qual seio foi utilizado na amamentação?
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Seio Utilizado</InputLabel>
              <Select
                value={selectedBreastSide}
                onChange={(e) => setSelectedBreastSide(e.target.value)}
                label="Seio Utilizado"
              >
                {breastSideOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancelFinishBreastfeeding} color="inherit">
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmFinishBreastfeeding}
              color="primary"
              variant="contained"
              disabled={loading}
              startIcon={<Stop />}
            >
              Finalizar
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar para notificações */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{
              width: "100%",
              borderRadius: 2,
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
            }}
            icon={
              snackbar.severity === "success" ? (
                <CheckCircle />
              ) : snackbar.severity === "error" ? (
                <ErrorIcon />
              ) : snackbar.severity === "warning" ? (
                <Warning />
              ) : (
                <Info />
              )
            }
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
}
