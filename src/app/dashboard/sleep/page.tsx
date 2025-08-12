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
  Fab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Snackbar,
} from "@mui/material";
import {
  Add,
  Bedtime,
  Edit,
  Delete,
  PlayArrow,
  Stop,
  AccessTime,
  LocationOn,
  Person,
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

interface SleepRecord {
  id: string;
  baby_id: string;
  caregiver_id: string;
  sleep_start: string;
  sleep_end: string | null;
  sleep_location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface SleepRecordWithRelations extends SleepRecord {
  baby_name: string;
  caregiver_name: string;
  duration_minutes?: number;
  is_sleeping: boolean;
}

interface SleepFormData {
  baby_id: string;
  sleep_start: dayjs.Dayjs | null;
  sleep_end: dayjs.Dayjs | null;
  sleep_location: string;
  notes: string;
}

const sleepLocationOptions = [
  { value: "berco", label: "Berço" },
  { value: "colo", label: "Colo" },
  { value: "carrinho", label: "Carrinho" },
  { value: "cama_pais", label: "Cama dos Pais" },
  { value: "sofa", label: "Sofá" },
  { value: "outro", label: "Outro" },
];

export default function SleepPage() {
  const { family, caregiver } = useAuth();
  const [sleepRecords, setSleepRecords] = useState<SleepRecordWithRelations[]>(
    []
  );
  const [babies, setBabies] = useState<Baby[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] =
    useState<SleepRecordWithRelations | null>(null);
  const [formData, setFormData] = useState<SleepFormData>({
    baby_id: "",
    sleep_start: null,
    sleep_end: null,
    sleep_location: "",
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

  useEffect(() => {
    if (family) {
      loadBabies();
      loadSleepRecords();
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

  const loadSleepRecords = async () => {
    if (!family) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("sleep_records")
        .select(
          `
          *,
          babies!sleep_records_baby_id_fkey(name),
          caregivers!sleep_records_caregiver_id_fkey(name)
        `
        )
        .eq("babies.family_id", family.id)
        .order("sleep_start", { ascending: false });

      if (error) throw error;

      const recordsWithRelations = (data || []).map((record: any) => {
        let duration_minutes = null;

        if (record.sleep_end) {
          // Calcular duração exata entre início e fim
          const startTime = dayjs(record.sleep_start);
          const endTime = dayjs(record.sleep_end);
          duration_minutes = Math.max(1, endTime.diff(startTime, "minutes")); // Mínimo 1 minuto
        }

        return {
          ...record,
          baby_name: record.babies?.name || "Bebê não encontrado",
          caregiver_name: record.caregivers?.name || "Cuidador não encontrado",
          is_sleeping: !record.sleep_end,
          duration_minutes,
        };
      });

      setSleepRecords(recordsWithRelations);
    } catch (error: any) {
      setError("Erro ao carregar registros de sono");
    } finally {
      setLoading(false);
    }
  };

  const handleStartSleep = async (babyId: string) => {
    if (!caregiver) return;

    try {
      setLoading(true);

      // Verificar se já existe um sono em andamento nos dados já carregados
      const existingSleep = sleepRecords.find(
        (record) => record.baby_id === babyId && record.is_sleeping
      );

      if (existingSleep) {
        showSnackbar("Este bebê já está dormindo!", "warning");
        return;
      }

      const { error } = await supabase.from("sleep_records").insert({
        baby_id: babyId,
        caregiver_id: caregiver.id,
        sleep_start: new Date().toISOString(),
        sleep_location: "berco",
      });

      if (error) throw error;

      showSnackbar("Sono iniciado com sucesso!", "success");
      loadSleepRecords();
    } catch (error: any) {
      setError(error.message || "Erro ao iniciar sono");
    } finally {
      setLoading(false);
    }
  };

  const handleEndSleep = async (recordId: string) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from("sleep_records")
        .update({
          sleep_end: new Date().toISOString(),
        })
        .eq("id", recordId);

      if (error) throw error;

      showSnackbar("Sono finalizado com sucesso!", "success");
      loadSleepRecords();
    } catch (error: any) {
      setError(error.message || "Erro ao finalizar sono");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (record?: SleepRecordWithRelations) => {
    if (record) {
      setEditingRecord(record);
      setFormData({
        baby_id: record.baby_id,
        sleep_start: dayjs(record.sleep_start),
        sleep_end: record.sleep_end ? dayjs(record.sleep_end) : null,
        sleep_location: record.sleep_location || "",
        notes: record.notes || "",
      });
    } else {
      setEditingRecord(null);
      setFormData({
        baby_id: babies[0]?.id || "",
        sleep_start: dayjs(),
        sleep_end: null,
        sleep_location: "",
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
      sleep_start: null,
      sleep_end: null,
      sleep_location: "",
      notes: "",
    });
  };

  const handleSubmit = async () => {
    if (!caregiver || !formData.baby_id || !formData.sleep_start) {
      setError("Por favor, preencha os campos obrigatórios");
      return;
    }

    try {
      setLoading(true);

      const sleepData = {
        baby_id: formData.baby_id,
        caregiver_id: caregiver.id,
        sleep_start: formData.sleep_start.toISOString(),
        sleep_end: formData.sleep_end ? formData.sleep_end.toISOString() : null,
        sleep_location: formData.sleep_location || null,
        notes: formData.notes || null,
      };

      if (editingRecord) {
        const { error } = await supabase
          .from("sleep_records")
          .update(sleepData)
          .eq("id", editingRecord.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("sleep_records")
          .insert(sleepData);

        if (error) throw error;
      }

      handleCloseDialog();
      showSnackbar(
        editingRecord
          ? "Registro atualizado com sucesso!"
          : "Registro criado com sucesso!",
        "success"
      );
      loadSleepRecords();
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
        .from("sleep_records")
        .delete()
        .eq("id", recordId)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        showSnackbar("Nenhum registro foi encontrado para exclusão", "warning");
        return;
      }

      showSnackbar("Registro excluído com sucesso!", "success");
      loadSleepRecords();
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

  const getSleepingBabies = () => {
    return sleepRecords.filter((record) => record.is_sleeping);
  };

  if (loading && sleepRecords.length === 0) {
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
            Sono
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

        {/* Bebês dormindo atualmente */}
        {getSleepingBabies().length > 0 && (
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography
                variant="h6"
                sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
              >
                <Bedtime color="primary" />
                Dormindo agora
              </Typography>
              <Grid container spacing={2}>
                {getSleepingBabies().map((record) => (
                  <Grid item xs={12} sm={6} md={4} key={record.id}>
                    <Card variant="outlined">
                      <CardContent sx={{ p: 2 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {record.baby_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Desde: {dayjs(record.sleep_start).format("HH:mm")}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 2 }}
                        >
                          Duração:{" "}
                          {formatDuration(
                            dayjs().diff(dayjs(record.sleep_start), "minutes")
                          )}
                        </Typography>
                        <Button
                          variant="contained"
                          color="secondary"
                          startIcon={<Stop />}
                          onClick={() => handleEndSleep(record.id)}
                          disabled={loading}
                          size="small"
                          fullWidth
                        >
                          Finalizar Sono
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Bebês acordados - Ações rápidas */}
        {babies.length > 0 && (
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Iniciar Sono
              </Typography>
              <Grid container spacing={2}>
                {babies
                  .filter(
                    (baby) =>
                      !getSleepingBabies().some(
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
                            Pronto para dormir
                          </Typography>
                          <Button
                            variant="contained"
                            startIcon={<PlayArrow />}
                            onClick={() => handleStartSleep(baby.id)}
                            disabled={loading}
                            size="small"
                            fullWidth
                          >
                            Iniciar Sono
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
          Histórico de Sono
        </Typography>

        {sleepRecords.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: "center", py: 6 }}>
              <Bedtime sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Nenhum registro de sono
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Comece registrando o sono dos seus bebês
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
                  <TableCell>Início</TableCell>
                  <TableCell>Fim</TableCell>
                  <TableCell>Duração</TableCell>
                  <TableCell>Local</TableCell>
                  <TableCell>Cuidador</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sleepRecords.map((record) => (
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
                          <Bedtime sx={{ fontSize: 16 }} />
                        </Avatar>
                        <Typography variant="subtitle2">
                          {record.baby_name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {dayjs(record.sleep_start).format("DD/MM/YYYY HH:mm")}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {record.sleep_end ? (
                        <Typography variant="body2">
                          {dayjs(record.sleep_end).format("DD/MM/YYYY HH:mm")}
                        </Typography>
                      ) : (
                        <Chip label="Dormindo" color="info" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      {record.duration_minutes ? (
                        <Typography variant="body2">
                          {formatDuration(record.duration_minutes)}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="primary">
                          {formatDuration(
                            dayjs().diff(dayjs(record.sleep_start), "minutes")
                          )}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {record.sleep_location && (
                        <Typography variant="body2">
                          {sleepLocationOptions.find(
                            (opt) => opt.value === record.sleep_location
                          )?.label || record.sleep_location}
                        </Typography>
                      )}
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
                ))}
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
              ? "Editar Registro de Sono"
              : "Adicionar Registro de Sono"}
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

              <DateTimePicker
                label="Início do Sono"
                value={formData.sleep_start}
                onChange={(date) =>
                  setFormData({ ...formData, sleep_start: date })
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

              <DateTimePicker
                label="Fim do Sono (opcional)"
                value={formData.sleep_end}
                onChange={(date) =>
                  setFormData({ ...formData, sleep_end: date })
                }
                slotProps={{
                  textField: {
                    fullWidth: true,
                    margin: "normal",
                    helperText: "Deixe vazio se ainda estiver dormindo",
                  },
                }}
                minDateTime={formData.sleep_start ?? undefined}
                maxDateTime={dayjs()}
              />

              <FormControl fullWidth margin="normal">
                <InputLabel>Local do Sono</InputLabel>
                <Select
                  value={formData.sleep_location}
                  onChange={(e) =>
                    setFormData({ ...formData, sleep_location: e.target.value })
                  }
                  label="Local do Sono"
                >
                  <MenuItem value="">Não informar</MenuItem>
                  {sleepLocationOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

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
                placeholder="Ex: dormiu tranquilo, acordou chorando..."
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
              Tem certeza que deseja excluir este registro de sono? Esta ação
              não pode ser desfeita.
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
